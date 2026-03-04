/**
 * User API Service
 * 
 * Currently returns mock data for UI development.
 */

// Store token in memory and localStorage
let authToken: string | null = null;

export interface UserProfile {
  id: string;
  rfc: string | null;
  fiscal_name: string | null;
  trade_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  type: 'flotillero' | 'independiente';
  status: string;
  email_verified: boolean;
  whatsapp_verified: boolean;
  whatsapp_verified_at: string | null;
  whatsapp_expired?: boolean;
  bank_name: string | null;
  bank_clabe: string | null;
  bank_institution_id: string | null;
  onboarding_completed: boolean;
  requires_password_change: boolean;
  last_login_at: string | null;
  created_at: string;
  stats?: {
    drivers_count: number;
    invoices_total: number;
    invoices_paid: number;
    invoices_pending: number;
    total_facturado: number;
  };
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface OnboardingStatus {
  currentStep: string;
  steps: {
    verify_email: { completed: boolean; required: boolean };
    verify_whatsapp: { completed: boolean; required: boolean; expired: boolean };
    bank_info: { completed: boolean; required: boolean };
    profile_info: { completed: boolean; required: boolean };
    upload_csd: { completed: boolean; required: boolean; skipped: boolean };
    change_password: { completed: boolean; required: boolean };
  };
  isComplete: boolean;
  canComplete: boolean;
  user: {
    email: string;
    email_verified: boolean;
    whatsapp_verified: boolean;
    whatsapp_verified_at: string | null;
    rfc: string | null;
    fiscal_name: string | null;
    fiscal_regime_code: string | null;
    fiscal_zip_code: string | null;
    phone: string | null;
    address: string | null;
    bank_name: string | null;
    bank_clabe: string | null;
    requires_password_change: boolean;
  };
}

export interface UserInvoice {
  id: string;
  uuid: string;
  folio: string | null;
  invoice_date: string;
  total_amount: number;
  net_payment_amount: number | null;
  payment_program: string;
  pronto_pago_fee_amount: number | null;
  payment_week: number;
  payment_year: number;
  status: string;
  created_at: string;
  project_name: string | null;
  project_code: string | null;
  is_late?: boolean;
  late_reason?: string | null;
}

export interface InvoicesResponse {
  invoices: UserInvoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total_facturado: number;
    total_pendiente: number;
    total_pagado: number;
    count_pending: number;
    count_paid: number;
  };
}

// ========== Mock Data ==========

const MOCK_USER: UserProfile = {
  id: 'usr-001',
  rfc: 'GASA850101AAA',
  fiscal_name: 'Transportes García SA de CV',
  trade_name: 'Transportes García',
  email: 'contacto@transportesgarcia.com',
  phone: '+525512345678',
  address: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, CP 03100',
  type: 'flotillero',
  status: 'active',
  email_verified: true,
  whatsapp_verified: true,
  whatsapp_verified_at: '2026-01-15T10:00:00Z',
  bank_name: 'BBVA',
  bank_clabe: '012180015678901234',
  bank_institution_id: '40012',
  onboarding_completed: true,
  requires_password_change: false,
  last_login_at: '2026-02-22T08:30:00Z',
  created_at: '2025-11-01T12:00:00Z',
  stats: {
    drivers_count: 15,
    invoices_total: 42,
    invoices_paid: 35,
    invoices_pending: 7,
    total_facturado: 580340.00,
  },
};

const MOCK_USER_INVOICES: UserInvoice[] = [
  {
    id: 'inv-u001',
    uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    folio: '1042',
    invoice_date: '2026-02-20',
    total_amount: 45680.00,
    net_payment_amount: 44310.00,
    payment_program: 'pronto_pago',
    pronto_pago_fee_amount: 1370.40,
    payment_week: 8,
    payment_year: 2026,
    status: 'approved',
    created_at: '2026-02-21T10:30:00Z',
    project_name: 'Última Milla CDMX',
    project_code: 'UM-CDMX-001',
  },
  {
    id: 'inv-u002',
    uuid: 'F6A7B8C9-D0E1-2345-FGAB-456789012345',
    folio: '1041',
    invoice_date: '2026-02-15',
    total_amount: 32100.00,
    net_payment_amount: null,
    payment_program: 'standard',
    pronto_pago_fee_amount: null,
    payment_week: 7,
    payment_year: 2026,
    status: 'paid',
    created_at: '2026-02-16T14:00:00Z',
    project_name: 'Distribución GDL',
    project_code: 'DIST-GDL-002',
  },
  {
    id: 'inv-u003',
    uuid: 'G7B8C9D0-E1F2-3456-GHBC-567890123456',
    folio: '1040',
    invoice_date: '2026-02-10',
    total_amount: 18750.50,
    net_payment_amount: null,
    payment_program: 'standard',
    pronto_pago_fee_amount: null,
    payment_week: 6,
    payment_year: 2026,
    status: 'paid',
    created_at: '2026-02-11T09:45:00Z',
    project_name: 'Última Milla CDMX',
    project_code: 'UM-CDMX-001',
  },
];

// ========== Token Management ==========

export function setUserToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('user_token', token);
  } else {
    localStorage.removeItem('user_token');
  }
}

export function getStoredUserToken(): string | null {
  if (authToken) return authToken;
  return localStorage.getItem('user_token');
}

// ========== Authentication ==========

/** Login user */
export async function userLogin(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (email && password) {
    setUserToken('mock-user-token-' + Date.now());
    return {
      success: true,
      user: { ...MOCK_USER, email },
      message: 'Login exitoso',
    };
  }

  return {
    success: false,
    message: 'Credenciales inválidas',
  };
}

export async function userLogout(): Promise<void> {
  setUserToken(null);
}

/** Check current user session */
export async function checkUserSession(): Promise<{
  isValid: boolean;
  user?: UserProfile;
}> {
  const token = getStoredUserToken();
  if (!token) {
    return { isValid: false };
  }

  return {
    isValid: true,
    user: MOCK_USER,
  };
}

// ========== Profile ==========

export async function getUserProfile(): Promise<{
  success: boolean;
  data?: UserProfile;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    success: true,
    data: MOCK_USER,
    message: 'OK',
  };
}

export async function updateUserProfile(_data: {
  phone?: string;
  address?: string;
  trade_name?: string;
  bank_name?: string;
  bank_clabe?: string;
  bank_institution_id?: string;
}): Promise<{
  success: boolean;
  data?: Partial<UserProfile>;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    data: _data,
    message: 'Perfil actualizado (mock)',
  };
}

// ========== Onboarding ==========

export async function getOnboardingStatus(): Promise<{
  success: boolean;
  data?: OnboardingStatus;
  message: string;
}> {
  return {
    success: true,
    data: {
      currentStep: 'complete',
      steps: {
        verify_email: { completed: true, required: true },
        verify_whatsapp: { completed: true, required: true, expired: false },
        bank_info: { completed: true, required: true },
        profile_info: { completed: true, required: true },
        upload_csd: { completed: false, required: false, skipped: true },
        change_password: { completed: true, required: true },
      },
      isComplete: true,
      canComplete: true,
      user: {
        email: MOCK_USER.email,
        email_verified: true,
        whatsapp_verified: true,
        whatsapp_verified_at: MOCK_USER.whatsapp_verified_at,
        rfc: MOCK_USER.rfc,
        fiscal_name: MOCK_USER.fiscal_name,
        fiscal_regime_code: '601',
        fiscal_zip_code: '03100',
        phone: MOCK_USER.phone,
        address: MOCK_USER.address,
        bank_name: MOCK_USER.bank_name,
        bank_clabe: MOCK_USER.bank_clabe,
        requires_password_change: false,
      },
    },
    message: 'OK',
  };
}

export async function updateOnboardingBank(_data: {
  bank_name: string;
  bank_clabe: string;
  bank_account_number?: string;
  bank_institution_id?: string;
}): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: 'Información bancaria guardada (mock)' };
}

export async function updateOnboardingProfile(_data: {
  rfc: string;
  fiscal_name: string;
  phone: string;
  address: string;
  trade_name?: string;
}): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: 'Perfil fiscal guardado (mock)' };
}

export async function updateOnboardingPassword(_data: {
  current_password: string;
  new_password: string;
}): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: 'Contraseña actualizada (mock)' };
}

export async function completeOnboarding(): Promise<{
  success: boolean;
  message: string;
}> {
  return { success: true, message: 'Onboarding completado (mock)' };
}

export async function skipCSDOnboarding(): Promise<{
  success: boolean;
  message: string;
}> {
  return { success: true, message: 'CSD omitido (mock)' };
}

// ========== Invoices ==========

export interface InvoiceFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  week?: number;
  year?: number;
}

export async function getUserInvoices(
  _filters: InvoiceFilters = {}
): Promise<{
  success: boolean;
  data?: InvoicesResponse;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    success: true,
    data: {
      invoices: MOCK_USER_INVOICES,
      total: MOCK_USER_INVOICES.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      summary: {
        total_facturado: 96530.50,
        total_pendiente: 45680.00,
        total_pagado: 50850.50,
        count_pending: 1,
        count_paid: 2,
      },
    },
    message: 'OK',
  };
}

// ========== Magic Link ==========

export async function requestMagicLink(_email: string): Promise<{
  success: boolean;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 600));
  return {
    success: true,
    message: 'Si el correo está registrado, recibirás un enlace de acceso (mock)',
  };
}

export async function verifyMagicLink(_token: string): Promise<{
  success: boolean;
  user?: UserProfile;
  message: string;
}> {
  setUserToken('mock-magic-token-' + Date.now());
  return {
    success: true,
    user: MOCK_USER,
    message: 'Verificación exitosa (mock)',
  };
}

// ========== Email Verification ==========

export async function sendVerificationCode(): Promise<{
  success: boolean;
  message: string;
  data?: { alreadyVerified?: boolean; expiresMinutes?: number };
}> {
  return {
    success: true,
    message: 'Código de verificación enviado (mock)',
    data: { expiresMinutes: 10 },
  };
}

export async function verifyEmailCode(_code: string): Promise<{
  success: boolean;
  message: string;
  data?: { emailVerified?: boolean };
  error?: string;
}> {
  return {
    success: true,
    message: 'Email verificado (mock)',
    data: { emailVerified: true },
  };
}

// ========== WhatsApp Verification ==========

export async function sendWhatsAppVerificationCode(_phone: string): Promise<{
  success: boolean;
  message: string;
  data?: { alreadyVerified?: boolean; expiresMinutes?: number };
}> {
  return {
    success: true,
    message: 'Código de WhatsApp enviado (mock)',
    data: { expiresMinutes: 5 },
  };
}

export async function verifyWhatsAppCode(_code: string): Promise<{
  success: boolean;
  message: string;
  data?: { whatsappVerified?: boolean };
  error?: string;
}> {
  return {
    success: true,
    message: 'WhatsApp verificado (mock)',
    data: { whatsappVerified: true },
  };
}

// ========== Password Reset ==========

export async function requestPasswordReset(_email: string): Promise<{
  success: boolean;
  message: string;
}> {
  return {
    success: true,
    message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña (mock)',
  };
}

export async function resetPassword(
  _email: string,
  _code: string,
  _newPassword: string
): Promise<{
  success: boolean;
  message: string;
}> {
  return {
    success: true,
    message: 'Contraseña restablecida (mock)',
  };
}
