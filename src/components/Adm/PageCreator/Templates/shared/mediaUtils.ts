import {
  AUDIO_MIME_PREFIX,
  DOCUMENT_EXTENSIONS,
  IMAGE_MIME_PREFIX,
  MEDIA_ACCEPT_BY_KIND,
  MEDIA_ERROR_MESSAGES,
  VIDEO_MIME_PREFIX,
} from './constants';
import {
  MediaFileErrorCode,
  MediaFileKind,
  MediaFileValidationOptions,
  MediaFileValidationResult,
} from './types';

export function getAcceptAttribute(kind: MediaFileKind): string {
  return MEDIA_ACCEPT_BY_KIND[kind];
}

/** Diz se o arquivo combina com o tipo esperado (mesmo critério do `accept`). */
export function matchesMediaKind(file: Pick<File, 'name' | 'type'>, kind: MediaFileKind): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  switch (kind) {
    case MediaFileKind.IMAGE:
      return type.startsWith(IMAGE_MIME_PREFIX);
    case MediaFileKind.VIDEO:
      return type.startsWith(VIDEO_MIME_PREFIX);
    case MediaFileKind.AUDIO:
      return type.startsWith(AUDIO_MIME_PREFIX);
    case MediaFileKind.DOCUMENT:
      return DOCUMENT_EXTENSIONS.some((extension) => name.endsWith(extension));
    default:
      return false;
  }
}

export function validateMediaFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
  options: MediaFileValidationOptions,
): MediaFileValidationResult {
  if (options.strictType && !matchesMediaKind(file, options.kind)) {
    return {
      valid: false,
      code: MediaFileErrorCode.INVALID_TYPE,
      message: MEDIA_ERROR_MESSAGES.INVALID_TYPE,
    };
  }
  if (options.maxFileSizeBytes !== undefined && file.size > options.maxFileSizeBytes) {
    return {
      valid: false,
      code: MediaFileErrorCode.TOO_LARGE,
      message: MEDIA_ERROR_MESSAGES.TOO_LARGE,
    };
  }
  return { valid: true };
}

/** Separa uma lista de URLs digitadas (vírgula) em itens limpos, na ordem. */
export function splitCommaSeparatedUrls(input: string): string[] {
  return input.split(',').map((url) => url.trim());
}
