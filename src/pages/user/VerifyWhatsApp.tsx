import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useUserAuthContext } from '../../contexts/UserAuthContext';
import {
  sendWhatsAppVerificationCode,
  verifyWhatsAppCode,
} from '../../services/userService';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const VerifyWhatsApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useUserAuthContext();

  const [phoneInput, setPhoneInput] = useState('');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone && !phoneInput) {
      setPhoneInput(user.phone.replace(/\D/g, ''));
    }
  }, [user]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendCode = useCallback(async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('El teléfono debe tener 10 dígitos.');
      return;
    }

    setIsSending(true);
    setError(null);

    const result = await sendWhatsAppVerificationCode(cleanPhone);

    if (result.success) {
      if (result.data?.alreadyVerified) {
        setSuccess('Tu WhatsApp ya está verificado.');
        await refreshUser();
        navigate('/portal/dashboard');
      } else {
        setCodeSent(true);
        setResendCooldown(RESEND_COOLDOWN);
        setSuccess('Código enviado a tu WhatsApp.');
      }
    } else {
      setError(result.message);
    }

    setIsSending(false);
  }, [phoneInput, refreshUser, navigate]);

  const handleVerifyCode = useCallback(async () => {
    const codeStr = code.join('');
    if (codeStr.length !== CODE_LENGTH) {
      setError('Ingresa el código completo de 6 dígitos.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = await verifyWhatsAppCode(codeStr);

    if (result.success) {
      setSuccess('¡WhatsApp verificado! Redirigiendo...');
      await refreshUser();
      setTimeout(() => navigate('/portal/dashboard'), 1000);
    } else {
      setError(result.message);
      if (result.error === 'INVALID_CODE' || result.error === 'MAX_ATTEMPTS') {
        setCode(Array(CODE_LENGTH).fill(''));
        codeRefs.current[0]?.focus();
      }
      if (result.error === 'CODE_EXPIRED' || result.error === 'MAX_ATTEMPTS') {
        setCodeSent(false);
      }
    }

    setIsVerifying(false);
  }, [code, refreshUser, navigate]);

  const handleCodeInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }

    if (digit && index === CODE_LENGTH - 1 && newCode.every((d) => d !== '')) {
      setTimeout(() => {
        if (newCode.join('').length === CODE_LENGTH) {
          handleVerifyCode();
        }
      }, 150);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    codeRefs.current[focusIndex]?.focus();

    if (pasted.length === CODE_LENGTH) {
      setTimeout(() => handleVerifyCode(), 150);
    }
  };

  return (
    <div className="min-h-screen bg-tf-bg-main flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,216,64,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,216,64,0.05),transparent_50%)]"></div>
      </div>

      <div className="bg-white rounded-2xl border border-tf-gray-light w-full max-w-md overflow-hidden shadow-xl relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-tf-gray-light bg-tf-yellow">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-8 h-8 text-tf-black" />
            <h1 className="text-xl font-bold text-tf-black">Verificación requerida</h1>
          </div>
          <p className="text-tf-black/70 text-sm">
            Tu verificación de WhatsApp ha expirado. Renuévala para continuar.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {!codeSent ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-tf-black mb-2">
                Renueva tu verificación
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Enviaremos un código de 6 dígitos a tu WhatsApp.
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
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-tf-gray-light rounded-xl text-tf-black font-mono text-lg tracking-wider focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
                    placeholder="55 1234 5678"
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleSendCode}
                disabled={isSending || phoneInput.replace(/\D/g, '').length !== 10}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                {isSending ? (
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
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-tf-black mb-2">Ingresa el código</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Enviamos un código a{' '}
                <strong className="text-tf-black">+52 {phoneInput}</strong>{' '}
                vía WhatsApp
              </p>

              <div className="flex justify-center gap-3 mb-6" onPaste={handleCodePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-tf-gray-light rounded-xl text-tf-black focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={isVerifying || code.join('').length !== CODE_LENGTH}
                className="w-full max-w-xs mx-auto py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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

              <div className="mt-4">
                {resendCooldown > 0 ? (
                  <p className="text-gray-400 text-sm">
                    Reenviar código en{' '}
                    <span className="font-mono font-semibold text-tf-black">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleSendCode}
                    disabled={isSending}
                    className="text-sm text-tf-black/70 hover:text-tf-black font-medium flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    {isSending ? (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyWhatsApp;
