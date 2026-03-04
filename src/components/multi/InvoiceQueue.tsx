/**
 * InvoiceQueue - Container component showing all invoice entries
 * Displays summary stats and the list of InvoiceCards
 */

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ListChecks,
  Trash2,
  Send,
} from 'lucide-react';
import { InvoiceEntry } from '../../types/multiInvoice';
import { QueueSummary } from '../../types/multiInvoice';
import { PaymentProgram, CreditNoteData, CreditNoteValidation } from '../../types/invoice';
import { InvoiceCard } from './InvoiceCard';

interface InvoiceQueueProps {
  entries: InvoiceEntry[];
  summary: QueueSummary;
  isProcessing: boolean;
  prontoPagoEnabled: boolean;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onAcknowledgeLate: (id: string) => void;
  onPaymentProgramChange: (id: string, program: PaymentProgram) => void;
  onCreditNoteXmlChange: (id: string, file: File | null) => void;
  onCreditNotePdfChange: (id: string, file: File | null) => void;
  onCreditNoteValidationChange: (id: string, validation: CreditNoteValidation | null, data: CreditNoteData | null) => void;
  onClearAll: () => void;
}

export const InvoiceQueue: React.FC<InvoiceQueueProps> = ({
  entries,
  summary,
  isProcessing,
  prontoPagoEnabled,
  onToggleExpand,
  onRemove,
  onRetry,
  onAcknowledgeLate,
  onPaymentProgramChange,
  onCreditNoteXmlChange,
  onCreditNotePdfChange,
  onCreditNoteValidationChange,
  onClearAll,
}) => {
  if (entries.length === 0) return null;

  const hasLateUnacknowledged = entries.some(
    e => e.isLate && !e.lateAcknowledged && e.status === 'extracted'
  );

  return (
    <div className="space-y-4">
      {/* Section Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="section-header">
          <span className="section-icon">
            <ListChecks size={18} />
          </span>
          <h3 className="section-title">
            Cola de Facturas
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({entries.length})
            </span>
          </h3>
        </div>

        {/* Clear all button */}
        {entries.length > 0 && !isProcessing && summary.submitted !== entries.length && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 
                       px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Limpiar todo
          </button>
        )}
      </div>

      {/* Summary Stats Bar */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Processing */}
          {(summary.validating + summary.extracting) > 0 && (
            <StatBadge
              icon={Loader2}
              count={summary.validating + summary.extracting}
              label="Procesando"
              color="text-tf-yellow-dark"
              bgColor="bg-tf-yellow/10"
              animate
            />
          )}

          {/* Ready */}
          {summary.readyToSubmit > 0 && (
            <StatBadge
              icon={CheckCircle}
              count={summary.readyToSubmit}
              label="Listas"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
          )}

          {/* Late unacknowledged */}
          {hasLateUnacknowledged && (
            <StatBadge
              icon={AlertTriangle}
              count={entries.filter(e => e.isLate && !e.lateAcknowledged && e.status === 'extracted').length}
              label="Requieren confirmación"
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
          )}

          {/* Errors */}
          {summary.error > 0 && (
            <StatBadge
              icon={XCircle}
              count={summary.error}
              label="Con errores"
              color="text-red-600"
              bgColor="bg-red-50"
            />
          )}

          {/* Submitted */}
          {summary.submitted > 0 && (
            <StatBadge
              icon={Send}
              count={summary.submitted}
              label="Enviadas"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
          )}

          {/* Submitting */}
          {summary.submitting > 0 && (
            <StatBadge
              icon={Loader2}
              count={summary.submitting}
              label="Enviando"
              color="text-tf-yellow-dark"
              bgColor="bg-tf-yellow/10"
              animate
            />
          )}
        </div>

        {/* Progress bar */}
        {entries.length > 1 && (
          <div className="mt-3">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
              {/* Submitted (green) */}
              {summary.submitted > 0 && (
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(summary.submitted / entries.length) * 100}%` }}
                />
              )}
              {/* Ready (light green) */}
              {summary.readyToSubmit > 0 && (
                <div
                  className="h-full bg-emerald-200 transition-all duration-500"
                  style={{ width: `${(summary.readyToSubmit / entries.length) * 100}%` }}
                />
              )}
              {/* Processing (yellow) */}
              {(summary.validating + summary.extracting + summary.submitting) > 0 && (
                <div
                  className="h-full bg-tf-yellow transition-all duration-500 animate-pulse"
                  style={{ width: `${((summary.validating + summary.extracting + summary.submitting) / entries.length) * 100}%` }}
                />
              )}
              {/* Errors (red) */}
              {(summary.error) > 0 && (
                <div
                  className="h-full bg-red-300 transition-all duration-500"
                  style={{ width: `${(summary.error / entries.length) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Cards */}
      <div className="space-y-3">
        {entries.map(entry => (
          <InvoiceCard
            key={entry.id}
            entry={entry}
            prontoPagoEnabled={prontoPagoEnabled}
            onToggleExpand={onToggleExpand}
            onRemove={onRemove}
            onRetry={onRetry}
            onAcknowledgeLate={onAcknowledgeLate}
            onPaymentProgramChange={onPaymentProgramChange}
            onCreditNoteXmlChange={onCreditNoteXmlChange}
            onCreditNotePdfChange={onCreditNotePdfChange}
            onCreditNoteValidationChange={onCreditNoteValidationChange}
          />
        ))}
      </div>
    </div>
  );
};

/** Summary stat badge */
const StatBadge: React.FC<{
  icon: React.ElementType;
  count: number;
  label: string;
  color: string;
  bgColor: string;
  animate?: boolean;
}> = ({ icon: Icon, count, label, color, bgColor, animate }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${color} ${bgColor}`}>
    <Icon size={14} className={animate ? 'animate-spin' : ''} />
    <span className="font-bold">{count}</span>
    <span className="text-xs opacity-80">{label}</span>
  </div>
);

export default InvoiceQueue;
