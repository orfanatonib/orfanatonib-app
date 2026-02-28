/**
 * Formata o nome com apenas a primeira letra de cada palavra em maiúscula.
 * Evita que o usuário salve o nome todo em CAIXA ALTA.
 */
export function normalizeName(s?: string | null): string {
  if (s == null || typeof s !== "string") return "";
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function normalize(s?: string | null) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function roleChipColor(role?: string) {
  switch (role) {
    case "ADMIN":
      return "secondary";
    case "LEADER":
      return "primary";
    case "MEMBER":
      return "success";
    default:
      return "default";
  }
}

export const anchorProps = (url?: string) =>
  url
    ? ({ component: "a" as const, href: url, target: "_blank", rel: "noopener noreferrer" })
    : ({});

const CORE_KEYS = new Set([
  "id",
  "name",
  "email",
  "phone",
  "role",
]);

const SENSITIVE_KEYS = new Set([
  "password",
  "refreshToken",
  "commonUser",
  "createdAt",
  "updatedAt",
]);

export const isCoreOrSensitive = (k: string) => CORE_KEYS.has(k) || SENSITIVE_KEYS.has(k);
