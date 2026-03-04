import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Circle,
  Mail,
  Smartphone,
  Building2,
  User,
  Key,
  FileKey,
  Loader2,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  SkipForward,
} from 'lucide-react';
import { useUserAuthContext } from '../../contexts/UserAuthContext';
import {
  updateOnboardingBank,
  updateOnboardingProfile,
  updateOnboardingPassword,
  completeOnboarding,
  skipCSDOnboarding,
  sendVerificationCode,
  verifyEmailCode,
  sendWhatsAppVerificationCode,
  verifyWhatsAppCode,
} from '../../services/userService';
import { CSDUploadSection } from '../../components/user/CSDUploadSection';
import type { CSDStatus } from '../../services/invoicingService';

type OnboardingStepKey = 'verify_email' | 'verify_whatsapp' | 'bank_info' | 'profile_info' | 'upload_csd' | 'change_password';
type CurrentStepKey = OnboardingStepKey | 'completed';

const STEPS: { key: OnboardingStepKey; label: string; icon: React.ReactNode }[] = [
  { key: 'verify_email', label: 'Email', icon: <Mail className="w-5 h-5" /> },
  { key: 'verify_whatsapp', label: 'WhatsApp', icon: <Smartphone className="w-5 h-5" /> },
  { key: 'bank_info', label: 'Datos Bancarios', icon: <Building2 className="w-5 h-5" /> },
  { key: 'profile_info', label: 'Información', icon: <User className="w-5 h-5" /> },
  { key: 'upload_csd', label: 'CSD', icon: <FileKey className="w-5 h-5" /> },
  { key: 'change_password', label: 'Contraseña', icon: <Key className="w-5 h-5" /> },
];

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { onboardingStatus, refreshOnboarding, refreshUser } = useUserAuthContext();

  const [currentStep, setCurrentStep] = useState<CurrentStepKey>('verify_email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email verification state
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // WhatsApp verification state
  const [phoneInput, setPhoneInput] = useState('');
  const [whatsappCode, setWhatsappCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [whatsappCodeSent, setWhatsappCodeSent] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [isVerifyingWhatsapp, setIsVerifyingWhatsapp] = useState(false);
  const [whatsappResendCooldown, setWhatsappResendCooldown] = useState(0);
  const whatsappInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Bank form
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_clabe: '',
    bank_account_number: '',
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    rfc: '',
    fiscal_name: '',
    fiscal_regime_code: '',
    fiscal_zip_code: '',
    phone: '',
    address: '',
    trade_name: '',
  });

  // SAT Fiscal Regime Catalog
  const FISCAL_REGIMES = [
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
    { code: '616', name: 'Sin obligaciones fiscales' },
    { code: '620', name: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
    { code: '621', name: 'Incorporación Fiscal' },
    { code: '622', name: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
    { code: '623', name: 'Opcional para Grupos de Sociedades' },
    { code: '624', name: 'Coordinados' },
    { code: '625', name: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
    { code: '626', name: 'Régimen Simplificado de Confianza' },
    { code: '628', name: 'Hidrocarburos' },
    { code: '629', name: 'De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales' },
    { code: '630', name: 'Enajenación de acciones en bolsa de valores' },
  ];

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (onboardingStatus) {
      setCurrentStep(onboardingStatus.currentStep as CurrentStepKey);

      // Pre-fill forms with existing data
      if (onboardingStatus.user) {
        setProfileForm((prev) => ({
          ...prev,
          rfc: onboardingStatus.user.rfc || '',
          fiscal_name: onboardingStatus.user.fiscal_name || '',
          fiscal_regime_code: onboardingStatus.user.fiscal_regime_code || '',
          fiscal_zip_code: onboardingStatus.user.fiscal_zip_code || '',
          phone: onboardingStatus.user.phone || '',
          address: onboardingStatus.user.address || '',
        }));

        // Pre-fill phone for WhatsApp step
        if (onboardingStatus.user.phone && !phoneInput) {
          setPhoneInput(onboardingStatus.user.phone);
        }
      }
    }
  }, [onboardingStatus]);

  // Email resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // WhatsApp resend cooldown timer
  useEffect(() => {
    if (whatsappResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setWhatsappResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [whatsappResendCooldown]);

  // ========== Email Verification Handlers ==========

  const handleSendCode = useCallback(async () => {
    setIsSendingCode(true);
    setError(null);

    const result = await sendVerificationCode();

    if (result.success) {
      if (result.data?.alreadyVerified) {
        setSuccess('Tu correo ya está verificado.');
        await refreshOnboarding();
      } else {
        setCodeSent(true);
        setResendCooldown(RESEND_COOLDOWN);
        setSuccess('Código enviado a tu correo. Revisa tu bandeja de entrada.');
      }
    } else {
      setError(result.message);
    }

    setIsSendingCode(false);
  }, [refreshOnboarding]);

  const handleVerifyCode = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Ingresa el código completo de 6 dígitos.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = await verifyEmailCode(code);

    if (result.success) {
      setSuccess('¡Correo verificado exitosamente!');
      setVerificationCode(Array(CODE_LENGTH).fill(''));
      await refreshOnboarding();
    } else {
      setError(result.message);
      // Clear code on invalid attempt
      if (result.error === 'INVALID_CODE' || result.error === 'MAX_ATTEMPTS') {
        setVerificationCode(Array(CODE_LENGTH).fill(''));
        codeInputRefs.current[0]?.focus();
      }
      // Code expired — allow resend
      if (result.error === 'CODE_EXPIRED' || result.error === 'MAX_ATTEMPTS') {
        setCodeSent(false);
      }
    }

    setIsVerifying(false);
  }, [verificationCode, refreshOnboarding]);

  const handleCodeInput = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === CODE_LENGTH - 1 && newCode.every((d) => d !== '')) {
      // Small delay so user sees the last digit before submit
      setTimeout(() => {
        const code = newCode.join('');
        if (code.length === CODE_LENGTH) {
          handleVerifyCode();
        }
      }, 150);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pasted.length === 0) return;

    const newCode = [...verificationCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setVerificationCode(newCode);

    // Focus last filled input or the next empty one
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    codeInputRefs.current[focusIndex]?.focus();

    // Auto-submit if complete
    if (pasted.length === CODE_LENGTH) {
      setTimeout(() => handleVerifyCode(), 150);
    }
  };

  // ========== WhatsApp Verification Handlers ==========

  const handleSendWhatsAppCode = useCallback(async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('El teléfono debe tener 10 dígitos.');
      return;
    }

    setIsSendingWhatsapp(true);
    setError(null);

    const result = await sendWhatsAppVerificationCode(cleanPhone);

    if (result.success) {
      if (result.data?.alreadyVerified) {
        setSuccess('Tu WhatsApp ya está verificado.');
        await refreshOnboarding();
      } else {
        setWhatsappCodeSent(true);
        setWhatsappResendCooldown(RESEND_COOLDOWN);
        setSuccess('Código enviado a tu WhatsApp. Revisa tus mensajes.');
      }
    } else {
      setError(result.message);
    }

    setIsSendingWhatsapp(false);
  }, [phoneInput, refreshOnboarding]);

  const handleVerifyWhatsAppCode = useCallback(async () => {
    const code = whatsappCode.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Ingresa el código completo de 6 dígitos.');
      return;
    }

    setIsVerifyingWhatsapp(true);
    setError(null);

    const result = await verifyWhatsAppCode(code);

    if (result.success) {
      setSuccess('¡WhatsApp verificado exitosamente!');
      setWhatsappCode(Array(CODE_LENGTH).fill(''));
      await refreshOnboarding();
    } else {
      setError(result.message);
      if (result.error === 'INVALID_CODE' || result.error === 'MAX_ATTEMPTS') {
        setWhatsappCode(Array(CODE_LENGTH).fill(''));
        whatsappInputRefs.current[0]?.focus();
      }
      if (result.error === 'CODE_EXPIRED' || result.error === 'MAX_ATTEMPTS') {
        setWhatsappCodeSent(false);
      }
    }

    setIsVerifyingWhatsapp(false);
  }, [whatsappCode, refreshOnboarding]);

  const handleWhatsappCodeInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...whatsappCode];
    newCode[index] = digit;
    setWhatsappCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      whatsappInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === CODE_LENGTH - 1 && newCode.every((d) => d !== '')) {
      setTimeout(() => {
        const code = newCode.join('');
        if (code.length === CODE_LENGTH) {
          handleVerifyWhatsAppCode();
        }
      }, 150);
    }
  };

  const handleWhatsappCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !whatsappCode[index] && index > 0) {
      whatsappInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyWhatsAppCode();
    }
  };

  const handleWhatsappCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pasted.length === 0) return;

    const newCode = [...whatsappCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setWhatsappCode(newCode);

    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    whatsappInputRefs.current[focusIndex]?.focus();

    if (pasted.length === CODE_LENGTH) {
      setTimeout(() => handleVerifyWhatsAppCode(), 150);
    }
  };

  // ========== CSD Upload Handlers ==========

  const handleCSDStatusChange = useCallback(async (csdStatus: CSDStatus) => {
    if (csdStatus.status === 'active' && csdStatus.invoicingEnabled) {
      setSuccess('¡CSD cargado exitosamente! Facturación habilitada.');
      await refreshOnboarding();
    }
  }, [refreshOnboarding]);

  const handleSkipCSD = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await skipCSDOnboarding();

    if (result.success) {
      setSuccess('Paso omitido. Podrás cargar tu CSD después desde Facturación.');
      await refreshOnboarding();
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  }, [refreshOnboarding]);

  const getStepStatus = (stepKey: OnboardingStepKey): 'completed' | 'current' | 'pending' => {
    if (!onboardingStatus?.steps) return 'pending';

    const step = onboardingStatus.steps[stepKey];
    if (!step) return 'pending';

    if (step.completed) return 'completed';
    // Treat skipped CSD step as completed in progress bar
    if (stepKey === 'upload_csd' && 'skipped' in step && step.skipped) return 'completed';
    // WhatsApp expired = needs re-verification → treat as current if we're on it
    if (stepKey === 'verify_whatsapp' && 'expired' in step && step.expired && stepKey === currentStep) return 'current';
    if (stepKey === currentStep) return 'current';
    return 'pending';
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (bankForm.bank_clabe.length !== 18) {
      setError('La CLABE debe tener exactamente 18 dígitos');
      setIsSubmitting(false);
      return;
    }

    const result = await updateOnboardingBank(bankForm);

    if (result.success) {
      setSuccess('Información bancaria guardada');
      await refreshOnboarding();
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await updateOnboardingProfile(profileForm);

    if (result.success) {
      setSuccess('Información de perfil guardada');
      await refreshOnboarding();
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Las contraseñas no coinciden');
      setIsSubmitting(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setIsSubmitting(false);
      return;
    }

    const result = await updateOnboardingPassword({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });

    if (result.success) {
      setSuccess('Contraseña actualizada');
      await refreshOnboarding();
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await completeOnboarding();

    if (result.success) {
      // Refresh user state to update onboarding_completed flag
      await refreshUser();
      navigate('/portal/dashboard');
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'verify_email':
        return (
          <div className="text-center py-8">
            {onboardingStatus?.steps.verify_email.completed ? (
              <>
                <div className="w-20 h-20 bg-tf-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-tf-yellow-accent" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">Email Verificado</h3>
                <p className="text-gray-500 mb-6">
                  Tu email {onboardingStatus.user.email} ha sido verificado.
                </p>
                <button
                  onClick={() => setCurrentStep('bank_info')}
                  className="px-6 py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black rounded-xl font-semibold shadow-tf"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </button>
              </>
            ) : !codeSent ? (
              /* Step 1: Send verification code */
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">Verifica tu Email</h3>
                <p className="text-gray-500 mb-6">
                  Enviaremos un código de 6 dígitos a{' '}
                  <strong className="text-tf-black">{onboardingStatus?.user.email}</strong>
                </p>
                <button
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="px-6 py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black rounded-xl font-semibold shadow-tf disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Enviar código de verificación
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Step 2: Enter 6-digit code */
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">Ingresa el código</h3>
                <p className="text-gray-500 mb-6">
                  Enviamos un código de 6 dígitos a{' '}
                  <strong className="text-tf-black">{onboardingStatus?.user.email}</strong>
                </p>

                {/* 6-digit code inputs */}
                <div className="flex justify-center gap-3 mb-6" onPaste={handleCodePaste}>
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { codeInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:border-tf-yellow focus:ring-2 focus:ring-tf-yellow/30 transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <button
                  onClick={handleVerifyCode}
                  disabled={isVerifying || verificationCode.join('').length !== CODE_LENGTH}
                  className="w-full max-w-xs mx-auto py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-semibold rounded-xl shadow-tf disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verificar código
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="mt-4">
                  {resendCooldown > 0 ? (
                <p className="text-gray-400 text-sm">
                      Reenviar código en <span className="font-mono font-semibold text-tf-black">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendCode}
                      disabled={isSendingCode}
                      className="text-sm text-tf-black/70 hover:text-tf-black font-medium flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      {isSendingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Reenviar código
                    </button>
                  )}
                </div>

                <p className="text-gray-400 text-xs mt-4">
                  El código expira en 15 minutos. Revisa también tu carpeta de spam.
                </p>
              </>
            )}
          </div>
        );

      case 'verify_whatsapp':
        return (
          <div className="text-center py-8">
            {onboardingStatus?.steps.verify_whatsapp.completed ? (
              <>
                <div className="w-20 h-20 bg-tf-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-tf-yellow-accent" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">WhatsApp Verificado</h3>
                <p className="text-gray-500 mb-6">
                  Tu número de WhatsApp ha sido verificado.
                </p>
                <button
                  onClick={() => setCurrentStep('bank_info')}
                  className="px-6 py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black rounded-xl font-semibold shadow-tf"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </button>
              </>
            ) : !whatsappCodeSent ? (
              /* Step 1: Enter phone + send code */
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">
                  {onboardingStatus?.steps.verify_whatsapp.expired
                    ? 'Renueva tu verificación de WhatsApp'
                    : 'Verifica tu WhatsApp'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {onboardingStatus?.steps.verify_whatsapp.expired
                    ? 'Tu verificación de WhatsApp ha expirado. Ingresa tu número para renovarla.'
                    : 'Enviaremos un código de 6 dígitos a tu WhatsApp para verificar tu número.'}
                </p>

                <div className="max-w-xs mx-auto mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Número de teléfono (10 dígitos)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-mono text-lg flex-shrink-0">+52</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-tf-gray-light rounded-xl text-tf-black font-mono text-lg tracking-wider focus:outline-none focus:border-tf-yellow focus:ring-2 focus:ring-tf-yellow/30 transition-all"
                      placeholder="55 1234 5678"
                      autoFocus
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1.5 text-left">
                    {phoneInput.replace(/\D/g, '').length}/10 dígitos
                  </p>
                </div>

                <button
                  onClick={handleSendWhatsAppCode}
                  disabled={isSendingWhatsapp || phoneInput.replace(/\D/g, '').length !== 10}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  {isSendingWhatsapp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      Enviar código por WhatsApp
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Step 2: Enter 6-digit code */
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">Ingresa el código</h3>
                <p className="text-gray-500 mb-6">
                  Enviamos un código de 6 dígitos a{' '}
                  <strong className="text-tf-black">+52 {phoneInput}</strong>{' '}
                  vía WhatsApp
                </p>

                {/* 6-digit code inputs */}
                <div className="flex justify-center gap-3 mb-6" onPaste={handleWhatsappCodePaste}>
                  {whatsappCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { whatsappInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleWhatsappCodeInput(index, e.target.value)}
                      onKeyDown={(e) => handleWhatsappCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <button
                  onClick={handleVerifyWhatsAppCode}
                  disabled={isVerifyingWhatsapp || whatsappCode.join('').length !== CODE_LENGTH}
                  className="w-full max-w-xs mx-auto py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isVerifyingWhatsapp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verificar código
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="mt-4">
                  {whatsappResendCooldown > 0 ? (
                    <p className="text-gray-400 text-sm">
                      Reenviar código en <span className="font-mono font-semibold text-tf-black">{whatsappResendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendWhatsAppCode}
                      disabled={isSendingWhatsapp}
                      className="text-sm text-tf-black/70 hover:text-tf-black font-medium flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      {isSendingWhatsapp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Reenviar código
                    </button>
                  )}
                </div>

                <p className="text-gray-400 text-xs mt-4">
                  El código expira en 15 minutos.
                </p>
              </>
            )}
          </div>
        );

      case 'bank_info':
        return (
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Banco *
              </label>
              <input
                type="text"
                required
                value={bankForm.bank_name}
                onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="BBVA, Santander, Banorte..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CLABE Interbancaria (18 dígitos) *
              </label>
              <input
                type="text"
                required
                maxLength={18}
                value={bankForm.bank_clabe}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bank_clabe: e.target.value.replace(/\D/g, '') })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black font-mono focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="000000000000000000"
              />
              <p className="text-gray-400 text-xs mt-1">
                {bankForm.bank_clabe.length}/18 dígitos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Cuenta <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={bankForm.bank_account_number}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bank_account_number: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="Número de cuenta"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-semibold rounded-xl shadow-tf disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Guardar y Continuar
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        );

      case 'profile_info':
        return (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RFC *</label>
              <input
                type="text"
                required
                maxLength={13}
                value={profileForm.rfc}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, rfc: e.target.value.toUpperCase() })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black font-mono focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="XAXX010101000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre o Razón Social *
              </label>
              <input
                type="text"
                required
                value={profileForm.fiscal_name}
                onChange={(e) => setProfileForm({ ...profileForm, fiscal_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="Juan Pérez García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Régimen Fiscal *
              </label>
              <select
                value={profileForm.fiscal_regime_code}
                onChange={(e) => setProfileForm({ ...profileForm, fiscal_regime_code: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
              >
                <option value="">Selecciona tu régimen fiscal</option>
                {FISCAL_REGIMES.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Postal Fiscal *
              </label>
              <input
                type="text"
                value={profileForm.fiscal_zip_code}
                onChange={(e) => setProfileForm({ ...profileForm, fiscal_zip_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="06600"
                maxLength={5}
              />
              <p className="mt-1 text-xs text-gray-500">El código postal de tu domicilio fiscal ante el SAT</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Comercial <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={profileForm.trade_name}
                onChange={(e) => setProfileForm({ ...profileForm, trade_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="Mi Empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
              <input
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="55 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
              <textarea
                required
                rows={2}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow resize-none"
                placeholder="Calle, número, colonia, ciudad, estado, CP"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-semibold rounded-xl shadow-tf disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Guardar y Continuar
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        );

      case 'upload_csd':
        return (
          <div className="py-4">
            {onboardingStatus?.steps.upload_csd.completed ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-tf-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-tf-yellow-accent" />
                </div>
                <h3 className="text-xl font-semibold text-tf-black mb-2">CSD Configurado</h3>
                <p className="text-gray-500 mb-6">
                  Tu Certificado de Sello Digital ya está activo. Podrás emitir facturas electrónicas.
                </p>
                <button
                  onClick={() => refreshOnboarding()}
                  className="px-6 py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black rounded-xl font-semibold shadow-tf"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileKey className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-tf-black mb-2">
                    Certificado de Sello Digital (CSD)
                  </h3>
                  <p className="text-gray-500">
                    Tu CSD es necesario para emitir facturas electrónicas ante el SAT.
                    Este paso es <strong>opcional</strong> — puedes configurarlo después.
                  </p>
                </div>

                <CSDUploadSection onStatusChange={handleCSDStatusChange} />

                <div className="mt-6 text-center">
                  <button
                    onClick={handleSkipCSD}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Omitiendo...
                      </>
                    ) : (
                      <>
                        <SkipForward className="w-4 h-4" />
                        Omitir por ahora
                      </>
                    )}
                  </button>
                  <p className="text-gray-400 text-xs mt-2">
                    Podrás cargar tu CSD después desde la sección de Facturación
                  </p>
                </div>
              </>
            )}
          </div>
        );

      case 'change_password':
        if (!onboardingStatus?.steps.change_password.required) {
          return (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-tf-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-tf-yellow-accent" />
              </div>
              <h3 className="text-xl font-semibold text-tf-black mb-2">¡Todo listo!</h3>
              <p className="text-gray-500 mb-6">Has completado toda la información requerida.</p>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="px-6 py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black rounded-xl font-semibold shadow-tf flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    Comenzar a usar el portal
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          );
        }

        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Cambio de contraseña requerido</span>
              </div>
              <p className="text-amber-600 text-sm">
                Por seguridad, debes cambiar tu contraseña temporal.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual (temporal) *
              </label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:ring-2 focus:ring-tf-yellow/50 focus:border-tf-yellow"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-semibold rounded-xl shadow-tf disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  Actualizar Contraseña
                  <Key className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  // Check if we can complete
  const canComplete = onboardingStatus?.canComplete && currentStep === 'completed';

  if (canComplete) {
    return (
      <div className="min-h-screen bg-tf-bg-main flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-tf-gray-light p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-tf-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-tf-yellow-accent" />
          </div>
          <h2 className="text-2xl font-bold text-tf-black mb-4">¡Configuración Completa!</h2>
          <p className="text-gray-500 mb-8">
            Has completado toda la información requerida. Ya puedes usar el portal.
          </p>
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="w-full py-4 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-semibold rounded-xl shadow-tf disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                Ir al Dashboard
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tf-bg-main flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,216,64,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,216,64,0.05),transparent_50%)]"></div>
      </div>

      <div className="bg-white rounded-2xl border border-tf-gray-light w-full max-w-2xl overflow-hidden shadow-xl relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-tf-gray-light bg-tf-yellow">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/images/logo-full-black.svg"
              alt="TuFactura"
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-tf-black">Configura tu cuenta</h1>
          <p className="text-tf-black/70 text-sm">Completa los siguientes pasos para comenzar</p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-tf-gray-light bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const status = getStepStatus(step.key);
              const isLast = index === STEPS.length - 1;

              // Skip password step if not required
              if (step.key === 'change_password' && !onboardingStatus?.steps.change_password.required) {
                return null;
              }

              // Show CSD step as completed (with check) if skipped
              // but still show it in the progress bar

              return (
                <React.Fragment key={step.key}>
                  <button
                    onClick={() => {
                      if (status === 'completed' || status === 'current') {
                        setCurrentStep(step.key);
                      }
                    }}
                    disabled={status === 'pending'}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      status === 'completed'
                        ? 'text-tf-yellow-accent'
                        : status === 'current'
                        ? 'text-tf-black bg-white shadow-sm border border-tf-gray-light'
                        : 'text-gray-400'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                  </button>
                  {!isLast && step.key !== 'change_password' && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        status === 'completed' ? 'bg-tf-yellow' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-tf-yellow/10 border border-tf-yellow/30 rounded-xl p-4 mb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-tf-yellow-accent flex-shrink-0" />
              <p className="text-tf-black">{success}</p>
            </div>
          )}

          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
