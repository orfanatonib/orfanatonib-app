import { UserRole } from "@/store/slices/auth/authSlice";

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.LEADER]: "Líder",
  [UserRole.MEMBER]: "Membro",
};

export const DEFAULT_ROLE_LABEL = "Usuário";
