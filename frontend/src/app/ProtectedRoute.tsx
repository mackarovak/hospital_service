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
    return <Navigate to={role === "DOCTOR" ? "/doctor" : "/patient"} replace />;
  }

  return children;
}
