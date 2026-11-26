import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateAge,
  formatBirthDate,
  formatBirthDateShort,
  getBirthdayStatus,
  getDaysUntilBirthday,
  getGenderStyle,
  genderConfig,
} from './utils';

describe('utils do perfil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)); // 15/06/2026
  });
  afterEach(() => vi.useRealTimers());

  describe('getBirthdayStatus', () => {
    it('sem data: nulo', () => expect(getBirthdayStatus(undefined)).toBeNull());
    it('mesmo dia e mês: hoje', () => expect(getBirthdayStatus('2010-06-15')).toBe('today'));
    it('até 7 dias à frente: esta semana', () => expect(getBirthdayStatus('2010-06-20')).toBe('this-week'));
    it('mais adiante no mesmo mês: este mês', () => expect(getBirthdayStatus('2010-06-28')).toBe('this-month'));
    it('outro mês: nulo', () => expect(getBirthdayStatus('2010-09-01')).toBeNull());
    it('já passou neste mês: nulo (próximo ano)', () => expect(getBirthdayStatus('2010-06-01')).toBeNull());
  });

  describe('getDaysUntilBirthday', () => {
    it('sem data: nulo', () => expect(getDaysUntilBirthday('')).toBeNull());
    it('conta os dias até o próximo aniversário', () => expect(getDaysUntilBirthday('2000-06-20')).toBe(5));
    it('já passou: vira o ano seguinte', () => expect(getDaysUntilBirthday('2000-06-01')).toBe(351));
  });

  describe('formatação', () => {
    it('data longa', () => expect(formatBirthDate('2000-03-07')).toBe('7 de Março'));
    it('data curta', () => expect(formatBirthDateShort('2000-12-25')).toBe('25 Dez'));
    it('vazio devolve vazio', () => {
      expect(formatBirthDate(undefined)).toBe('');
      expect(formatBirthDateShort(undefined)).toBe('');
    });
  });

  describe('calculateAge', () => {
    it('sem data: nulo', () => expect(calculateAge(undefined)).toBeNull());
    it('já fez aniversário no ano', () => expect(calculateAge('2000-01-10')).toBe(26));
    it('ainda não fez aniversário no ano', () => expect(calculateAge('2000-12-10')).toBe(25));
    it('faz aniversário hoje: conta o ano', () => expect(calculateAge('2000-06-15')).toBe(26));
  });

  describe('getGenderStyle', () => {
    it('Masculino e Feminino têm estilo próprio', () => {
      expect(getGenderStyle('Masculino')).toBe(genderConfig.Masculino);
      expect(getGenderStyle('Feminino')).toBe(genderConfig.Feminino);
    });
    it('qualquer outro valor cai no neutro', () => {
      expect(getGenderStyle(undefined)).toBe(genderConfig.neutral);
      expect(getGenderStyle('outro')).toBe(genderConfig.neutral);
    });
  });
});
