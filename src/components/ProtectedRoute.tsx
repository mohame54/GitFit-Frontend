import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { NavBar } from '@/components/NavBar';
import { Spinner } from '@/components/ui/Feedback';

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking session…" />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Outlet />
      <NavBar />
    </div>
  );
}
