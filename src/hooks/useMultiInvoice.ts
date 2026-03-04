/**
 * useMultiInvoice - Hook for managing multiple invoice uploads
 * 
 * Handles:
 * - Auto-pairing XML/PDF files by matching filenames
 * - Progressive validation and AI extraction per pair
 * - Queue management with status tracking
 * - Batch submission of all validated invoices
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { InvoiceData, PaymentProgram, PRONTO_PAGO_FEE_RATE, LateInvoiceReason, CreditNoteData, CreditNoteValidation } from '../types/invoice';
import { InvoiceEntry, InvoiceEntryStatus, FilePairResult, QueueSummary, BatchSubmitResult } from '../types/multiInvoice';
import { extractInvoiceData } from '../services/openaiService';
import { extractUuidFromXml, getFileBaseName, validateMatchingFilenames } from '../utils/xmlParser';
import { validateInvoiceWeek as validateWeekUtil, BillingPeriodType } from '../utils/weekValidation';
import { validateInvoiceWeek as validateWeekDates } from '../utils/dates';
import { submitInvoice } from '../services/webhookService';
import { ValidationAlert } from './useInvoiceExtraction';

interface UseMultiInvoiceProps {
  projects: Array<{ code: string; name: string; billing_period_type?: BillingPeriodType }>;
  onAlert?: (alert: ValidationAlert) => void;
}

// Helper: generate unique ID
const generateId = (): string => `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Helper: normalize baseName for matching
const normalizeBaseName = (filename: string): string => {
  return getFileBaseName(filename).toLowerCase().trim();
};

/**
 * Pair uploaded files by matching XML/PDF filenames
 */
export const pairFiles = (files: File[]): FilePairResult => {
  const xmlFiles = new Map<string, File>();
  const pdfFiles = new Map<string, File>();
  const errors: string[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const baseName = normalizeBaseName(file.name);

    if (ext === 'xml') {
      if (xmlFiles.has(baseName)) {
        errors.push(`XML duplicado: "${file.name}"`);
      } else {
        xmlFiles.set(baseName, file);
      }
    } else if (ext === 'pdf') {
      if (pdfFiles.has(baseName)) {
        errors.push(`PDF duplicado: "${file.name}"`);
      } else {
        pdfFiles.set(baseName, file);
      }
    } else {
      errors.push(`Tipo de archivo no soportado: "${file.name}" (solo XML y PDF)`);
    }
  }

  // Match pairs
  const paired: FilePairResult['paired'] = [];
  const unpaired: FilePairResult['unpaired'] = [];

  for (const [baseName, xmlFile] of xmlFiles) {
    const pdfFile = pdfFiles.get(baseName);
    if (pdfFile) {
      paired.push({ baseName, xml: xmlFile, pdf: pdfFile });
      pdfFiles.delete(baseName);
    } else {
      unpaired.push({ file: xmlFile, type: 'xml', baseName });
    }
  }

  for (const [baseName, pdfFile] of pdfFiles) {
    unpaired.push({ file: pdfFile, type: 'pdf', baseName });
  }

  return { paired, unpaired, errors };
};

export const useMultiInvoice = ({ projects, onAlert }: UseMultiInvoiceProps) => {
  const [entries, setEntries] = useState<InvoiceEntry[]>([]);
  const [unpairedFiles, setUnpairedFiles] = useState<FilePairResult['unpaired']>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  // Ref to always have synchronous access to latest entries
  // React 18 auto-batching can defer setState updaters, making the
  // "read state via setState" anti-pattern unreliable
  const entriesRef = useRef<InvoiceEntry[]>([]);
  entriesRef.current = entries;

  // Ref to track processing queue and prevent race conditions
  const processingRef = useRef(false);
  const processingQueueRef = useRef<string[]>([]);

  /**
   * Add files to the queue - auto-pairs XML/PDF
   */
  const addFiles = useCallback((files: File[]) => {
    console.log(`📁 [addFiles] Received ${files.length} files:`, files.map(f => f.name));
    const { paired, unpaired, errors } = pairFiles(files);
    console.log(`📁 [addFiles] Paired: ${paired.length}, Unpaired: ${unpaired.length}, Errors: ${errors.length}`);

    // Show errors for unsupported files
    if (errors.length > 0) {
      onAlert?.({
        type: 'warning',
        title: 'Archivos no válidos',
        message: errors.join('\n'),
      });
    }

    // Add unpaired files (might complete existing entries)
    if (unpaired.length > 0) {
      setUnpairedFiles(prev => {
        const updated = [...prev];
        const newUnpaired: FilePairResult['unpaired'] = [];

        for (const item of unpaired) {
          // Check if there's a matching unpaired file already
          const matchIdx = updated.findIndex(
            u => u.baseName === item.baseName && u.type !== item.type
          );

          if (matchIdx >= 0) {
            // Found a match! Create a pair
            const match = updated[matchIdx];
            const xml = item.type === 'xml' ? item.file : match.file;
            const pdf = item.type === 'pdf' ? item.file : match.file;
            paired.push({ baseName: item.baseName, xml, pdf });
            updated.splice(matchIdx, 1);
          } else {
            newUnpaired.push(item);
          }
        }

        return [...updated, ...newUnpaired];
      });
    }

    // Create entries for paired files
    if (paired.length > 0) {
      const newEntries: InvoiceEntry[] = paired.map(({ baseName, xml, pdf }) => ({
        id: generateId(),
        status: 'validating' as InvoiceEntryStatus,
        baseName,
        xmlFile: xml,
        pdfFile: pdf,
        formData: null,
        error: null,
        isExpanded: false,
        isLate: false,
        lateReasons: [],
        lateAcknowledged: false,
      }));

      setEntries(prev => {
        // Check for duplicate baseNames (already in queue)
        const existingBaseNames = new Set(prev.map(e => e.baseName));
        const filteredNew = newEntries.filter(e => {
          if (existingBaseNames.has(e.baseName)) {
            onAlert?.({
              type: 'warning',
              title: 'Archivo duplicado',
              message: `"${e.baseName}" ya está en la cola de procesamiento.`,
            });
            return false;
          }
          return true;
        });

        // Add new entries and queue them for processing
        for (const entry of filteredNew) {
          processingQueueRef.current.push(entry.id);
        }

        console.log(`📁 [addFiles] Added ${filteredNew.length} entries. Queue IDs:`, processingQueueRef.current);
        return [...prev, ...filteredNew];
      });

      // Reset confirmation when new files are added
      setIsConfirmed(false);
    }
  }, [onAlert]);

  /**
   * Process a single entry: validate then extract
   */
  const processEntry = useCallback(async (entryId: string) => {
    // Read entry from ref (synchronous, reliable in React 18)
    const entry = entriesRef.current.find(e => e.id === entryId);

    console.log(`📋 [processEntry] Starting for: ${entryId}`);
    console.log(`📋 [processEntry] Entry found: ${!!entry}, xmlFile: ${!!entry?.xmlFile}, pdfFile: ${!!entry?.pdfFile}`);

    if (!entry || !entry.xmlFile || !entry.pdfFile) {
      console.warn(`⚠️ [processEntry] Skipping ${entryId}: entry not found or missing files`);
      return;
    }

    const xmlFile = entry.xmlFile;
    const pdfFile = entry.pdfFile;

    // Step 1: Validate filenames match
    console.log(`📋 [processEntry] Step 1: Validating filenames...`);
    const filenameValidation = validateMatchingFilenames(xmlFile, pdfFile);
    if (!filenameValidation.valid) {
      console.warn(`⚠️ [processEntry] Filename mismatch: ${filenameValidation.error}`);
      setEntries(prev => prev.map(e =>
        e.id === entryId
          ? { ...e, status: 'error' as InvoiceEntryStatus, error: filenameValidation.error || 'Los nombres de archivo no coinciden' }
          : e
      ));
      return;
    }

    // Step 2: Extract UUID from XML and check for duplicates
    console.log(`📋 [processEntry] Step 2: Extracting UUID from XML...`);
    let uuidCheckFailed = false;
    try {
      const uuid = await extractUuidFromXml(xmlFile);
      console.log(`📋 [processEntry] UUID extracted: ${uuid || 'not found'}`);
      
      if (uuid) {
        // Check if UUID exists in database
        const response = await fetch('/api/validate', {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid }),
        });
        const data = await response.json();
        console.log(`📋 [processEntry] UUID exists in DB: ${data.exists}`);

        if (data.exists) {
          setEntries(prev => prev.map(e =>
            e.id === entryId
              ? { ...e, status: 'error' as InvoiceEntryStatus, error: `Factura ya registrada (UUID: ${uuid.substring(0, 8)}...)` }
              : e
          ));
          uuidCheckFailed = true;
        }

        if (!uuidCheckFailed) {
          // Also check if UUID is duplicate within current queue
          const existingUuids = entriesRef.current
            .filter(e => e.id !== entryId && e.formData?.uuid)
            .map(e => e.formData!.uuid.toUpperCase());
          
          if (existingUuids.includes(uuid.toUpperCase())) {
            setEntries(prev => prev.map(e =>
              e.id === entryId
                ? { ...e, status: 'error' as InvoiceEntryStatus, error: 'UUID duplicado en esta carga' }
                : e
            ));
            uuidCheckFailed = true;
          }
        }
      }
    } catch (err) {
      console.warn('Pre-validation warning:', err);
      // Continue with extraction even if pre-validation has issues
    }

    // Check if entry was marked as error during UUID check
    if (uuidCheckFailed) {
      console.warn(`⚠️ [processEntry] UUID check failed, skipping extraction`);
      return;
    }

    // Step 3: AI Extraction
    console.log(`📋 [processEntry] Step 3: Starting AI extraction...`);
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, status: 'extracting' as InvoiceEntryStatus } : e
    ));

    try {
      console.log(`📋 [processEntry] Calling extractInvoiceData...`);
      const data = await extractInvoiceData(xmlFile, pdfFile);
      console.log(`📋 [processEntry] Extraction result: UUID=${data.uuid}, project=${data.project}, total=${data.totalAmount}`);

      // Step 4: Validate project exists
      if (data.project && projects.length > 0) {
        const normalizedName = data.project.toUpperCase().replace(/ /g, '_');
        const projectExists = projects.some(p =>
          p.code.toUpperCase() === normalizedName ||
          p.name.toUpperCase() === data.project?.toUpperCase()
        );

        if (!projectExists) {
          setEntries(prev => prev.map(e =>
            e.id === entryId
              ? { ...e, status: 'error' as InvoiceEntryStatus, error: `Proyecto "${data.project}" no registrado en el sistema` }
              : e
          ));
          return;
        }
      }

      // Step 5: Validate invoice week
      let isLate = false;
      let lateReasons: LateInvoiceReason[] = [];

      if (data.invoiceDate) {
        const detectedProject = projects.find(p =>
          p.code.toUpperCase() === data.project?.toUpperCase().replace(/ /g, '_') ||
          p.name.toUpperCase() === data.project?.toUpperCase()
        );
        const billingPeriodType: BillingPeriodType = detectedProject?.billing_period_type || 'standard';
        const weekValidation = validateWeekUtil(data.invoiceDate, billingPeriodType);

        if (!weekValidation.valid) {
          isLate = true;
          lateReasons = ['after_deadline']; // Simplified; could be more granular
        }
      }

      // Build InvoiceData from extraction result
      const formData: InvoiceData = {
        week: '',
        year: new Date().getFullYear(),
        expectedWeek: 0,
        weekFromDescription: data.weekFromDescription,
        project: data.project || '',
        needsProjectReview: data.needsProjectReview || false,
        isLate,
        lateReasons,
        lateAcknowledged: false,
        issuerRfc: data.issuerRfc || '',
        issuerName: data.issuerName || '',
        issuerRegime: data.issuerRegime || '',
        issuerZipCode: data.issuerZipCode || '',
        receiverRfc: data.receiverRfc || '',
        receiverName: data.receiverName || '',
        receiverRegime: data.receiverRegime || '',
        receiverZipCode: data.receiverZipCode || '',
        cfdiUse: data.cfdiUse || '',
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        folio: data.folio || '',
        series: data.series || '',
        uuid: data.uuid || '',
        certificationDate: data.certificationDate || '',
        satCertNumber: data.satCertNumber || '',
        paymentMethod: data.paymentMethod || '',
        paymentForm: data.paymentForm || '',
        paymentConditions: data.paymentConditions || '',
        subtotal: data.subtotal?.toString() || '',
        totalTax: data.totalTax?.toString() || '',
        retentionIva: data.retentionIva?.toString() || '',
        retentionIvaRate: data.retentionIvaRate || 0,
        retentionIsr: data.retentionIsr?.toString() || '',
        retentionIsrRate: data.retentionIsrRate || 0,
        totalAmount: data.totalAmount?.toString() || '',
        currency: data.currency || 'MXN',
        exchangeRate: data.exchangeRate || '',
        paymentProgram: 'standard',
        prontoPagoFeeRate: 0,
        prontoPagoFeeAmount: 0,
        netPaymentAmount: 0,
        items: data.items || [],
        email: '',
        phoneNumber: '',
        xmlFile,
        pdfFile,
        creditNoteXmlFile: null,
        creditNotePdfFile: null,
        creditNoteData: null,
        creditNoteValidation: null,
      };

      // Calculate week from invoice date
      if (data.invoiceDate) {
        const detectedProject = projects.find(p =>
          p.code.toUpperCase() === data.project?.toUpperCase().replace(/ /g, '_') ||
          p.name.toUpperCase() === data.project?.toUpperCase()
        );
        const billingPeriodType: BillingPeriodType = detectedProject?.billing_period_type || 'standard';
        const weekResult = validateWeekDates(data.invoiceDate, data.weekFromDescription, billingPeriodType);

        formData.week = weekResult.expectedWeek.toString();
        formData.year = weekResult.expectedYear;
        formData.expectedWeek = weekResult.expectedWeek;
        formData.isLate = weekResult.isLate;
        formData.lateReasons = weekResult.reasons;
        isLate = weekResult.isLate;
        lateReasons = weekResult.reasons;
      }

      setEntries(prev => prev.map(e =>
        e.id === entryId
          ? {
            ...e,
            status: 'extracted' as InvoiceEntryStatus,
            formData,
            isLate,
            lateReasons,
            error: null,
          }
          : e
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setEntries(prev => prev.map(e =>
        e.id === entryId
          ? { ...e, status: 'error' as InvoiceEntryStatus, error: `Error de extracción: ${errorMessage}` }
          : e
      ));
    }
  }, [projects, onAlert]);

  /**
   * Process the next entry in the queue
   */
  const processNextInQueue = useCallback(async () => {
    console.log(`🔄 [processNextInQueue] Called. processing=${processingRef.current}, queueLength=${processingQueueRef.current.length}`);
    
    if (processingRef.current) {
      console.log(`🔄 [processNextInQueue] Already processing, skipping`);
      return;
    }
    if (processingQueueRef.current.length === 0) {
      console.log(`🔄 [processNextInQueue] Queue empty, nothing to process`);
      return;
    }

    processingRef.current = true;
    const nextId = processingQueueRef.current.shift()!;
    console.log(`🔄 [processNextInQueue] Processing entry: ${nextId} (${processingQueueRef.current.length} remaining)`);

    try {
      await processEntry(nextId);
    } catch (err) {
      console.error(`❌ [processNextInQueue] Error processing ${nextId}:`, err);
    } finally {
      processingRef.current = false;
      // Continue processing queue
      if (processingQueueRef.current.length > 0) {
        console.log(`🔄 [processNextInQueue] More entries in queue, scheduling next in 500ms`);
        setTimeout(() => processNextInQueue(), 500);
      } else {
        console.log(`🔄 [processNextInQueue] Queue fully processed`);
      }
    }
  }, [processEntry]);

  // Auto-process queue when new entries are added
  useEffect(() => {
    const queueLen = processingQueueRef.current.length;
    const isProcessing = processingRef.current;
    console.log(`⚡ [useEffect] entries.length=${entries.length}, queueLength=${queueLen}, processing=${isProcessing}`);
    
    if (queueLen > 0 && !isProcessing) {
      console.log(`⚡ [useEffect] Triggering processNextInQueue`);
      processNextInQueue();
    }
  }, [entries.length, processNextInQueue]);

  /**
   * Remove an entry from the queue
   */
  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    processingQueueRef.current = processingQueueRef.current.filter(qId => qId !== id);
    setIsConfirmed(false);
  }, []);

  /**
   * Toggle card expansion
   */
  const toggleExpand = useCallback((id: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, isExpanded: !e.isExpanded } : e
    ));
  }, []);

  /**
   * Acknowledge late invoice for a specific entry
   */
  const acknowledgeLate = useCallback((id: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, lateAcknowledged: true } : e
    ));
  }, []);

  /**
   * Set payment program for a specific entry
   * Clears credit note data when switching back to standard
   */
  const setEntryPaymentProgram = useCallback((id: string, program: PaymentProgram) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id || !e.formData) return e;
      const total = parseFloat(e.formData.totalAmount) || 0;
      const feeRate = program === 'pronto_pago' ? PRONTO_PAGO_FEE_RATE : 0;
      const feeAmount = total * feeRate;
      const netAmount = total - feeAmount;

      return {
        ...e,
        formData: {
          ...e.formData,
          paymentProgram: program,
          prontoPagoFeeRate: feeRate,
          prontoPagoFeeAmount: Math.round(feeAmount * 100) / 100,
          netPaymentAmount: Math.round(netAmount * 100) / 100,
          // Clear credit note when switching back to standard
          ...(program === 'standard' ? {
            creditNoteXmlFile: null,
            creditNotePdfFile: null,
            creditNoteData: null,
            creditNoteValidation: null,
          } : {}),
        },
      };
    }));
  }, []);

  /**
   * Set credit note XML file for a specific entry
   */
  const setEntryCreditNoteXml = useCallback((id: string, file: File | null) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id || !e.formData) return e;
      return {
        ...e,
        formData: {
          ...e.formData,
          creditNoteXmlFile: file,
          // Clear validation when XML changes (will be re-validated by CreditNoteUpload)
          ...(file === null ? { creditNoteData: null, creditNoteValidation: null } : {}),
        },
      };
    }));
  }, []);

  /**
   * Set credit note PDF file for a specific entry
   */
  const setEntryCreditNotePdf = useCallback((id: string, file: File | null) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id || !e.formData) return e;
      return {
        ...e,
        formData: {
          ...e.formData,
          creditNotePdfFile: file,
        },
      };
    }));
  }, []);

  /**
   * Set credit note validation result for a specific entry
   */
  const setEntryCreditNoteValidation = useCallback((id: string, validation: CreditNoteValidation | null, data: CreditNoteData | null) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id || !e.formData) return e;
      return {
        ...e,
        formData: {
          ...e.formData,
          creditNoteValidation: validation,
          creditNoteData: data,
        },
      };
    }));
  }, []);

  /**
   * Retry a failed entry
   */
  const retryEntry = useCallback((id: string) => {
    console.log(`🔁 [retryEntry] Retrying: ${id}`);
    setEntries(prev => prev.map(e =>
      e.id === id
        ? { ...e, status: 'validating' as InvoiceEntryStatus, error: null }
        : e
    ));
    processingQueueRef.current.push(id);
    if (!processingRef.current) {
      processNextInQueue();
    }
  }, [processNextInQueue]);

  /**
   * Clear all entries
   */
  const clearAll = useCallback(() => {
    setEntries([]);
    setUnpairedFiles([]);
    setIsConfirmed(false);
    setIsSubmittingAll(false);
    processingQueueRef.current = [];
    processingRef.current = false;
  }, []);

  /**
   * Remove unpaired file
   */
  const removeUnpairedFile = useCallback((baseName: string, type: 'xml' | 'pdf') => {
    setUnpairedFiles(prev => prev.filter(f => !(f.baseName === baseName && f.type === type)));
  }, []);

  /**
   * Submit all validated invoices
   */
  const submitAll = useCallback(async (): Promise<BatchSubmitResult> => {
    const readyEntries = entries.filter(e =>
      e.status === 'extracted' &&
      e.formData &&
      (!e.isLate || e.lateAcknowledged) &&
      // If pronto_pago, credit note must be valid
      (e.formData.paymentProgram !== 'pronto_pago' || e.formData.creditNoteValidation?.isValid === true)
    );

    if (readyEntries.length === 0) {
      return { total: 0, successful: 0, failed: 0, results: [] };
    }

    setIsSubmittingAll(true);
    const results: BatchSubmitResult['results'] = [];

    for (const entry of readyEntries) {
      // Update status to submitting
      setEntries(prev => prev.map(e =>
        e.id === entry.id ? { ...e, status: 'submitting' as InvoiceEntryStatus } : e
      ));

      try {
        // Add contact info to form data
        const formDataWithContact: InvoiceData = {
          ...entry.formData!,
          email: contactEmail,
          phoneNumber: contactPhone,
        };

        const result = await submitInvoice(formDataWithContact);

        setEntries(prev => prev.map(e =>
          e.id === entry.id
            ? {
              ...e,
              status: result.success ? 'submitted' as InvoiceEntryStatus : 'submit_error' as InvoiceEntryStatus,
              submitMessage: result.message,
            }
            : e
        ));

        results.push({
          id: entry.id,
          baseName: entry.baseName,
          success: result.success,
          message: result.message,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setEntries(prev => prev.map(e =>
          e.id === entry.id
            ? { ...e, status: 'submit_error' as InvoiceEntryStatus, submitMessage: errorMsg }
            : e
        ));

        results.push({
          id: entry.id,
          baseName: entry.baseName,
          success: false,
          message: errorMsg,
        });
      }

      // Small delay between submissions to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsSubmittingAll(false);

    return {
      total: readyEntries.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }, [entries, contactEmail, contactPhone]);

  /**
   * Calculate queue summary
   */
  const summary: QueueSummary = {
    total: entries.length,
    pairing: entries.filter(e => e.status === 'pairing').length,
    validating: entries.filter(e => e.status === 'validating').length,
    extracting: entries.filter(e => e.status === 'extracting').length,
    extracted: entries.filter(e => e.status === 'extracted').length,
    error: entries.filter(e => e.status === 'error').length,
    submitting: entries.filter(e => e.status === 'submitting').length,
    submitted: entries.filter(e => e.status === 'submitted').length,
    readyToSubmit: entries.filter(e =>
      e.status === 'extracted' &&
      (!e.isLate || e.lateAcknowledged) &&
      // If pronto_pago, credit note must be valid
      (e.formData?.paymentProgram !== 'pronto_pago' || e.formData?.creditNoteValidation?.isValid === true)
    ).length,
  };

  const isProcessing = summary.validating > 0 || summary.extracting > 0 || summary.submitting > 0;

  const canSubmitAll =
    isConfirmed &&
    !isSubmittingAll &&
    !isProcessing &&
    summary.readyToSubmit > 0 &&
    contactEmail.trim().length > 0;

  const toggleConfirmation = useCallback(() => {
    setIsConfirmed(prev => !prev);
  }, []);

  return {
    // State
    entries,
    unpairedFiles,
    contactEmail,
    contactPhone,
    isConfirmed,
    isSubmittingAll,
    summary,
    isProcessing,
    canSubmitAll,

    // Actions
    addFiles,
    removeEntry,
    toggleExpand,
    acknowledgeLate,
    setEntryPaymentProgram,
    setEntryCreditNoteXml,
    setEntryCreditNotePdf,
    setEntryCreditNoteValidation,
    retryEntry,
    clearAll,
    removeUnpairedFile,
    submitAll,
    setContactEmail,
    setContactPhone,
    toggleConfirmation,
  };
};
