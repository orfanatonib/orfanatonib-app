import { useMemo, useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import type { MediaItem } from 'store/slices/types';
import { getMediaPreviewUrl } from 'utils/getMediaPreviewUrl';
import { selectThumbnails } from '@/features/image-pages/utils';

export function useSectionGallery(mediaItems: MediaItem[] | undefined) {
  const [openModal, setOpenModal] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const items = useMemo(() => mediaItems ?? [], [mediaItems]);
  const thumbnails = useMemo(
    () => selectThumbnails(items, showAll),
    [items, showAll],
  );
  const heroSrc = items.length > 0 ? getMediaPreviewUrl(items[0]) : null;

  const open = (index: number) => {
    setStartIndex(index);
    setOpenModal(true);
  };

  return {
    items,
    thumbnails,
    heroSrc,
    isMobile,
    openModal,
    startIndex,
    showAll,
    hoveredImage,
    setHoveredImage,
    setShowAll: () => setShowAll(true),
    open,
    close: () => setOpenModal(false),
  };
}
