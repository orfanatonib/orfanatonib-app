export const fmtDate = (date?: string | Date, tz = "America/Manaus") => {
  if (!date) return "—";
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString("pt-BR", { timeZone: tz });
};

/** Só a parte da data: "2026-09-01" ou "2026-09-01T12:00:00Z". */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Dia puro do banco no formato brasileiro.
 *
 * A data chega como "2026-09-01". `new Date` a lê como meia-noite **UTC** e
 * `toLocaleDateString` a exibe no fuso local — em Manaus (UTC-4) isso mostrava
 * o dia anterior: toda visita aparecia um dia antes. Aqui a data é montada a
 * partir das próprias partes, sem passar pelo UTC.
 *
 * Um horário completo continua sendo convertido pelo fuso, que é o correto
 * para um instante.
 */
export const formatDayBR = (
  iso?: string | null,
  fallback = 'Data a definir',
): string => {
  if (!iso) return fallback;

  const parts = DATE_ONLY.exec(iso);
  if (parts) {
    const [, year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(iso);
  // `toLocaleDateString` de uma data inválida devolve "Invalid Date" em vez de
  // lançar: sem esta checagem, o usuário vê isso na tela.
  return Number.isNaN(parsed.getTime())
    ? 'Data inválida'
    : parsed.toLocaleDateString('pt-BR');
};
