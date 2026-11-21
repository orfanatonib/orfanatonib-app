import { describe, expect, it } from 'vitest';
import { buildConfetti, buildMailtoUrl, buildWhatsAppUrl, hasAnyPreference } from './utils';

describe('utils do detalhe do perfil', () => {
  it('hasAnyPreference: vazio/nulo é falso; qualquer campo preenchido é verdadeiro', () => {
    expect(hasAnyPreference(null)).toBe(false);
    expect(hasAnyPreference(undefined)).toBe(false);
    expect(hasAnyPreference({})).toBe(false);
    expect(hasAnyPreference({ favoriteFood: '' })).toBe(false);
    expect(hasAnyPreference({ skillsAndTalents: 'violão' })).toBe(true);
  });

  it('links de contato', () => {
    expect(buildWhatsAppUrl('(11) 99999-0000')).toBe('https://wa.me/5511999990000');
    expect(buildMailtoUrl('a@x.test')).toBe('mailto:a@x.test');
  });

  it('confete determinístico com random injetado', () => {
    const pieces = buildConfetti(() => 0.5);
    expect(pieces).toHaveLength(12);
    expect(pieces[0]).toMatchObject({ left: '50%', rotate: 180, duration: 3.25, delay: 0.75, round: false, color: '#00CED1' });
  });
});
