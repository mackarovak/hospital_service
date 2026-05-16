import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import type { UserRole } from "../shared/types/auth";

type ProtectedRouteProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role") as UserRole | null;

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-7xl font-bold text-slate-200">403</p>
          <p className="mt-2 text-slate-600">Доступ запрещён</p>
        </div>
      </main>
    );
  }

  return children;
}
