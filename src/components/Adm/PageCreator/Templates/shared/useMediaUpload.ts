import { useCallback, useEffect, useRef, useState } from 'react';
import { getAcceptAttribute, validateMediaFile } from './mediaUtils';
import type { MediaSelection, UseMediaUploadOptions, UseMediaUploadResult } from './types';

/**
 * Seleção, validação, pré-visualização e remoção de arquivos de mídia.
 * Cria as URLs de pré-visualização e as libera na remoção e ao desmontar.
 */
export function useMediaUpload(options: UseMediaUploadOptions): UseMediaUploadResult {
  const { kind, multiple = false, maxFileSizeBytes, strictType } = options;
  const [selections, setSelections] = useState<MediaSelection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const created = useRef<Set<string>>(new Set());

  const revoke = useCallback((url: string) => {
    if (created.current.delete(url)) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    const urls = created.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const selectFiles = useCallback(
    (files: FileList | File[] | null | undefined): MediaSelection[] => {
      const incoming = Array.from(files ?? []);
      const accepted: MediaSelection[] = [];
      let firstError: string | null = null;

      for (const file of incoming) {
        const result = validateMediaFile(file, { kind, maxFileSizeBytes, strictType });
        if (!result.valid) {
          firstError = firstError ?? result.message ?? null;
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        created.current.add(previewUrl);
        accepted.push({ file, previewUrl });
      }

      setError(firstError);
      if (accepted.length === 0) return accepted;

      const next = multiple ? accepted : accepted.slice(0, 1);
      setSelections((prev) => {
        if (!multiple) prev.forEach((item) => revoke(item.previewUrl));
        return multiple ? [...prev, ...next] : next;
      });
      return next;
    },
    [kind, maxFileSizeBytes, multiple, revoke, strictType],
  );

  const removeAt = useCallback(
    (index: number) => {
      setSelections((prev) => {
        const removed = prev[index];
        if (removed) revoke(removed.previewUrl);
        return prev.filter((_, i) => i !== index);
      });
    },
    [revoke],
  );

  const clear = useCallback(() => {
    setSelections((prev) => {
      prev.forEach((item) => revoke(item.previewUrl));
      return [];
    });
    setError(null);
  }, [revoke]);

  return { selections, error, accept: getAcceptAttribute(kind), selectFiles, removeAt, clear };
}
