import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FEED_HIGHLIGHTS_INTERVAL_MS, FEED_HIGHLIGHTS_MIN_LOOP_ITEMS, FEED_HIGHLIGHTS_TOUCH_RESUME_MS } from './constants';
import { buildLoopItems, rotateLoop, stepLoopOffset } from './feedHighlights.utils';
import type { FeedSectionViewModel } from './types';

type PauseReason = 'hover' | 'focus' | 'touch';

/**
 * Estado do carrossel de destaques: deslocamento circular, avanço automático a
 * cada 5 s e pausa por mouse, foco ou toque. Sem avanço automático quando o
 * usuário prefere movimento reduzido (só os botões).
 */
export function useHighlightsCarousel(sections: FeedSectionViewModel[], reducedMotion: boolean) {
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [announcement, setAnnouncement] = useState('');
  const [pauses, setPauses] = useState<ReadonlySet<PauseReason>>(() => new Set());
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loop = useMemo(() => buildLoopItems(sections, FEED_HIGHLIGHTS_MIN_LOOP_ITEMS), [sections]);
  const rotated = useMemo(() => rotateLoop(loop, offset), [loop, offset]);
  const total = sections.length;
  const activeIndex = loop.length === 0 ? 0 : offset % total;
  const isPaused = pauses.size > 0;
  const canRotate = loop.length > 1;

  useEffect(() => setOffset(0), [sections.length]);
  useEffect(() => () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  }, []);

  useEffect(() => {
    if (!canRotate || reducedMotion || isPaused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setOffset((current) => stepLoopOffset(current, loop.length, 1));
    }, FEED_HIGHLIGHTS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [canRotate, reducedMotion, isPaused, loop.length]);

  const setPause = useCallback((reason: PauseReason, active: boolean) => {
    setPauses((prev) => {
      if (prev.has(reason) === active) return prev;
      const next = new Set(prev);
      if (active) next.add(reason);
      else next.delete(reason);
      return next;
    });
  }, []);

  const announce = useCallback(
    (nextOffset: number) => {
      const section = loop[nextOffset]?.section;
      if (section) setAnnouncement(`Destaque ${(nextOffset % total) + 1} de ${total}: ${section.caption}`);
    },
    [loop, total],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const next = stepLoopOffset(offset, loop.length, dir);
      setDirection(dir);
      setOffset(next);
      announce(next);
    },
    [offset, loop.length, announce],
  );

  const goToItem = useCallback(
    (itemIndex: number) => {
      setDirection(1);
      setOffset(itemIndex);
      announce(itemIndex);
    },
    [announce],
  );

  const onTouchStart = useCallback(() => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    setPause('touch', true);
  }, [setPause]);

  const onTouchEnd = useCallback(() => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => setPause('touch', false), FEED_HIGHLIGHTS_TOUCH_RESUME_MS);
  }, [setPause]);

  return {
    rotated,
    total,
    activeIndex,
    direction,
    announcement,
    isPaused,
    canRotate,
    offset,
    next: () => step(1),
    prev: () => step(-1),
    goToItem,
    setPause,
    onTouchStart,
    onTouchEnd,
  };
}
