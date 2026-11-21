import { CONFETTI_COLORS, CONFETTI_COUNT, WHATSAPP_BASE_URL } from './constants';
import type { ProfileDetailPreferences } from './types';

export interface ConfettiPiece {
  left: string;
  rotate: number;
  duration: number;
  delay: number;
  round: boolean;
  color: string;
}

export function hasAnyPreference(preferences?: ProfileDetailPreferences | null): boolean {
  if (!preferences) return false;
  return Boolean(
    preferences.loveLanguages ||
      preferences.temperaments ||
      preferences.favoriteColor ||
      preferences.favoriteFood ||
      preferences.favoriteMusic ||
      preferences.whatMakesYouSmile ||
      preferences.skillsAndTalents,
  );
}

export function buildWhatsAppUrl(phone: string): string {
  return `${WHATSAPP_BASE_URL}${phone.replace(/\D/g, '')}`;
}

export function buildMailtoUrl(email: string): string {
  return `mailto:${email}`;
}

/** Peças do confete do aniversário; `random` injetável para teste determinístico. */
export function buildConfetti(random: () => number = Math.random): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    left: `${random() * 100}%`,
    rotate: random() * 360,
    duration: 2.5 + random() * 1.5,
    delay: random() * 1.5,
    round: random() > 0.5,
    color: CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)],
  }));
}
