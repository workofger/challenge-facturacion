import { InvoiceData, WebhookPayload } from '../types/invoice';
import { CONFIG } from '../constants/config';
import { fileToBase64 } from '../utils/files';
import { parseNumber } from '../utils/formatters';

/**
 * Build the complete payload with all invoice data and files in Base64
 */
export const buildWebhookPayload = async (formData: InvoiceData): Promise<WebhookPayload> => {
  // Convert files to Base64
  let xmlFileData = null;
  let pdfFileData = null;

  if (formData.xmlFile) {
    const xmlBase64 = await fileToBase64(formData.xmlFile);
    xmlFileData = {
      name: formData.xmlFile.name,
      content: xmlBase64,
      mimeType: formData.xmlFile.type || 'application/xml',
    };
  }

  if (formData.pdfFile) {
    const pdfBase64 = await fileToBase64(formData.pdfFile);
    pdfFileData = {
      name: formData.pdfFile.name,
      content: pdfBase64,
      mimeType: formData.pdfFile.type || 'application/pdf',
    };
  }

  // Convert credit note files to Base64 (for Pronto Pago)
  let creditNoteXmlData = null;
  let creditNotePdfData = null;

  if (formData.creditNoteXmlFile) {
    const creditNoteXmlBase64 = await fileToBase64(formData.creditNoteXmlFile);
    creditNoteXmlData = {
      name: formData.creditNoteXmlFile.name,
      content: creditNoteXmlBase64,
      mimeType: formData.creditNoteXmlFile.type || 'application/xml',
    };
  }

  if (formData.creditNotePdfFile) {
    const creditNotePdfBase64 = await fileToBase64(formData.creditNotePdfFile);
    creditNotePdfData = {
      name: formData.creditNotePdfFile.name,
      content: creditNotePdfBase64,
      mimeType: formData.creditNotePdfFile.type || 'application/pdf',
    };
  }

  const fullEmail = formData.email || '';

  const payload: WebhookPayload = {
    submittedAt: new Date().toISOString(),
    week: formData.expectedWeek || parseInt(formData.week, 10) || 1,
    year: formData.year || new Date().getFullYear(),
    project: formData.project,

    isLate: formData.isLate || false,
    lateReason: formData.lateReasons?.[0],
    lateReasons: formData.lateReasons || [],
    lateAcknowledgedAt: formData.lateAcknowledged ? new Date().toISOString() : undefined,

    issuer: {
      rfc: formData.issuerRfc,
      name: formData.issuerName,
      regime: formData.issuerRegime,
      zipCode: formData.issuerZipCode,
    },

    receiver: {
      rfc: formData.receiverRfc,
      name: formData.receiverName,
      regime: formData.receiverRegime,
      zipCode: formData.receiverZipCode,
      cfdiUse: formData.cfdiUse,
    },

    invoice: {
      uuid: formData.uuid,
      folio: formData.folio,
      series: formData.series,
      date: formData.invoiceDate,
      certificationDate: formData.certificationDate,
      satCertNumber: formData.satCertNumber,
    },

    payment: {
      method: formData.paymentMethod,
      form: formData.paymentForm,
      conditions: formData.paymentConditions,
    },

    financial: {
      subtotal: parseNumber(formData.subtotal),
      totalTax: parseNumber(formData.totalTax),
      retentionIva: parseNumber(formData.retentionIva),
      retentionIvaRate: formData.retentionIvaRate || 0,
      retentionIsr: parseNumber(formData.retentionIsr),
      retentionIsrRate: formData.retentionIsrRate || 0,
      totalAmount: parseNumber(formData.totalAmount),
      currency: formData.currency,
      exchangeRate: formData.exchangeRate,
    },

    paymentProgram: {
      program: formData.paymentProgram,
      feeRate: formData.prontoPagoFeeRate,
      feeAmount: formData.prontoPagoFeeAmount,
      netAmount: formData.netPaymentAmount,
    },

    items: formData.items,

    contact: {
      email: fullEmail,
      phone: formData.phoneNumber,
    },

    files: {
      xml: xmlFileData,
      pdf: pdfFileData,
    },

    creditNote: formData.paymentProgram === 'pronto_pago' && formData.creditNoteData ? {
      uuid: formData.creditNoteData.uuid,
      folio: formData.creditNoteData.folio,
      series: formData.creditNoteData.series,
      relatedUuid: formData.creditNoteData.relatedUuid,
      tipoRelacion: formData.creditNoteData.tipoRelacion,
      issuerRfc: formData.creditNoteData.issuerRfc,
      issuerName: formData.creditNoteData.issuerName,
      subtotal: formData.creditNoteData.subtotal,
      totalTax: formData.creditNoteData.totalTax,
      totalAmount: formData.creditNoteData.totalAmount,
      currency: formData.creditNoteData.currency,
      issueDate: formData.creditNoteData.issueDate,
      certificationDate: formData.creditNoteData.certificationDate,
      files: {
        xml: creditNoteXmlData,
        pdf: creditNotePdfData,
      },
    } : undefined,
  };

  return payload;
};

/**
 * API Response interface
 */
interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: string[];
  data?: {
    invoiceId?: string;
    uuid?: string;
    driveFolderPath?: string;
    files?: {
      xml?: string;
      pdf?: string;
    };
    existingInvoiceId?: string;
  };
}

/** Check if a UUID already exists in the system */
export const checkUuidExists = async (_uuid: string): Promise<{ exists: boolean; message: string }> => {
  // Mock: always return not exists
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    exists: false,
    message: 'UUID disponible (mock)',
  };
};

/** Submit invoice to the backend */
export const submitInvoice = async (formData: InvoiceData): Promise<{ 
  success: boolean; 
  message: string;
  data?: ApiResponse['data'];
}> => {
  try {
    const payload = await buildWebhookPayload(formData);
    
    // Mock: simulate successful submission
    console.log('📤 Invoice payload (mock):', payload);
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      message: '¡Factura enviada correctamente! (mock)',
      data: {
        invoiceId: 'mock-' + Date.now(),
        uuid: formData.uuid,
      },
    };
  } catch (error) {
    console.error('Submission error:', error);
    return {
      success: false,
      message: 'Error al enviar la factura',
    };
  }
};

/** Check API health status */
export const checkApiHealth = async (): Promise<{
  healthy: boolean;
  services: { database: string; storage: string };
}> => {
  return {
    healthy: true,
    services: { database: 'mock', storage: 'mock' },
  };
};

/**
 * Validate form data before submission (client-side)
 */
export const validateFormData = (formData: InvoiceData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.xmlFile) {
    errors.push('El archivo XML es requerido');
  }
  if (!formData.pdfFile) {
    errors.push('El archivo PDF es requerido');
  }
  if (!formData.issuerRfc) {
    errors.push('El RFC del emisor es requerido');
  }
  if (!formData.issuerName) {
    errors.push('El nombre del emisor es requerido');
  }
  if (!formData.uuid) {
    errors.push('El UUID (Folio Fiscal) es requerido');
  }
  if (!formData.totalAmount) {
    errors.push('El monto total es requerido');
  }

  if (formData.receiverRfc && formData.receiverRfc !== CONFIG.EXPECTED_RECEIVER_RFC) {
    errors.push(`El RFC del receptor no coincide con ${CONFIG.EXPECTED_RECEIVER_RFC}`);
  }

  if (!formData.email) {
    errors.push('El correo electrónico es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
