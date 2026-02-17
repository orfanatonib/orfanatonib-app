import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

interface RequireAdminProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RequireAdmin({ children, redirectTo = "/adm" }: RequireAdminProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
