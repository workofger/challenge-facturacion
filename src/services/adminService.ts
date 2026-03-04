/**
 * Admin API Service
 * 
 * Currently returns mock data for UI development.
 */

// Store token in memory (will be lost on page refresh)
let authToken: string | null = null;

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'finance' | 'operations' | 'viewer';
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
  expiresIn: number;
}

export interface DashboardStats {
  totalInvoices: number;
  totalAmount: number;
  totalProntoPago: number;
  totalStandard: number;
  prontoPagoAmount: number;
  standardAmount: number;
  prontoPagoFees: number;
  thisWeekInvoices: number;
  lastWeekInvoices: number;
  currentWeek: number;
  currentYear: number;
  totalLate: number;
  lateAmount: number;
  needsProjectReview: number;
}

export interface RecentInvoice {
  id: string;
  uuid: string;
  issuer_name: string;
  total_amount: number;
  payment_program: string;
  created_at: string;
  status: string;
  is_late: boolean;
  late_reason: string | null;
  needs_project_review: boolean;
}

export interface InvoiceListItem {
  id: string;
  uuid: string;
  folio: string | null;
  issuer_rfc: string;
  issuer_name: string;
  total_amount: number;
  net_payment_amount: number | null;
  payment_program: string;
  pronto_pago_fee_amount: number | null;
  payment_week: number;
  payment_year: number;
  invoice_date: string;
  status: string;
  created_at: string;
  project_name: string | null;
  project_code: string | null;
  is_late?: boolean;
  late_reason?: string | null;
  needs_project_review?: boolean;
}

export interface InvoicesResponse {
  invoices: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InvoiceFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  week?: number;
  year?: number;
  project?: string;
  paymentProgram?: string;
  status?: string;
  needsReview?: boolean;
  isLate?: boolean;
}

export interface ExportFilters {
  weekFrom?: number;
  weekTo?: number;
  year?: number;
  project?: string;
  paymentProgram?: string;
  format?: 'csv' | 'json';
}

// ========== Mock Data ==========

const MOCK_ADMIN: AdminUser = {
  id: 'admin-001',
  email: 'admin@tufactura.com',
  fullName: 'Administrador Demo',
  role: 'super_admin',
};

const MOCK_INVOICES: InvoiceListItem[] = [
  {
    id: 'inv-001',
    uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    folio: '1042',
    issuer_rfc: 'GASA850101AAA',
    issuer_name: 'Transportes García SA de CV',
    total_amount: 45680.00,
    net_payment_amount: 44310.00,
    payment_program: 'pronto_pago',
    pronto_pago_fee_amount: 1370.40,
    payment_week: 8,
    payment_year: 2026,
    invoice_date: '2026-02-20',
    status: 'approved',
    created_at: '2026-02-21T10:30:00Z',
    project_name: 'Última Milla CDMX',
    project_code: 'UM-CDMX-001',
    is_late: false,
    late_reason: null,
    needs_project_review: false,
  },
  {
    id: 'inv-002',
    uuid: 'B2C3D4E5-F6A7-8901-BCDE-F12345678901',
    folio: '587',
    issuer_rfc: 'LOME920315BBB',
    issuer_name: 'Logística López Moreno',
    total_amount: 28950.50,
    net_payment_amount: null,
    payment_program: 'standard',
    pronto_pago_fee_amount: null,
    payment_week: 8,
    payment_year: 2026,
    invoice_date: '2026-02-19',
    status: 'pending',
    created_at: '2026-02-20T15:45:00Z',
    project_name: 'Distribución GDL',
    project_code: 'DIST-GDL-002',
    is_late: false,
    late_reason: null,
    needs_project_review: false,
  },
  {
    id: 'inv-003',
    uuid: 'C3D4E5F6-A7B8-9012-CDEF-123456789012',
    folio: '2201',
    issuer_rfc: 'RAMJ880520CCC',
    issuer_name: 'Fletes Ramírez e Hijos',
    total_amount: 15200.00,
    net_payment_amount: null,
    payment_program: 'standard',
    pronto_pago_fee_amount: null,
    payment_week: 7,
    payment_year: 2026,
    invoice_date: '2026-02-14',
    status: 'paid',
    created_at: '2026-02-15T09:00:00Z',
    project_name: 'Última Milla MTY',
    project_code: 'UM-MTY-003',
    is_late: true,
    late_reason: 'Entregada fuera del periodo de facturación',
    needs_project_review: false,
  },
  {
    id: 'inv-004',
    uuid: 'D4E5F6A7-B8C9-0123-DEFA-234567890123',
    folio: '831',
    issuer_rfc: 'MEVA910712DDD',
    issuer_name: 'Operadora de Carga del Valle',
    total_amount: 67430.00,
    net_payment_amount: 65407.10,
    payment_program: 'pronto_pago',
    pronto_pago_fee_amount: 2022.90,
    payment_week: 8,
    payment_year: 2026,
    invoice_date: '2026-02-21',
    status: 'approved',
    created_at: '2026-02-22T08:15:00Z',
    project_name: 'Cross-dock Puebla',
    project_code: 'XD-PUE-004',
    is_late: false,
    late_reason: null,
    needs_project_review: true,
  },
  {
    id: 'inv-005',
    uuid: 'E5F6A7B8-C9D0-1234-EFAB-345678901234',
    folio: '155',
    issuer_rfc: 'TOCA870903EEE',
    issuer_name: 'Transportes Torres Castillo',
    total_amount: 9850.00,
    net_payment_amount: null,
    payment_program: 'standard',
    pronto_pago_fee_amount: null,
    payment_week: 8,
    payment_year: 2026,
    invoice_date: '2026-02-18',
    status: 'rejected',
    created_at: '2026-02-19T14:20:00Z',
    project_name: 'Última Milla CDMX',
    project_code: 'UM-CDMX-001',
    is_late: false,
    late_reason: null,
    needs_project_review: false,
  },
];

const MOCK_STATS: DashboardStats = {
  totalInvoices: 247,
  totalAmount: 1845230.50,
  totalProntoPago: 89,
  totalStandard: 158,
  prontoPagoAmount: 723450.00,
  standardAmount: 1121780.50,
  prontoPagoFees: 21703.50,
  thisWeekInvoices: 34,
  lastWeekInvoices: 28,
  currentWeek: 9,
  currentYear: 2026,
  totalLate: 12,
  lateAmount: 89340.00,
  needsProjectReview: 5,
};

// ========== Token Management ==========

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
}

export function getStoredToken(): string | null {
  if (authToken) return authToken;
  return localStorage.getItem('admin_token');
}

// ========== Mock API Functions ==========

/** Login admin user */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; admin?: AdminUser; message: string }> {
  // Mock: accept any email/password combo
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (email && password) {
    setAuthToken('mock-jwt-token-' + Date.now());
    return {
      success: true,
      admin: { ...MOCK_ADMIN, email },
      message: 'Login exitoso',
    };
  }

  return {
    success: false,
    message: 'Credenciales inválidas',
  };
}

/** Login admin user via Google OAuth */
export async function adminGoogleLogin(
  credential: string
): Promise<{ success: boolean; admin?: AdminUser; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (credential) {
    setAuthToken('mock-google-token-' + Date.now());
    return {
      success: true,
      admin: MOCK_ADMIN,
      message: 'Login con Google exitoso',
    };
  }

  return {
    success: false,
    message: 'Error en autenticación con Google',
  };
}

/**
 * Logout admin user
 */
export async function adminLogout(): Promise<void> {
  setAuthToken(null);
}

/** Check current session */
export async function checkSession(): Promise<{ 
  isValid: boolean; 
  admin?: AdminUser 
}> {
  const token = getStoredToken();
  if (!token) {
    return { isValid: false };
  }

  // Mock: token always valid
  return {
    isValid: true,
    admin: MOCK_ADMIN,
  };
}

/** Get dashboard stats */
export async function getStats(): Promise<{
  success: boolean;
  stats?: DashboardStats;
  recentInvoices?: RecentInvoice[];
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    success: true,
    stats: MOCK_STATS,
    recentInvoices: MOCK_INVOICES.slice(0, 3).map(inv => ({
      id: inv.id,
      uuid: inv.uuid,
      issuer_name: inv.issuer_name,
      total_amount: inv.total_amount,
      payment_program: inv.payment_program,
      created_at: inv.created_at,
      status: inv.status,
      is_late: inv.is_late || false,
      late_reason: inv.late_reason || null,
      needs_project_review: inv.needs_project_review || false,
    })),
    message: 'OK',
  };
}

/** Get invoices with filters */
export async function getInvoices(
  filters: InvoiceFilters = {}
): Promise<{
  success: boolean;
  data?: InvoicesResponse;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let filtered = [...MOCK_INVOICES];
  
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(inv => 
      inv.issuer_name.toLowerCase().includes(q) || 
      inv.issuer_rfc.toLowerCase().includes(q) ||
      inv.uuid.toLowerCase().includes(q)
    );
  }
  if (filters.status) {
    filtered = filtered.filter(inv => inv.status === filters.status);
  }
  if (filters.paymentProgram) {
    filtered = filtered.filter(inv => inv.payment_program === filters.paymentProgram);
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;

  return {
    success: true,
    data: {
      invoices: filtered,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
    message: 'OK',
  };
}

/** Export invoices to CSV */
export async function exportInvoicesCSV(
  _filters: ExportFilters = {}
): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Not implemented' };
}

/** Export invoices to JSON */
export async function exportInvoicesJSON(
  _filters: ExportFilters = {}
): Promise<{
  success: boolean;
  data?: unknown;
  message: string;
}> {
  return {
    success: true,
    data: MOCK_INVOICES,
    message: 'Mock data',
  };
}

/** Export payments XLSX */
export interface PaymentExportFilters {
  week: number;
  year: number;
  project?: string;
  status?: string;
}

export async function exportPaymentsXLSX(
  _filters: PaymentExportFilters
): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Not implemented' };
}

// ========== System Config ==========

export interface SystemConfig {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  category: string;
  is_sensitive: boolean;
  updated_at: string;
}

export async function getSystemConfig(_key?: string): Promise<{
  success: boolean;
  data?: SystemConfig | SystemConfig[];
  message: string;
}> {
  return {
    success: true,
    data: [],
    message: 'Not implemented',
  };
}

export async function updateSystemConfig(
  _key: string,
  _value: Record<string, unknown>,
  _description?: string
): Promise<{
  success: boolean;
  data?: SystemConfig;
  message: string;
}> {
  return {
    success: false,
    message: 'Not implemented',
  };
}

// ========== API Keys ==========

export interface ApiKeyInfo {
  id: string;
  name: string;
  description: string | null;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  total_requests: number;
  expires_at: string | null;
  status: 'active' | 'expired' | 'revoked';
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  expires_at: string | null;
}

export async function listApiKeys(): Promise<{
  success: boolean;
  data?: ApiKeyInfo[];
  message: string;
}> {
  return {
    success: true,
    data: [
      {
        id: 'key-001',
        name: 'API de Producción',
        description: 'Llave principal para integraciones',
        key_prefix: 'tf_live_',
        scopes: ['invoices:read', 'invoices:write'],
        rate_limit_per_minute: 60,
        rate_limit_per_day: 10000,
        is_active: true,
        created_at: '2026-01-15T10:00:00Z',
        last_used_at: '2026-02-22T14:30:00Z',
        total_requests: 4521,
        expires_at: null,
        status: 'active',
      }
    ],
    message: 'OK',
  };
}

export async function createApiKey(_params: {
  name: string;
  description?: string;
  scopes?: string[];
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  expires_in_days?: number;
}): Promise<{
  success: boolean;
  data?: CreateApiKeyResponse;
  message: string;
}> {
  return {
    success: false,
    message: 'Not implemented',
  };
}

export async function revokeApiKey(_id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return {
    success: false,
    message: 'Not implemented',
  };
}
