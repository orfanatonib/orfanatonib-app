import { useCallback, useEffect, useRef } from 'react';
import { FEED_SENTINEL_MARGIN } from './constants';

interface UseFeedSentinelOptions {
  enabled: boolean;
  onReach: () => void;
}

/** Ref-callback para o elemento sentinela: chama `onReach` perto do fim da lista (rolagem infinita). */
export function useFeedSentinel({ enabled, onReach }: UseFeedSentinelOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (!node || !enabled) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onReach();
        },
        { rootMargin: FEED_SENTINEL_MARGIN },
      );
      observerRef.current.observe(node);
    },
    [enabled, onReach],
  );
}
