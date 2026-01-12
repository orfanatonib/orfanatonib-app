export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email: unknown): boolean {
  const v = normalizeEmail(email);
  return EMAIL_REGEX.test(v);
}

