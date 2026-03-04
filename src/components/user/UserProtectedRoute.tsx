import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserAuthContext } from '../../contexts/UserAuthContext';

interface UserProtectedRouteProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({
  children,
  requiresOnboarding = false,
}) => {
  const { isAuthenticated, isLoading, user, onboardingStatus, whatsappExpired } = useUserAuthContext();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-tf-yellow-accent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  // Check if onboarding is required for this route
  if (requiresOnboarding && user && !user.onboarding_completed) {
    // Redirect to onboarding if not complete
    return <Navigate to="/portal/onboarding" replace />;
  }

  // If WhatsApp verification has expired for an active user,
  // redirect to the re-verification page (unless already there)
  if (
    requiresOnboarding &&
    whatsappExpired &&
    location.pathname !== '/portal/verify-whatsapp'
  ) {
    return <Navigate to="/portal/verify-whatsapp" replace />;
  }

  // If we're on the onboarding page and onboarding is complete, redirect to dashboard
  // (but not if WhatsApp is expired — they need to re-verify first)
  if (
    location.pathname === '/portal/onboarding' &&
    user?.onboarding_completed &&
    onboardingStatus?.isComplete &&
    !whatsappExpired
  ) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
