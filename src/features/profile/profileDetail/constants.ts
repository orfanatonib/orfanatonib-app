import type { PreferenceGridKey } from './types';

export const COPIED_FEEDBACK_MS = 2000;
export const WHATSAPP_BASE_URL = 'https://wa.me/55';
export const CONFETTI_COUNT = 12;
export const CONFETTI_COLORS = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB'] as const;

export const PREFERENCE_GRID: ReadonlyArray<{ key: PreferenceGridKey; color: string; fullWidth: boolean }> = [
  { key: 'loveLanguages', color: '#f6416c', fullWidth: false },
  { key: 'temperaments', color: '#9c27b0', fullWidth: false },
  { key: 'favoriteFood', color: '#ff9800', fullWidth: false },
  { key: 'favoriteColor', color: '#2196f3', fullWidth: false },
  { key: 'favoriteMusic', color: '#e91e63', fullWidth: true },
];

export const PROFILE_DETAIL_TEXTS = {
  birthdayToday: '🎉 Aniversário!',
  whatsapp: 'WhatsApp',
  copied: 'Copiado!',
  copyPhone: 'Copiar telefone',
  sendEmail: 'Enviar email',
  copyEmail: 'Copiar email',
  copyGaContact: 'Copiar contato do líder',
  getToKnow: 'Conheça melhor',
  smile: 'O que me faz sorrir',
  talents: 'Talentos',
  viewPhoto: 'Ver foto',
  close: 'Fechar',
  zoomAlt: 'Foto de perfil ampliada',
} as const;

export const CONTACT_BUTTON_SX = {
  bgcolor: 'rgba(0,0,0,0.06)',
  width: 44,
  height: 44,
  '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
} as const;
