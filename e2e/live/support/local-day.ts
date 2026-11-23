/**
 * Dias SEMPRE no fuso local (o do servidor e do banco, Manaus). O backend interpreta `createdFrom`/`createdTo`
 * como o dia local (`createdRange`), e `createdAt` é gravado em hora local: o esperado dos specs usa o mesmo dia.
 */
const pad = (value: number): string => String(value).padStart(2, "0");

/** `AAAA-MM-DD` do dia local de `date`. */
export const localDay = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Dia local de hoje deslocado em `days` dias (meio-dia local: imune a virada de horário de verão). */
export const localShift = (days = 0): string => {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return localDay(base);
};

/** `AAAA-MM-DD` deslocado em `days` dias, sem passar por UTC. */
export const localAddDays = (iso: string, days: number): string => {
  const [year, month, day] = iso.split("-").map(Number);
  return localDay(new Date(year, month - 1, day + days, 12, 0, 0, 0));
};
