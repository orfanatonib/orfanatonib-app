/** Só a parte da data: "2026-09-01" (dia puro do banco) ou "2026-09-01T12:00:00Z". */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Lê uma data. O dia puro ("2026-09-01") é montado a partir das próprias
 * partes, no fuso local: `new Date("2026-09-01")` o lê como meia-noite UTC e,
 * em Manaus (UTC-4), mostrava o dia anterior. Um instante completo continua
 * sendo convertido pelo fuso, que é o correto para um instante.
 */
export const parseDate = (value: string): Date => {
  const parts = DATE_ONLY.exec(value);
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  return new Date(value);
};

export const formatDate = (date?: string | null, includeTime: boolean = false) => {
  if (!date) return "—";
  const parsed = parseDate(date);
  return includeTime
    ? parsed.toLocaleString("pt-BR")
    : parsed.toLocaleDateString("pt-BR");
};

export const fmtDateOnly = (d?: string | null) => formatDate(d, false);
export const fmtDT = (s?: string) => formatDate(s, true);

export const gLabel = (g?: "M" | "F" | "masculino" | "feminino") => {
  if (g === "M" || g === "masculino") return "Masculino";
  if (g === "F" || g === "feminino") return "Feminino";
  return "—";
};

export const fmtBR = (d: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "";

export function summaryLabel(from?: string, to?: string) {
  const f = from || "";
  const t = to || "";
  if (!f && !t) return "";
  if (f && t && f === t) return fmtBR(f);
  if (f && t) return `${fmtBR(f)} — ${fmtBR(t)}`;
  if (f && !t) return `${fmtBR(f)} — `;
  // Sobrou só `to` (os casos sem nenhum, iguais, ambos e só `from` já retornaram).
  return `— ${fmtBR(t)}`;
}

const WEEKDAY_PT: Record<string, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira", 
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo"
};

export const weekdayLabel = (weekday?: string | null): string => {
  if (!weekday) return "—";
  return WEEKDAY_PT[weekday] || weekday;
};

export const ageFrom = (birth?: string | null) => {
  if (!birth) return null;
  const b = parseDate(birth);
  if (isNaN(+b)) return null;
  const now = new Date();
  let y = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  const d = now.getDate() - b.getDate();
  if (m < 0 || (m === 0 && d < 0)) y--;
  return y < 0 ? null : y;
};

function calculateTimeDifference(date?: string | null) {
  if (!date) return null;
  const d = parseDate(date);
  if (isNaN(+d)) return null;
  
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years < 0) return null;
  
  return { years, months };
}

export const timeDifference = (date?: string | null) => {
  const diff = calculateTimeDifference(date);
  if (!diff) return null;
  
  const { years, months } = diff;
  
  if (years === 0 && months === 0) return "menos de 1 mês";
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
};

export const ageDetailed = timeDifference;
export const tenureFrom = timeDifference;

export { maskDateBR } from "./masks";

export const isValidBRDate = (brDate: string): boolean => {
  
  if (!brDate || brDate.length !== 10) return false;

  if (brDate[2] !== '/' || brDate[5] !== '/') return false;

  const parts = brDate.split('/');
  if (parts.length !== 3) return false;

  // Com `/` nas posições 2 e 5 e 10 caracteres, dia e mês têm 2 dígitos e o ano 4.
  const [dayStr, monthStr, yearStr] = parts;

  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

export const isoToBR = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const brToISO = (brDate: string): string => {
  if (!brDate) return '';

  if (!isValidBRDate(brDate)) {
    throw new Error('Data brasileira inválida para conversão');
  }

  const [day, month, year] = brDate.split('/');
  
  const dayPadded = day.padStart(2, '0');
  const monthPadded = month.padStart(2, '0');
  return `${year}-${monthPadded}-${dayPadded}`;
};

export const fmtDate = (date?: string | Date, tz = "America/Manaus") => {
  if (!date) return "—";
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString("pt-BR", { timeZone: tz });
};

/** Só a parte da data: "2026-09-01" ou "2026-09-01T12:00:00Z". */
const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

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

  const parts = DATE_PREFIX.exec(iso);
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
