import { describe, expect, it } from 'vitest';
import {
  applyOptimisticToggle,
  formatAuthorLabel,
  formatCelebrationCount,
  formatCommentCount,
  resolveFeedPageId,
  validateCommentDraft,
} from './utils';

describe('applyOptimisticToggle', () => {
  it('celebra: liga e soma 1', () => {
    expect(applyOptimisticToggle({ sectionId: 's', count: 2, celebratedByMe: false })).toEqual({
      sectionId: 's',
      count: 3,
      celebratedByMe: true,
    });
  });

  it('descelebra: desliga e subtrai 1, sem ficar negativo', () => {
    expect(applyOptimisticToggle({ sectionId: 's', count: 1, celebratedByMe: true }).count).toBe(0);
    expect(applyOptimisticToggle({ sectionId: 's', count: 0, celebratedByMe: true }).count).toBe(0);
  });

  it('aplicar duas vezes volta ao estado original', () => {
    const initial = { sectionId: 's', count: 4, celebratedByMe: false };
    expect(applyOptimisticToggle(applyOptimisticToggle(initial))).toEqual(initial);
  });
});

describe('rótulos', () => {
  it('autor: nome público ou rótulo neutro', () => {
    expect(formatAuthorLabel({ displayName: 'Maria L.' })).toBe('Por Maria L.');
    expect(formatAuthorLabel(null)).toBe('Autor não informado');
    expect(formatAuthorLabel(undefined)).toBe('Autor não informado');
  });

  it('plural de celebrações e comentários', () => {
    expect(formatCelebrationCount(1)).toBe('1 celebração');
    expect(formatCelebrationCount(0)).toBe('0 celebrações');
    expect(formatCommentCount(1)).toBe('1 comentário');
    expect(formatCommentCount(5)).toBe('5 comentários');
  });
});

describe('validateCommentDraft', () => {
  it('vazio e só espaços', () => {
    expect(validateCommentDraft('   ')).toBe('empty');
  });

  it('limite de 500 caracteres', () => {
    expect(validateCommentDraft('a'.repeat(500))).toBeNull();
    expect(validateCommentDraft('a'.repeat(501))).toBe('too-long');
  });

  it.each(['ligue 11 99999-1234', 'a@b.com', 'https://x.com', 'www.x.com'])(
    'dado pessoal: %s',
    (text) => {
      expect(validateCommentDraft(text)).toBe('sensitive');
    },
  );

  it('texto comum passa', () => {
    expect(validateCommentDraft('Que lindo! Foram 12 crianças.')).toBeNull();
  });
});

describe('resolveFeedPageId', () => {
  const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

  it('o parâmetro ?galeria= (UUID) vence a configuração', () => {
    expect(resolveFeedPageId(UUID, 'config-id')).toBe(UUID);
  });

  it('sem parâmetro ou com valor inválido, usa a configuração', () => {
    expect(resolveFeedPageId(null, 'config-id')).toBe('config-id');
    expect(resolveFeedPageId('../../etc', 'config-id')).toBe('config-id');
    expect(resolveFeedPageId(null, undefined)).toBeUndefined();
  });
});
