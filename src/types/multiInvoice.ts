/**
 * Multi-invoice upload types
 * Supports uploading and processing multiple invoices at once
 */

import { InvoiceData, LateInvoiceReason } from './invoice';

/** Status lifecycle for each invoice entry */
export type InvoiceEntryStatus =
  | 'pairing'       // File detected, waiting for pair
  | 'validating'    // Pre-validation (filename match, UUID check)
  | 'extracting'    // AI extraction in progress
  | 'extracted'     // Successfully extracted, ready for review
  | 'error'         // Failed validation or extraction
  | 'submitting'    // Being submitted to API
  | 'submitted'     // Successfully submitted
  | 'submit_error'; // Submission failed

/** Individual invoice entry in the multi-upload queue */
export interface InvoiceEntry {
  /** Unique identifier for this entry */
  id: string;
  /** Current processing status */
  status: InvoiceEntryStatus;
  /** Base filename (without extension) used for pairing */
  baseName: string;
  /** XML file */
  xmlFile: File | null;
  /** PDF file */
  pdfFile: File | null;
  /** Extracted form data (populated after AI extraction) */
  formData: InvoiceData | null;
  /** Error message if status is 'error' */
  error: string | null;
  /** Whether this invoice card is expanded in the UI */
  isExpanded: boolean;
  /** Late invoice info */
  isLate: boolean;
  lateReasons: LateInvoiceReason[];
  lateAcknowledged: boolean;
  /** Submission result */
  submitMessage?: string;
}

/** Result from file pairing logic */
export interface FilePairResult {
  paired: Array<{ baseName: string; xml: File; pdf: File }>;
  unpaired: Array<{ file: File; type: 'xml' | 'pdf'; baseName: string }>;
  errors: string[];
}

/** Summary of the current queue state */
export interface QueueSummary {
  total: number;
  pairing: number;
  validating: number;
  extracting: number;
  extracted: number;
  error: number;
  submitting: number;
  submitted: number;
  readyToSubmit: number; // extracted + late acknowledged
}

/** Batch submission result */
export interface BatchSubmitResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    id: string;
    baseName: string;
    success: boolean;
    message: string;
  }>;
}
