import { UserRole } from "@/store/slices/auth/authSlice";
export const MEMBER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administração",
  [UserRole.LEADER]: "Liderança",
  [UserRole.MEMBER]: "Membro do ministério",
};
export const MEMBER_GUIDE_VISIBLE_CARDS = { mobile: 1, tablet: 2, desktop: 3 };
