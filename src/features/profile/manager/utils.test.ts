import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompleteProfileListItem } from '../types';
import { birthdayMonths, groupBirthdays, hasBirthdays, mergeById } from './utils';

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

  it('meses do painel: só o atual, ou também o seguinte na última semana do mês (dezembro volta a janeiro)', () => {
    expect(birthdayMonths(new Date(2026, 5, 15))).toEqual([6]);
    expect(birthdayMonths(new Date(2026, 5, 23))).toEqual([6]);
    expect(birthdayMonths(new Date(2026, 5, 24))).toEqual([6, 7]);
    expect(birthdayMonths(new Date(2026, 11, 30))).toEqual([12, 1]);
    expect(birthdayMonths(new Date(2026, 1, 22))).toEqual([2, 3]);
  });

  it('junta listas sem repetir a mesma pessoa', () => {
    const merged = mergeById([[person('a'), person('b')], [person('b'), person('c')]]);
    expect(merged.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});
