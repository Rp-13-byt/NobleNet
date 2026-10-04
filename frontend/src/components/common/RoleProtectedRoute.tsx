import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, Role } from '@/store/authStore';

interface RoleProtectedRouteProps {
  children?: ReactNode;
  allowedRoles: Role[];
  roleRedirects?: Partial<Record<Role, string>>;
}

export function RoleProtectedRoute({ children, allowedRoles, roleRedirects }: RoleProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Restoring session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (roleRedirects && roleRedirects[user.role]) {
      return <Navigate to={roleRedirects[user.role]!} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : null;
}
