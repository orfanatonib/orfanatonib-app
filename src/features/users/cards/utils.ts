import { UserRole } from "@/store/slices/auth/authSlice";
import { DEFAULT_ROLE_LABEL, ROLE_LABELS } from "./constants";

export type RoleChipColor = "primary" | "success" | "default";

export const initials = (name?: string): string =>
  (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "U";

export function roleChipColor(role?: string): RoleChipColor {
  switch (role) {
    case UserRole.LEADER:
      return "primary";
    case UserRole.MEMBER:
      return "success";
    default:
      return "default";
  }
}

export function roleAvatarColor(role?: string): string {
  const color = roleChipColor(role);
  if (color === "primary") return "primary.main";
  if (color === "success") return "success.main";
  return "grey.500";
}

export const roleLabel = (role?: string): string => ROLE_LABELS[role as UserRole] || DEFAULT_ROLE_LABEL;

export const yesNo = (value: boolean): string => (value ? "Sim" : "Não");
