import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAdminAuthContext } from '../../contexts/AdminAuthContext';

// Google OAuth Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

// Declare google global for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, isLoading: authLoading, isAuthenticated } = useAdminAuthContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Handle Google OAuth callback
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setError(null);
    setIsSubmitting(true);

    const result = await signInWithGoogle(response.credential);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message);
    }
    
    setIsSubmitting(false);
  }, [signInWithGoogle, navigate]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google OAuth Client ID not configured');
      return;
    }

    // Check if script already loaded
    if (window.google?.accounts) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts before script loads
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    if (!googleLoaded || !GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
    });

    // Render the button
    const buttonContainer = document.getElementById('google-signin-button');
    if (buttonContainer) {
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 400,
        logo_alignment: 'left',
      });
    }
  }, [googleLoaded, handleGoogleCallback]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message);
    }
    
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-tf-bg-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-tf-yellow/20 border-t-tf-yellow rounded-full animate-spin"></div>
          <p className="text-tf-gray-dark text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Yellow Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-tf-yellow items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-black rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/images/logo-full-black.svg"
              alt="TuFactura"
              className="h-16 w-auto mx-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-tf-black mb-4">
            Panel de Administración
          </h1>
          <p className="text-tf-black/70 text-lg max-w-sm mx-auto">
            Gestiona facturas, reportes y usuarios de FacturaFlow desde un solo lugar.
          </p>

          {/* Features */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 justify-center text-tf-black/80">
              <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Procesamiento automático de facturas</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-tf-black/80">
              <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Reportes de pagos semanales</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-tf-black/80">
              <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Gestión de Pronto Pago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/images/logo-full-color.svg"
              alt="TuFactura"
              className="h-10 w-auto mx-auto mb-4"
            />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-tf-yellow/10 rounded-full">
              <div className="w-2 h-2 bg-tf-yellow rounded-full animate-pulse"></div>
              <span className="text-tf-yellow-accent text-sm font-medium">
                Panel de Administración
              </span>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-tf-black mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-tf-gray-dark">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign-In Button */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="mb-6">
                <div 
                  id="google-signin-button" 
                  className="flex justify-center"
                  style={{ minHeight: '44px' }}
                >
                  {!googleLoaded && (
                    <div className="w-full py-3 bg-white border border-tf-gray-light rounded-xl flex items-center justify-center gap-3 text-tf-gray-dark">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cargando Google...
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-tf-gray-light"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-tf-gray-dark">
                    o continúa con correo
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-tf-black mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tf-gray-dark/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@tf.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-tf-bg-main border border-tf-gray-light rounded-xl text-tf-black placeholder-tf-gray-dark/50 focus:outline-none focus:border-tf-yellow focus:ring-2 focus:ring-tf-yellow/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-tf-black mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tf-gray-dark/50" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-tf-bg-main border border-tf-gray-light rounded-xl text-tf-black placeholder-tf-gray-dark/50 focus:outline-none focus:border-tf-yellow focus:ring-2 focus:ring-tf-yellow/20 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full py-4 bg-tf-yellow hover:bg-tf-yellow-dark text-tf-black font-semibold rounded-xl shadow-lg shadow-tf-yellow/25 hover:shadow-tf-yellow/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-tf-gray-dark/70 text-sm mt-8">
            Solo personal autorizado de TuFactura
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
