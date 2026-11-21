import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompleteProfileListItem } from '../types';
import { groupBirthdays, hasActiveProfileFilters, hasBirthdays, isRoleSelected, parseSortValue, sortValueOf } from './utils';

const person = (id: string, birthDate?: string) => ({ id, personalData: birthDate ? { birthDate } : undefined }) as unknown as CompleteProfileListItem;

describe('utils do gerenciador de perfis', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('agrupa aniversariantes e ordena semana/mês pelo mais próximo', () => {
    const groups = groupBirthdays([
      person('hoje', '2000-06-15'),
      person('semana-b', '2000-06-21'),
      person('semana-a', '2000-06-18'),
      person('mes-b', '2000-06-30'),
      person('mes-a', '2000-06-25'),
      person('fora', '2000-09-01'),
      person('sem-data'),
    ]);
    expect(groups.today.map((p) => p.id)).toEqual(['hoje']);
    expect(groups.week.map((p) => p.id)).toEqual(['semana-a', 'semana-b']);
    expect(groups.month.map((p) => p.id)).toEqual(['mes-a', 'mes-b']);
    expect(hasBirthdays(groups)).toBe(true);
    expect(hasBirthdays(groupBirthdays([person('fora', '2000-09-01')]))).toBe(false);
  });

  it('ordenação: parse e serialização são inversas', () => {
    expect(parseSortValue('createdAt-DESC')).toEqual({ sortBy: 'createdAt', order: 'DESC' });
    expect(sortValueOf({ sortBy: 'name', order: 'ASC' })).toBe('name-ASC');
  });

  it('detecta filtros ativos (paginação e ordenação não contam)', () => {
    expect(hasActiveProfileFilters({ page: 2, limit: 12, sortBy: 'name', order: 'ASC' })).toBe(false);
    expect(hasActiveProfileFilters({ q: 'a' })).toBe(true);
    expect(hasActiveProfileFilters({ role: 'leader' })).toBe(true);
    expect(hasActiveProfileFilters({ favoriteColor: 'azul' })).toBe(true);
  });

  it('papel selecionado: "all" só sem papel definido', () => {
    expect(isRoleSelected({}, 'all')).toBe(true);
    expect(isRoleSelected({ role: 'leader' }, 'all')).toBe(false);
    expect(isRoleSelected({ role: 'leader' }, 'leader')).toBe(true);
    expect(isRoleSelected({ role: 'leader' }, 'member')).toBe(false);
  });
});
