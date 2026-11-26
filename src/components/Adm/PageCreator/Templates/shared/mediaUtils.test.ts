import { describe, expect, it } from 'vitest';
import { BYTES_PER_MB } from './constants';
import {
  getAcceptAttribute,
  matchesMediaKind,
  splitCommaSeparatedUrls,
  validateMediaFile,
} from './mediaUtils';
import { MediaFileErrorCode, MediaFileKind } from './types';

const file = (name: string, type: string, size = 10) => ({ name, type, size });

describe('mediaUtils', () => {
  it('devolve o accept de cada tipo igual ao dos criadores', () => {
    expect(getAcceptAttribute(MediaFileKind.IMAGE)).toBe('image/*');
    expect(getAcceptAttribute(MediaFileKind.VIDEO)).toBe('video/*');
    expect(getAcceptAttribute(MediaFileKind.AUDIO)).toBe('audio/mp3');
    expect(getAcceptAttribute(MediaFileKind.DOCUMENT)).toBe('.pdf,.doc,.docx');
  });

  it('reconhece o tipo pelo mime ou pela extensão', () => {
    expect(matchesMediaKind(file('a.png', 'image/png'), MediaFileKind.IMAGE)).toBe(true);
    expect(matchesMediaKind(file('a.mp4', 'video/mp4'), MediaFileKind.VIDEO)).toBe(true);
    expect(matchesMediaKind(file('a.mp3', 'audio/mpeg'), MediaFileKind.AUDIO)).toBe(true);
    expect(matchesMediaKind(file('A.PDF', ''), MediaFileKind.DOCUMENT)).toBe(true);
    expect(matchesMediaKind(file('a.exe', 'application/x-msdownload'), MediaFileKind.DOCUMENT)).toBe(false);
    expect(matchesMediaKind(file('a.png', 'image/png'), MediaFileKind.VIDEO)).toBe(false);
  });

  it('não valida nada além do que foi pedido', () => {
    expect(validateMediaFile(file('a.exe', 'x', 999 * BYTES_PER_MB), { kind: MediaFileKind.IMAGE })).toEqual({
      valid: true,
    });
  });

  it('recusa tipo errado só no modo estrito', () => {
    const result = validateMediaFile(file('a.pdf', 'application/pdf'), {
      kind: MediaFileKind.IMAGE,
      strictType: true,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe(MediaFileErrorCode.INVALID_TYPE);
  });

  it('recusa arquivo acima do limite e aceita o exato', () => {
    const opts = { kind: MediaFileKind.VIDEO, maxFileSizeBytes: 5 * BYTES_PER_MB };
    expect(validateMediaFile(file('a.mp4', 'video/mp4', 5 * BYTES_PER_MB), opts).valid).toBe(true);
    const big = validateMediaFile(file('a.mp4', 'video/mp4', 5 * BYTES_PER_MB + 1), opts);
    expect(big.code).toBe(MediaFileErrorCode.TOO_LARGE);
  });

  it('separa URLs por vírgula preservando a ordem', () => {
    expect(splitCommaSeparatedUrls(' https://a.com/1 , https://b.com/2')).toEqual([
      'https://a.com/1',
      'https://b.com/2',
    ]);
  });
});
