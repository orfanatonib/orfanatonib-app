import { describe, expect, it } from 'vitest';

import { UPLOAD_POLICIES } from './mediaUpload.constants';
import {
  acceptAttribute,
  acceptedFormatsLabel,
  formatFileSize,
  uploadProgressPercent,
  validateUploadFile,
} from './mediaUpload.utils';

const MB = 1024 * 1024;

describe('validateUploadFile', () => {
  it('[media-upload.front.validate#feliz] aceita imagem permitida dentro do limite', () => {
    expect(validateUploadFile({ name: 'a.png', type: 'image/png', size: 2 * MB }, 'image')).toEqual({ ok: true });
  });

  it('[media-upload.front.validate#tamanho-no-limite] aceita exatamente o limite e recusa 1 byte acima', () => {
    const max = UPLOAD_POLICIES.image.maxBytes;
    expect(validateUploadFile({ name: 'a.jpg', type: 'image/jpeg', size: max }, 'image').ok).toBe(true);
    const over = validateUploadFile({ name: 'a.jpg', type: 'image/jpeg', size: max + 1 }, 'image');
    expect(over).toMatchObject({ ok: false, reason: 'size' });
    expect(over.ok === false && over.message).toContain('10 MB');
  });

  it('[media-upload.front.validate#tipo-invalido] recusa PDF e SVG como imagem, citando os formatos aceitos', () => {
    const pdf = validateUploadFile({ name: 'a.pdf', type: 'application/pdf', size: 10 }, 'image');
    expect(pdf).toMatchObject({ ok: false, reason: 'type' });
    expect(pdf.ok === false && pdf.message).toContain('JPG, PNG, WEBP, GIF');
    expect(validateUploadFile({ name: 'a.svg', type: 'image/svg+xml', size: 10 }, 'image')).toMatchObject({
      ok: false,
      reason: 'type',
    });
  });

  it('[media-upload.front.validate#vazio] recusa arquivo de 0 byte antes do tipo', () => {
    expect(validateUploadFile({ name: 'a.png', type: 'image/png', size: 0 }, 'image')).toMatchObject({
      ok: false,
      reason: 'empty',
    });
  });

  it.each([
    ['video', 'video/mp4'],
    ['document', 'application/pdf'],
    ['audio', 'audio/mpeg'],
  ] as const)('[media-upload.front.validate#categorias] %s aceita %s', (kind, type) => {
    expect(validateUploadFile({ name: 'x', type, size: 1024 }, kind).ok).toBe(true);
  });
});

describe('formatFileSize / accept / progresso', () => {
  it('formata bytes, KB e MB com vírgula', () => {
    expect(formatFileSize(12)).toBe('12 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1.5 * MB)).toBe('1,5 MB');
    expect(formatFileSize(10 * MB)).toBe('10 MB');
    expect(formatFileSize(-1)).toBe('0 B');
    expect(formatFileSize(Number.NaN)).toBe('0 B');
  });

  it('accept do input lista só os MIME da política; rótulo é legível', () => {
    expect(acceptAttribute('image')).toBe('image/jpeg,image/png,image/webp,image/gif');
    expect(acceptedFormatsLabel('document')).toBe('PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX');
    expect(acceptedFormatsLabel('video')).toBe('MP4, WEBM, MOV');
  });

  it('[media-upload.front.progress#percentual] calcula 0–100, limita em 100 e trata total desconhecido', () => {
    expect(uploadProgressPercent(0, 100)).toBe(0);
    expect(uploadProgressPercent(50, 200)).toBe(25);
    expect(uploadProgressPercent(300, 200)).toBe(100);
    expect(uploadProgressPercent(10, undefined)).toBe(0);
    expect(uploadProgressPercent(10, 0)).toBe(0);
    expect(uploadProgressPercent(Number.NaN, 10)).toBe(0);
  });
});
