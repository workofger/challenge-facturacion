/**
 * InvoiceCard - Individual invoice entry in the multi-upload queue
 * Shows compact summary with expandable details
 */

import React, { useCallback } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Send,
  FileCode,
  FileText,
  Building2,
  Hash,
  DollarSign,
  Calendar,
  FolderKanban,
  Clock,
  Shield,
  Zap,
  Banknote,
} from 'lucide-react';
import { InvoiceEntry, InvoiceEntryStatus } from '../../types/multiInvoice';
import { PaymentProgram, CreditNoteData, CreditNoteValidation } from '../../types/invoice';
import { CreditNoteUpload } from '../sections/CreditNoteUpload';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface InvoiceCardProps {
  entry: InvoiceEntry;
  prontoPagoEnabled: boolean;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onAcknowledgeLate: (id: string) => void;
  onPaymentProgramChange: (id: string, program: PaymentProgram) => void;
  onCreditNoteXmlChange: (id: string, file: File | null) => void;
  onCreditNotePdfChange: (id: string, file: File | null) => void;
  onCreditNoteValidationChange: (id: string, validation: CreditNoteValidation | null, data: CreditNoteData | null) => void;
}

/** Status badge configuration */
const statusConfig: Record<InvoiceEntryStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  animate?: boolean;
}> = {
  pairing: {
    label: 'Emparejando',
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    animate: true,
  },
  validating: {
    label: 'Validando',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    animate: true,
  },
  extracting: {
    label: 'Extrayendo datos',
    icon: Loader2,
    color: 'text-tf-yellow-dark',
    bgColor: 'bg-tf-yellow/10',
    borderColor: 'border-tf-yellow/30',
    animate: true,
  },
  extracted: {
    label: 'Listo',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  submitting: {
    label: 'Enviando',
    icon: Send,
    color: 'text-tf-yellow-dark',
    bgColor: 'bg-tf-yellow/10',
    borderColor: 'border-tf-yellow/30',
    animate: true,
  },
  submitted: {
    label: 'Enviada',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  submit_error: {
    label: 'Error al enviar',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  entry,
  prontoPagoEnabled,
  onToggleExpand,
  onRemove,
  onRetry,
  onAcknowledgeLate,
  onPaymentProgramChange,
  onCreditNoteXmlChange,
  onCreditNotePdfChange,
  onCreditNoteValidationChange,
}) => {
  const config = statusConfig[entry.status];
  const StatusIcon = config.icon;
  const isProcessing = ['pairing', 'validating', 'extracting', 'submitting'].includes(entry.status);
  const canExpand = entry.status === 'extracted' || entry.status === 'submitted';
  const canRemove = !isProcessing && entry.status !== 'submitting';
  const canRetry = entry.status === 'error' || entry.status === 'submit_error';
  const canEditPayment = entry.status === 'extracted';

  const formData = entry.formData;
  const totalAmount = formData ? parseFloat(formData.totalAmount) || 0 : 0;
  const isProntoPago = formData?.paymentProgram === 'pronto_pago';

  // Memoized callbacks for credit note handlers scoped to this entry
  const handleCreditNoteXmlChange = useCallback(
    (file: File | null) => onCreditNoteXmlChange(entry.id, file),
    [entry.id, onCreditNoteXmlChange]
  );
  const handleCreditNotePdfChange = useCallback(
    (file: File | null) => onCreditNotePdfChange(entry.id, file),
    [entry.id, onCreditNotePdfChange]
  );
  const handleCreditNoteValidationChange = useCallback(
    (validation: CreditNoteValidation | null, data: CreditNoteData | null) =>
      onCreditNoteValidationChange(entry.id, validation, data),
    [entry.id, onCreditNoteValidationChange]
  );

  return (
    <div className={`
      rounded-2xl border-2 transition-all duration-300 overflow-hidden
      ${config.borderColor} ${config.bgColor}
      ${canExpand ? 'hover:shadow-md cursor-pointer' : ''}
      ${entry.status === 'submitted' ? 'opacity-75' : ''}
    `}>
      {/* Compact Header */}
      <div
        className="flex items-center gap-3 p-4"
        onClick={() => canExpand && onToggleExpand(entry.id)}
      >
        {/* Status Icon */}
        <div className={`flex-shrink-0 ${config.color}`}>
          <StatusIcon
            size={22}
            className={config.animate ? 'animate-spin' : ''}
          />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          {/* Filename */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 truncate text-sm">
              {entry.baseName}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {entry.xmlFile && <FileCode size={12} className="text-blue-500" />}
              {entry.pdfFile && <FileText size={12} className="text-red-500" />}
            </div>
          </div>

          {/* Details row */}
          {formData ? (
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 size={11} />
                {formData.issuerName || 'Sin nombre'}
              </span>
              <span className="flex items-center gap-1">
                <Hash size={11} />
                {formData.issuerRfc || 'Sin RFC'}
              </span>
              {formData.project && (
                <span className="flex items-center gap-1 text-tf-yellow-dark font-medium">
                  <FolderKanban size={11} />
                  {formData.project}
                </span>
              )}
              {formData.week && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  Sem. {formData.week}
                </span>
              )}
            </div>
          ) : isProcessing ? (
            <p className="text-xs text-gray-400 mt-1">
              {entry.status === 'validating' ? 'Verificando UUID y archivos...' : 
               entry.status === 'extracting' ? 'Extrayendo datos con IA...' :
               entry.status === 'submitting' ? 'Enviando al servidor...' : 'Procesando...'}
            </p>
          ) : entry.error ? (
            <p className="text-xs text-red-600 mt-1 truncate">{entry.error}</p>
          ) : null}
        </div>

        {/* Right Side: Amount + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Pronto Pago badge */}
          {isProntoPago && formData && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-tf-yellow/20 text-tf-yellow-dark border border-tf-yellow/30 flex items-center gap-1">
              <Zap size={10} />
              Pronto Pago
            </span>
          )}

          {/* Late badge */}
          {entry.isLate && (
            <span className={`
              text-xs px-2 py-0.5 rounded-full font-medium
              ${entry.lateAcknowledged 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-amber-200 text-amber-800 border border-amber-300 animate-pulse'
              }
            `}>
              {entry.lateAcknowledged ? 'Extemporánea' : '⚠ Extemporánea'}
            </span>
          )}

          {/* Amount */}
          {totalAmount > 0 && (
            <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
              <DollarSign size={14} className="text-gray-400" />
              {formatCurrency(totalAmount, formData?.currency || 'MXN')}
            </span>
          )}

          {/* Status badge */}
          <span className={`
            text-xs px-2.5 py-1 rounded-lg font-semibold
            ${config.color} ${config.bgColor} border ${config.borderColor}
          `}>
            {config.label}
          </span>

          {/* Retry button */}
          {canRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(entry.id); }}
              className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 hover:text-tf-yellow-dark transition-colors"
              title="Reintentar"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {/* Remove button */}
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Expand/collapse */}
          {canExpand && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(entry.id); }}
              className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 transition-colors"
            >
              {entry.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Late Invoice Acknowledgment Bar */}
      {entry.isLate && !entry.lateAcknowledged && entry.status === 'extracted' && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-3 bg-amber-100 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Clock size={16} className="flex-shrink-0" />
              <span>Factura extemporánea — se programará para el siguiente ciclo de pago</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onAcknowledgeLate(entry.id); }}
              className="flex-shrink-0 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {entry.isExpanded && formData && (
        <div className="border-t border-gray-200/50 bg-white/50 p-4 space-y-4 animate-slide-up">
          {/* Grid: Fiscal Info + Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fiscal Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Emisor</h4>
              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
                <DetailRow label="Nombre" value={formData.issuerName} />
                <DetailRow label="RFC" value={formData.issuerRfc} />
                <DetailRow label="Régimen" value={formData.issuerRegime} />
                {formData.issuerZipCode && <DetailRow label="C.P." value={formData.issuerZipCode} />}
              </div>
              
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-2">Receptor</h4>
              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
                <DetailRow label="RFC" value={formData.receiverRfc} />
                {formData.receiverName && <DetailRow label="Nombre" value={formData.receiverName} />}
                <DetailRow label="Régimen" value={formData.receiverRegime} />
              </div>
            </div>

            {/* Payment & Invoice Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Factura</h4>
              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
                <DetailRow label="UUID" value={formData.uuid} mono />
                <DetailRow label="Folio" value={formData.folio} />
                {formData.series && <DetailRow label="Serie" value={formData.series} />}
                <DetailRow label="Fecha" value={formData.invoiceDate} />
                <DetailRow label="Método Pago" value={formData.paymentMethod} />
              </div>

              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-2">Montos</h4>
              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
                <DetailRow label="Subtotal" value={`$${formData.subtotal} ${formData.currency}`} />
                <DetailRow label="IVA" value={`$${formData.totalTax} ${formData.currency}`} />
                {parseFloat(formData.retentionIva) > 0 && (
                  <DetailRow label="Ret. IVA" value={`-$${formData.retentionIva}`} />
                )}
                {parseFloat(formData.retentionIsr) > 0 && (
                  <DetailRow label="Ret. ISR" value={`-$${formData.retentionIsr}`} />
                )}
                <div className="border-t border-gray-100 pt-1.5">
                  <DetailRow label="Total" value={`$${formData.totalAmount} ${formData.currency}`} bold />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Program Section - Only when Pronto Pago is enabled */}
          {prontoPagoEnabled && formData && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Programa de Pago
              </h4>
              <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                {/* Inline selector: two pill options */}
                <div className="flex gap-3">
                  {/* Standard option */}
                  <button
                    type="button"
                    disabled={!canEditPayment}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPaymentProgramChange(entry.id, 'standard');
                    }}
                    className={`
                      flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200
                      ${!isProntoPago
                        ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }
                      ${!canEditPayment ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${!isProntoPago ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}
                    `}>
                      {!isProntoPago && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <Banknote size={14} className={!isProntoPago ? 'text-emerald-600' : 'text-gray-400'} />
                        <span className={`text-sm font-semibold ${!isProntoPago ? 'text-emerald-700' : 'text-gray-600'}`}>
                          Pago Estándar
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Viernes de la siguiente semana</p>
                    </div>
                  </button>

                  {/* Pronto Pago option */}
                  <button
                    type="button"
                    disabled={!canEditPayment}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPaymentProgramChange(entry.id, 'pronto_pago');
                    }}
                    className={`
                      flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200
                      ${isProntoPago
                        ? 'border-tf-yellow bg-tf-yellow/10 ring-1 ring-tf-yellow/30'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }
                      ${!canEditPayment ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isProntoPago ? 'border-tf-yellow-dark bg-tf-yellow' : 'border-gray-300'}
                    `}>
                      {isProntoPago && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} className={isProntoPago ? 'text-tf-yellow-dark' : 'text-gray-400'} />
                        <span className={`text-sm font-semibold ${isProntoPago ? 'text-tf-black' : 'text-gray-600'}`}>
                          Pronto Pago
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                          ${isProntoPago ? 'bg-tf-yellow/30 text-tf-yellow-dark' : 'bg-gray-200 text-gray-500'}
                        `}>
                          8%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">1 día hábil</p>
                    </div>
                  </button>
                </div>

                {/* Fee breakdown - shown when pronto_pago is selected */}
                {isProntoPago && (
                  <div className="bg-tf-yellow/5 rounded-xl p-3 border border-tf-yellow/20 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total factura</span>
                      <span className="text-gray-700 font-medium">
                        ${formatNumber(totalAmount)} {formData.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-500">Costo financiero (8%)</span>
                      <span className="text-red-500 font-medium">
                        -${formatNumber(formData.prontoPagoFeeAmount)} {formData.currency}
                      </span>
                    </div>
                    <div className="border-t border-tf-yellow/20 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">Monto a recibir</span>
                        <span className="text-base font-bold text-emerald-600">
                          ${formatNumber(formData.netPaymentAmount)} {formData.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credit Note Upload - shown when pronto_pago is selected */}
                {isProntoPago && canEditPayment && (
                  <CreditNoteUpload
                    xmlFile={formData.creditNoteXmlFile}
                    pdfFile={formData.creditNotePdfFile}
                    onXmlChange={handleCreditNoteXmlChange}
                    onPdfChange={handleCreditNotePdfChange}
                    invoiceUuid={formData.uuid}
                    invoiceIssuerRfc={formData.issuerRfc}
                    expectedFeeAmount={formData.prontoPagoFeeAmount}
                    onValidationChange={handleCreditNoteValidationChange}
                  />
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          {formData.items.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Conceptos ({formData.items.length})
              </h4>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">Descripción</th>
                      <th className="text-right px-3 py-2 font-medium">Cant.</th>
                      <th className="text-right px-3 py-2 font-medium">P. Unit.</th>
                      <th className="text-right px-3 py-2 font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                          {item.description}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          ${item.unitPrice?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800">
                          ${item.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit message */}
          {entry.submitMessage && (
            <div className={`p-3 rounded-xl text-sm ${
              entry.status === 'submitted'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {entry.submitMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Helper: Detail row in expanded view */
const DetailRow: React.FC<{
  label: string;
  value?: string;
  mono?: boolean;
  bold?: boolean;
}> = ({ label, value, mono, bold }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`
        text-xs text-right truncate max-w-[60%]
        ${mono ? 'font-mono text-gray-600' : 'text-gray-700'}
        ${bold ? 'font-bold text-sm' : ''}
      `}>
        {value}
      </span>
    </div>
  );
};

export default InvoiceCard;
