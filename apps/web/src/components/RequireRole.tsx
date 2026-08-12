import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/api/types";
import { useCurrentUser } from "@/auth/CurrentUserContext";
import { homeRouteForRole } from "@/auth/homeRoute";

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { currentUser, isLoading } = useCurrentUser();

  if (isLoading || !currentUser) return null;
  if (!roles.includes(currentUser.role)) {
    return <Navigate to={homeRouteForRole(currentUser.role)} replace />;
  }
  return <>{children}</>;
}
