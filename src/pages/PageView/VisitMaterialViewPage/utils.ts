const BYTES_PER_MB = 1024 * 1024;

/** "1.2 MB" a partir de bytes; `null` quando o tamanho não é informado. */
export const formatMediaSizeMb = (size?: number | null): string | null =>
  size ? `${(size / BYTES_PER_MB).toFixed(1)} MB` : null;
