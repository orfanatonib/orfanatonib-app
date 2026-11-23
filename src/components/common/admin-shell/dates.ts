const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;
const EMPTY_DATE = '—';

/** `AAAA-MM-DD` (ou ISO) vira `DD/MM/AAAA` sem passar por fuso (o dia gravado é o dia exibido). */
export function formatDateOnly(value?: string | Date | null): string {
  if (!value) return EMPTY_DATE;
  if (typeof value === 'string') {
    const match = DATE_ONLY.exec(value);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_DATE : date.toLocaleDateString('pt-BR');
}

/** Instante ISO (ex.: `createdAt`) no horário local, em `DD/MM/AAAA`. */
export function formatCreatedDate(value?: string | Date | null): string {
  if (!value) return EMPTY_DATE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_DATE : date.toLocaleDateString('pt-BR');
}
