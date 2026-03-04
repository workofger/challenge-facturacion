/**
 * Invoicing Service
 * Frontend service for electronic invoicing operations.
 * Currently returns mock data for UI development.
 */

// ============================================
// TYPES
// ============================================

export interface CSDStatus {
  status: 'none' | 'active' | 'expired' | 'error';
  invoicingEnabled: boolean;
  certificate: {
    serialNumber: string;
    validUntil: string;
    daysUntilExpiry: number | null;
    uploadedAt: string;
  } | null;
  fiscalInfo: {
    rfc: string;
    name: string;
    regime: string;
    zipCode: string;
  };
}

export interface InvoiceListItem {
  id: string;
  facturapiId: string;
  cfdiType: 'I' | 'E' | 'P';
  cfdiTypeName: string;
  uuid: string | null;
  folio: string | null;
  series: string | null;
  issueDate: string;
  receiverRfc: string;
  receiverName: string | null;
  total: number;
  currency: string;
  status: string;
  statusName: string;
  createdAt: string;
}

export interface InvoiceListResponse {
  items: InvoiceListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CustomerData {
  legalName: string;
  rfc: string;
  fiscalRegime: string;
  zipCode: string;
  email?: string;
}

export interface InvoiceItemData {
  description: string;
  productKey: string;
  unitKey: string;
  unitName?: string;
  quantity: number;
  price: number;
  taxIncluded?: boolean;
  taxes?: Array<{
    type: 'IVA' | 'ISR' | 'IEPS';
    rate?: number;
    factor?: 'Tasa' | 'Cuota' | 'Exento';
    withholding?: boolean;
  }>;
}

export interface CreateInvoicePayload {
  customer: CustomerData;
  items: InvoiceItemData[];
  paymentForm: string;
  paymentMethod?: 'PUE' | 'PPD';
  cfdiUse: string;
  series?: string;
  folioNumber?: number;
  currency?: string;
  relatedCfdis?: Array<{
    relationship: string;
    uuids: string[];
  }>;
}

export interface CreateCreditNotePayload {
  customer: CustomerData;
  items: InvoiceItemData[];
  paymentForm: string;
  cfdiUse: string;
  relatedUuids: string[];
}

export interface PaymentDetail {
  uuid: string;
  series?: string;
  folio?: string;
  currency: string;
  exchange?: number;
  installment: number;
  previousBalance: number;
  amountPaid: number;
}

export interface CreatePaymentComplementPayload {
  customer: CustomerData;
  payments: Array<{
    paymentForm: string;
    currency?: string;
    exchange?: number;
    date: string;
    amount: number;
    operationNumber?: string;
    relatedDocuments: PaymentDetail[];
  }>;
}

export interface InvoiceCreatedResponse {
  id: string;
  facturapiId: string;
  uuid: string;
  folio: number | null;
  series: string | null;
  total: number;
  status: string;
  verificationUrl?: string;
}

export interface CancellationPayload {
  motive: '01' | '02' | '03' | '04';
  substitutionUuid?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_CSD_STATUS: CSDStatus = {
  status: 'active',
  invoicingEnabled: true,
  certificate: {
    serialNumber: '30001000000500003416',
    validUntil: '2027-05-15T00:00:00Z',
    daysUntilExpiry: 437,
    uploadedAt: '2026-01-10T10:00:00Z',
  },
  fiscalInfo: {
    rfc: 'GASA850101AAA',
    name: 'Transportes García SA de CV',
    regime: '601',
    zipCode: '03100',
  },
};

const MOCK_ISSUED_INVOICES: InvoiceListItem[] = [
  {
    id: 'issued-001',
    facturapiId: 'fp-001',
    cfdiType: 'I',
    cfdiTypeName: 'Ingreso',
    uuid: 'H8I9J0K1-L2M3-4567-NOPQ-678901234567',
    folio: '101',
    series: 'A',
    issueDate: '2026-02-20',
    receiverRfc: 'XAXX010101000',
    receiverName: 'Empresa Receptora SA de CV',
    total: 34500.00,
    currency: 'MXN',
    status: 'valid',
    statusName: 'Vigente',
    createdAt: '2026-02-20T10:30:00Z',
  },
  {
    id: 'issued-002',
    facturapiId: 'fp-002',
    cfdiType: 'E',
    cfdiTypeName: 'Egreso',
    uuid: 'I9J0K1L2-M3N4-5678-OPQR-789012345678',
    folio: '15',
    series: 'NC',
    issueDate: '2026-02-18',
    receiverRfc: 'XAXX010101000',
    receiverName: 'Empresa Receptora SA de CV',
    total: 1035.00,
    currency: 'MXN',
    status: 'valid',
    statusName: 'Vigente',
    createdAt: '2026-02-18T14:00:00Z',
  },
];

// ============================================
// MOCK API FUNCTIONS
// ============================================

/** Get current CSD status */
export async function getCSDStatus(): Promise<CSDStatus> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_CSD_STATUS;
}

/** Upload CSD files */
export async function uploadCSD(
  _cerFile: File,
  _keyFile: File,
  _password: string,
  _fiscalRegimeCode?: string,
  _fiscalZipCode?: string
): Promise<CSDStatus> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { ...MOCK_CSD_STATUS, status: 'active', invoicingEnabled: true };
}

/** Delete CSD */
export async function deleteCSD(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
}

/** List issued invoices */
export async function listInvoices(_options?: {
  page?: number;
  limit?: number;
  type?: 'I' | 'E' | 'P';
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<InvoiceListResponse> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    items: MOCK_ISSUED_INVOICES,
    pagination: {
      page: 1,
      limit: 20,
      totalItems: MOCK_ISSUED_INVOICES.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

/** Create income invoice */
export async function createIncomeInvoice(
  _payload: CreateInvoicePayload
): Promise<InvoiceCreatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: 'mock-' + Date.now(),
    facturapiId: 'fp-mock-' + Date.now(),
    uuid: crypto.randomUUID().toUpperCase(),
    folio: 102,
    series: 'A',
    total: _payload.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    status: 'valid',
    verificationUrl: 'https://verificacfdi.facturaelectronica.sat.gob.mx/',
  };
}

/** Create credit note */
export async function createCreditNote(
  _payload: CreateCreditNotePayload
): Promise<InvoiceCreatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: 'mock-cn-' + Date.now(),
    facturapiId: 'fp-mock-cn-' + Date.now(),
    uuid: crypto.randomUUID().toUpperCase(),
    folio: 16,
    series: 'NC',
    total: _payload.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    status: 'valid',
  };
}

/** Create payment complement */
export async function createPaymentComplement(
  _payload: CreatePaymentComplementPayload
): Promise<InvoiceCreatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: 'mock-pc-' + Date.now(),
    facturapiId: 'fp-mock-pc-' + Date.now(),
    uuid: crypto.randomUUID().toUpperCase(),
    folio: 5,
    series: 'P',
    total: _payload.payments.reduce((sum, p) => sum + p.amount, 0),
    status: 'valid',
  };
}

/** Download invoice XML */
export async function downloadInvoiceXml(_invoiceId: string): Promise<Blob> {
  throw new Error('Not implemented');
}

/** Download invoice PDF */
export async function downloadInvoicePdf(_invoiceId: string): Promise<Blob> {
  throw new Error('Not implemented');
}

/** Cancel invoice */
export async function cancelInvoice(
  _invoiceId: string,
  _payload: CancellationPayload
): Promise<void> {
  throw new Error('Not implemented');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ============================================
// SAT CATALOGS (Common values)
// ============================================

export const PAYMENT_FORMS = [
  { code: '01', name: 'Efectivo' },
  { code: '02', name: 'Cheque nominativo' },
  { code: '03', name: 'Transferencia electrónica de fondos' },
  { code: '04', name: 'Tarjeta de crédito' },
  { code: '28', name: 'Tarjeta de débito' },
  { code: '99', name: 'Por definir' },
];

export const CFDI_USES = [
  { code: 'G01', name: 'Adquisición de mercancías' },
  { code: 'G02', name: 'Devoluciones, descuentos o bonificaciones' },
  { code: 'G03', name: 'Gastos en general' },
  { code: 'I01', name: 'Construcciones' },
  { code: 'I02', name: 'Mobiliario y equipo de oficina' },
  { code: 'I03', name: 'Equipo de transporte' },
  { code: 'I04', name: 'Equipo de cómputo y accesorios' },
  { code: 'I08', name: 'Otra maquinaria y equipo' },
  { code: 'S01', name: 'Sin efectos fiscales' },
  { code: 'CP01', name: 'Pagos' },
];

export const FISCAL_REGIMES = [
  { code: '601', name: 'General de Ley Personas Morales' },
  { code: '603', name: 'Personas Morales con Fines no Lucrativos' },
  { code: '605', name: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { code: '606', name: 'Arrendamiento' },
  { code: '607', name: 'Régimen de Enajenación o Adquisición de Bienes' },
  { code: '608', name: 'Demás ingresos' },
  { code: '610', name: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { code: '611', name: 'Ingresos por Dividendos (socios y accionistas)' },
  { code: '612', name: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { code: '614', name: 'Ingresos por intereses' },
  { code: '615', name: 'Régimen de los ingresos por obtención de premios' },
  { code: '616', name: 'Sin obligaciones fiscales' },
  { code: '620', name: 'Sociedades Cooperativas de Producción' },
  { code: '621', name: 'Incorporación Fiscal' },
  { code: '622', name: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { code: '623', name: 'Opcional para Grupos de Sociedades' },
  { code: '624', name: 'Coordinados' },
  { code: '625', name: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { code: '626', name: 'Régimen Simplificado de Confianza' },
];

export const CANCELLATION_REASONS = [
  { code: '01', name: 'Comprobante emitido con errores con relación', requiresSubstitution: true },
  { code: '02', name: 'Comprobante emitido con errores sin relación', requiresSubstitution: false },
  { code: '03', name: 'No se llevó a cabo la operación', requiresSubstitution: false },
  { code: '04', name: 'Operación nominativa relacionada en una factura global', requiresSubstitution: false },
];
