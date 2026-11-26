import { UPLOAD_MESSAGES, UPLOAD_POLICIES } from './mediaUpload.constants';
import type { UploadFileLike, UploadKind, UploadValidation } from './mediaUpload.types';

/** `1,5 MB`, `320 KB`, `12 B` (vírgula decimal, como o restante da tela). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${(Math.round(mb * 10) / 10).toString().replace('.', ',')} MB`;
}

/** Extensões legíveis (`JPG, PNG…`) a partir dos MIME aceitos. */
export function acceptedFormatsLabel(kind: UploadKind): string {
  const subtypes = UPLOAD_POLICIES[kind].mimeTypes.map((mime) => {
    const subtype = mime.split('/')[1] ?? mime;
    if (subtype === 'jpeg') return 'JPG';
    if (subtype === 'quicktime') return 'MOV';
    if (subtype === 'mpeg') return 'MP3';
    if (subtype.includes('wordprocessingml')) return 'DOCX';
    if (subtype.includes('presentationml')) return 'PPTX';
    if (subtype.includes('spreadsheetml')) return 'XLSX';
    if (subtype === 'msword') return 'DOC';
    if (subtype === 'vnd.ms-powerpoint') return 'PPT';
    if (subtype === 'vnd.ms-excel') return 'XLS';
    return subtype.toUpperCase();
  });
  return [...new Set(subtypes)].join(', ');
}

/** Valor do atributo `accept` do `<input type="file">`. */
export function acceptAttribute(kind: UploadKind): string {
  return UPLOAD_POLICIES[kind].mimeTypes.join(',');
}

/** Confere tipo e tamanho ANTES do envio; a API repete a checagem (e confere a assinatura dos bytes). */
export function validateUploadFile(file: UploadFileLike, kind: UploadKind): UploadValidation {
  const policy = UPLOAD_POLICIES[kind];
  if (file.size <= 0) {
    return { ok: false, reason: 'empty', message: UPLOAD_MESSAGES.empty };
  }
  if (!policy.mimeTypes.includes(file.type)) {
    return {
      ok: false,
      reason: 'type',
      message: UPLOAD_MESSAGES.type(policy.label, acceptedFormatsLabel(kind)),
    };
  }
  if (file.size > policy.maxBytes) {
    return {
      ok: false,
      reason: 'size',
      message: UPLOAD_MESSAGES.size(policy.label, formatFileSize(policy.maxBytes), formatFileSize(file.size)),
    };
  }
  return { ok: true };
}

/** Percentual 0–100 do envio; sem `total` (tamanho desconhecido) não há como calcular, devolve 0. */
export function uploadProgressPercent(loaded: number, total?: number): number {
  if (!total || total <= 0 || !Number.isFinite(loaded) || loaded <= 0) return 0;
  return Math.min(100, Math.round((loaded / total) * 100));
}
