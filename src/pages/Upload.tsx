import { useState, useCallback } from 'react';
import { Loader2, Send, HelpCircle, Check, AlertTriangle, ChevronDown, Mail, Phone, User, PartyPopper } from 'lucide-react';

// Hooks
import { useMultiInvoice } from '../hooks/useMultiInvoice';
import { useProjects } from '../hooks/useProjects';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { ValidationAlert } from '../hooks/useInvoiceExtraction';

// Components
import { Header, WhatsAppButton } from '../components/layout';
import { AlertPopup, AlertType } from '../components/common';
import { InputField } from '../components/common';
import { MultiFileUpload, InvoiceQueue } from '../components/multi';
import { BatchSubmitResult } from '../types/multiInvoice';

const UploadPage: React.FC = () => {
  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  // Batch result state
  const [batchResult, setBatchResult] = useState<BatchSubmitResult | null>(null);

  // Hooks
  const { projects } = useProjects();
  const { prontoPagoEnabled } = useSystemConfig();

  // Handle validation alerts from multi-invoice hook
  const handleAlert = useCallback((alert: ValidationAlert) => {
    setAlertModal({
      isOpen: true,
      type: alert.type as AlertType,
      title: alert.title,
      message: alert.message,
      details: alert.details,
    });
  }, []);

  const {
    entries,
    unpairedFiles,
    contactEmail,
    contactPhone,
    isConfirmed,
    isSubmittingAll,
    summary,
    isProcessing,
    canSubmitAll,
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
  } = useMultiInvoice({
    projects,
    onAlert: handleAlert,
  });

  // Close alert handler
  const closeAlertModal = useCallback(() => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Handle batch submission
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitAll) return;

    // Validate contact info
    if (!contactEmail.trim()) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Correo requerido',
        message: 'Por favor ingresa tu correo electrónico antes de enviar.',
      });
      return;
    }

    // Check for late invoices not acknowledged
    const unacknowledgedLate = entries.filter(
      e => e.isLate && !e.lateAcknowledged && e.status === 'extracted'
    );
    if (unacknowledgedLate.length > 0) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Facturas extemporáneas',
        message: `Tienes ${unacknowledgedLate.length} factura(s) extemporánea(s) que requieren confirmación antes de enviar.`,
      });
      return;
    }

    if (!isConfirmed) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Confirmación requerida',
        message: 'Por favor confirma que la información es correcta antes de enviar.',
      });
      return;
    }

    setBatchResult(null);
    const result = await submitAll();
    setBatchResult(result);

    // Show result alert
    if (result.successful === result.total) {
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: '¡Facturas enviadas!',
        message: `Se enviaron correctamente ${result.successful} de ${result.total} factura(s).`,
      });
    } else if (result.successful > 0) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Envío parcial',
        message: `Se enviaron ${result.successful} de ${result.total} factura(s). ${result.failed} factura(s) tuvieron errores.`,
        details: result.results
          .filter(r => !r.success)
          .map(r => `${r.baseName}: ${r.message}`)
          .join('\n'),
      });
    } else {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error al enviar',
        message: 'No se pudieron enviar las facturas.',
        details: result.results
          .map(r => `${r.baseName}: ${r.message}`)
          .join('\n'),
      });
    }
  };

  // Determine UI state
  const showQueue = entries.length > 0;
  const showContactSection = summary.extracted > 0 || summary.readyToSubmit > 0;
  const showSubmitSection = showContactSection;
  const allSubmitted = summary.submitted === entries.length && entries.length > 0;

  return (
    <div className="min-h-screen bg-tf-bg-main flex flex-col font-sans text-tf-black transition-colors duration-300">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow px-4 pb-12 -mt-12 relative z-20">
        <div className="max-w-6xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-tf-gray-light p-6 md:p-10 animate-fade-in">

            <form onSubmit={handleSubmitAll} className="space-y-8">

              {/* Section 1: Multi File Upload - Always Visible */}
              {!allSubmitted && (
                <MultiFileUpload
                  onFilesAdded={addFiles}
                  unpairedFiles={unpairedFiles}
                  onRemoveUnpaired={removeUnpairedFile}
                  disabled={isSubmittingAll}
                  totalEntries={entries.length}
                />
              )}

              {/* Section 2: Invoice Queue */}
              {showQueue && (
                <InvoiceQueue
                  entries={entries}
                  summary={summary}
                  isProcessing={isProcessing}
                  prontoPagoEnabled={prontoPagoEnabled}
                  onToggleExpand={toggleExpand}
                  onRemove={removeEntry}
                  onRetry={retryEntry}
                  onAcknowledgeLate={acknowledgeLate}
                  onPaymentProgramChange={setEntryPaymentProgram}
                  onCreditNoteXmlChange={setEntryCreditNoteXml}
                  onCreditNotePdfChange={setEntryCreditNotePdf}
                  onCreditNoteValidationChange={setEntryCreditNoteValidation}
                  onClearAll={clearAll}
                />
              )}

              {/* Section 3: Contact Information - Shown after extraction */}
              {showContactSection && !allSubmitted && (
                <div className="space-y-5 animate-slide-up">
                  <div className="section-header">
                    <span className="section-icon">
                      <User size={18} />
                    </span>
                    <h3 className="section-title">Información de Contacto</h3>
                  </div>

                  <div className="card p-5 space-y-4">
                    <p className="text-sm text-gray-500">
                      Estos datos se usarán para todas las facturas en esta carga.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Correo Electrónico"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        icon={<Mail size={18} />}
                      />
                      <InputField
                        label="Teléfono de Contacto"
                        type="tel"
                        placeholder="55 1234 5678"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        icon={<Phone size={18} />}
                      />
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-tf-yellow/10 rounded-lg border border-tf-yellow/20">
                      <div className="w-5 h-5 rounded-full bg-tf-yellow/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-tf-yellow-accent text-xs font-bold">i</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Recibirás un correo de confirmación con el estatus de cada factura y detalles del pago programado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Confirmation & Submit */}
              {showSubmitSection && !allSubmitted && (
                <div className="pt-6 border-t border-tf-gray-light space-y-5 animate-slide-up">

                  {/* Confirmation Checkbox */}
                  <div
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      isConfirmed
                        ? 'bg-tf-yellow/10 border-tf-yellow/50'
                        : 'bg-gray-50 border-gray-200 hover:border-tf-yellow/30'
                    }`}
                    onClick={toggleConfirmation}
                  >
                    <button
                      type="button"
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                        isConfirmed
                          ? 'bg-tf-yellow border-tf-yellow'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isConfirmed && <Check size={14} className="text-tf-black" strokeWidth={3} />}
                    </button>
                    <label className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
                      Confirmo que he revisado la información extraída de{' '}
                      <strong>{summary.readyToSubmit} factura(s)</strong> y es correcta para su procesamiento.
                    </label>
                  </div>

                  {/* Batch Result Message */}
                  {batchResult && (
                    <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
                      batchResult.failed === 0
                        ? 'bg-tf-yellow/10 text-tf-black border border-tf-yellow/30'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {batchResult.failed === 0 ? <Check size={18} /> : <AlertTriangle size={18} />}
                      {batchResult.successful} de {batchResult.total} factura(s) enviada(s) correctamente.
                      {batchResult.failed > 0 && ` ${batchResult.failed} con errores.`}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-tf-black hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                      onClick={() => window.open('https://wa.me/5215644443529?text=Necesito ayuda con mi factura', '_blank')}
                    >
                      <HelpCircle size={18} />
                      ¿Necesitas ayuda?
                    </button>

                    <button
                      type="submit"
                      disabled={!canSubmitAll}
                      className={`
                        font-bold text-lg py-4 px-10 rounded-xl shadow-lg transform transition-all duration-200 
                        flex items-center gap-3 w-full md:w-auto justify-center
                        ${canSubmitAll
                          ? 'bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black shadow-tf hover:-translate-y-0.5'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }
                      `}
                    >
                      {isSubmittingAll ? (
                        <>
                          <Loader2 size={22} className="animate-spin" />
                          Enviando {summary.submitting > 0 ? `(${summary.submitted + summary.submitting}/${entries.length})` : '...'}
                        </>
                      ) : (
                        <>
                          <Send size={22} />
                          Enviar {summary.readyToSubmit} Factura{summary.readyToSubmit !== 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* All submitted success state */}
              {allSubmitted && (
                <div className="text-center py-16 animate-fade-in space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-2">
                    <PartyPopper size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    ¡Todas las facturas fueron enviadas!
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Se procesaron exitosamente {summary.submitted} factura(s). 
                    Recibirás un correo de confirmación con los detalles.
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200"
                  >
                    Cargar más facturas
                  </button>
                </div>
              )}

              {/* Empty state - hint to upload files */}
              {!showQueue && !allSubmitted && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tf-yellow/10 mb-4">
                    <ChevronDown size={32} className="text-tf-yellow animate-bounce" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Sube tus archivos para comenzar
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Arrastra tus archivos XML y PDF al área de carga. Puedes subir <strong>múltiples facturas</strong> a la vez — 
                    se emparejarán automáticamente por nombre de archivo.
                  </p>
                </div>
              )}

            </form>
          </div>
        </div>
      </main>

      {/* WhatsApp FAB */}
      <WhatsAppButton />

      {/* Validation Alert Popup */}
      <AlertPopup
        isOpen={alertModal.isOpen}
        onClose={closeAlertModal}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        details={alertModal.details}
      />
    </div>
  );
};

export default UploadPage;
