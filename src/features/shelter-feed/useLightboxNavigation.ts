import { useCallback, useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { FEED_LIGHTBOX_SWIPE_THRESHOLD_PX } from './constants';

import type { ActiveLightboxState } from './types';

/**
 * Navegação do lightbox: índice circular, teclado (setas), deslize por toque e
 * rolagem da miniatura ativa. Não reage a setas dentro de campos de texto.
 */
export function useLightboxNavigation(activeState: ActiveLightboxState | null) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  const open = Boolean(activeState);
  const mediaCount = activeState?.section.mediaItems.length ?? 0;

  useEffect(() => {
    if (!activeState) return;
    const bounded = Math.min(Math.max(activeState.initialIndex, 0), Math.max(activeState.section.mediaItems.length - 1, 0));
    setCurrentIndex(bounded);
    setImageFailed(false);
  }, [activeState]);

  useEffect(() => {
    setImageFailed(false);
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (mediaCount <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  }, [mediaCount]);

  const handleNext = useCallback(() => {
    if (mediaCount <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % mediaCount);
  }, [mediaCount]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, [contenteditable="true"], [role="tablist"], video')
      )
        return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrev, handleNext]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches.length === 1 ? event.touches[0].clientX : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || event.changedTouches.length !== 1) return;
    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < FEED_LIGHTBOX_SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0) handlePrev();
    else handleNext();
  };

  return {
    currentIndex,
    setCurrentIndex,
    imageFailed,
    setImageFailed,
    activeThumbRef,
    handlePrev,
    handleNext,
    handleTouchStart,
    handleTouchEnd,
  };
}
