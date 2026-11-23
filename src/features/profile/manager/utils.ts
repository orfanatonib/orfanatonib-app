import { getBirthdayStatus, getDaysUntilBirthday } from '../utils';
import type { CompleteProfileListItem } from '../types';
import { BIRTHDAY_WEEK_DAYS, NO_BIRTHDAY_SORT_DAYS } from './constants';

export interface BirthdayGroups {
  today: CompleteProfileListItem[];
  week: CompleteProfileListItem[];
  month: CompleteProfileListItem[];
}

/** Agrupa aniversariantes; semana e mês ficam ordenados pelo mais próximo. */
export function groupBirthdays(profiles: CompleteProfileListItem[]): BirthdayGroups {
  const groups: BirthdayGroups = { today: [], week: [], month: [] };
  for (const profile of profiles) {
    const status = getBirthdayStatus(profile.personalData?.birthDate);
    if (status === 'today') groups.today.push(profile);
    else if (status === 'this-week') groups.week.push(profile);
    else if (status === 'this-month') groups.month.push(profile);
  }
  const days = (p: CompleteProfileListItem) => getDaysUntilBirthday(p.personalData?.birthDate) ?? NO_BIRTHDAY_SORT_DAYS;
  const byProximity = (a: CompleteProfileListItem, b: CompleteProfileListItem) => days(a) - days(b);
  groups.week.sort(byProximity);
  groups.month.sort(byProximity);
  return groups;
}

export const hasBirthdays = (groups: BirthdayGroups): boolean =>
  groups.today.length > 0 || groups.week.length > 0 || groups.month.length > 0;

/**
 * Meses (1 a 12) em que o painel de aniversários procura: o atual e, quando faltam menos de
 * 7 dias para o fim dele, também o seguinte (a "semana" atravessa a virada do mês).
 */
export function birthdayMonths(today: Date): number[] {
  const month = today.getMonth() + 1;
  const daysInMonth = new Date(today.getFullYear(), month, 0).getDate();
  const crossesMonth = daysInMonth - today.getDate() < BIRTHDAY_WEEK_DAYS;
  return crossesMonth ? [month, (month % 12) + 1] : [month];
}

/** Junta listas de perfis sem repetir a mesma pessoa. */
export function mergeById(lists: CompleteProfileListItem[][]): CompleteProfileListItem[] {
  const seen = new Map<string, CompleteProfileListItem>();
  for (const profile of lists.flat()) seen.set(String(profile.id), profile);
  return [...seen.values()];
}
