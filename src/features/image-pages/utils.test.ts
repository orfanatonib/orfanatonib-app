import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard, formatDateTime, selectThumbnails, truncate } from './utils';

describe('truncate', () => {
  it('mantém textos curtos e corta os longos com reticências', () => {
    expect(truncate('abc', 5)).toBe('abc');
    expect(truncate('abcdef', 3)).toBe('abc...');
    expect(truncate(undefined)).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formata data por extenso e hora com zero à esquerda', () => {
    expect(formatDateTime(new Date(2026, 10, 20, 9, 5))).toEqual({
      date: '20 de Novembro de 2026',
      time: '09:05',
    });
  });

  it('aceita texto ISO', () => {
    const out = formatDateTime(new Date(2026, 0, 3, 14, 30).toISOString());
    expect(out).toEqual({ date: '3 de Janeiro de 2026', time: '14:30' });
  });
});

describe('selectThumbnails', () => {
  const items = Array.from({ length: 10 }, (_, i) => i);

  it('mostra as 6 seguintes à foto de destaque', () => {
    expect(selectThumbnails(items, false)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('expandido mostra todas depois da primeira', () => {
    expect(selectThumbnails(items, true)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('com 1 item não há miniaturas', () => {
    expect(selectThumbnails([0], false)).toEqual([]);
    expect(selectThumbnails([], true)).toEqual([]);
  });
});

describe('copyToClipboard', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('usa a API de área de transferência quando disponível', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyToClipboard('x')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('x');
  });

  it('sem permissão cai no execCommand e devolve o resultado dele', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: typeof exec }).execCommand = exec;
    await expect(copyToClipboard('x')).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
