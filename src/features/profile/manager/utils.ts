import { getBirthdayStatus, getDaysUntilBirthday } from '../utils';
import type { CompleteProfileListItem, QueryProfilesDto } from '../types';
import { NO_BIRTHDAY_SORT_DAYS } from './constants';

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

export function parseSortValue(value: string): Pick<QueryProfilesDto, 'sortBy' | 'order'> {
  const [sortBy, order] = value.split('-') as [QueryProfilesDto['sortBy'], QueryProfilesDto['order']];
  return { sortBy, order };
}

export const sortValueOf = (filters: Pick<QueryProfilesDto, 'sortBy' | 'order'>): string => `${filters.sortBy}-${filters.order}`;

export function hasActiveProfileFilters(filters: QueryProfilesDto): boolean {
  return Boolean(filters.q || filters.role || filters.temperaments || filters.loveLanguages || filters.favoriteColor);
}

export function isRoleSelected(filters: QueryProfilesDto, role: string): boolean {
  return role === 'all' ? !filters.role : filters.role === role;
}
