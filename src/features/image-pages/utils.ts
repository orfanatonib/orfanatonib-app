import { INITIAL_THUMBNAILS } from './constants';

export const truncate = (text: string = '', max = 100) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface FormattedDateTime {
  date: string;
  time: string;
}

export const formatDateTime = (value: string | Date): FormattedDateTime => {
  const date = new Date(value);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return {
    date: `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`,
    time: `${hours}:${minutes}`,
  };
};

/** Miniaturas abaixo da foto de destaque: as 6 primeiras depois dela, ou todas quando expandido. */
export const selectThumbnails = <T>(
  items: readonly T[],
  showAll: boolean,
): T[] => (showAll ? items.slice(1) : items.slice(1, 1 + INITIAL_THUMBNAILS));
