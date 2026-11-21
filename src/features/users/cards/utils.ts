import { UserRole } from "@/store/slices/auth/authSlice";
import { DEFAULT_ROLE_LABEL, DEFAULT_SORT_FIELD, ROLE_LABELS } from "./constants";

export type RoleChipColor = "primary" | "success" | "default";
export type CardSort = { field: string; desc: boolean };

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

/** Ordenação atual do cartão; sem ordenação definida usa `updatedAt` decrescente. */
export function resolveCardSort(sorting?: ReadonlyArray<{ id?: unknown; desc?: boolean }>): CardSort {
  const current = sorting?.[0];
  return { field: String(current?.id ?? DEFAULT_SORT_FIELD), desc: current ? !!current.desc : true };
}

export function toggleInSet(previous: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(previous);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
