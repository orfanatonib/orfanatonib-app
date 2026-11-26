import { useSelector } from 'react-redux';
import { Badge } from '@mui/material';
import type { RootState } from '@/store/slices';
import {
  IMAGE_SECTIONS_PENDING_BADGE_ARIA,
  IMAGE_SECTIONS_PENDING_BADGE_MAX,
  IMAGE_SECTION_TEST_IDS,
} from '../constants';
import { usePendingImageSectionsCount } from '../hooks';
import type { ImageSectionsPendingBadgeProps } from '../types';
import { clampBadgeCount } from '../utils';

/**
 * Envolve o ícone do item de menu/cartão "Fotos dos Abrigos" com o total de publicações
 * aguardando revisão. Só é montado para o item que o admin com a flag já enxerga.
 */
export function ImageSectionsPendingBadge({ children }: ImageSectionsPendingBadgeProps) {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const { data } = usePendingImageSectionsCount(userId, Boolean(userId));
  const pending = data?.pending ?? 0;
  return (
    <Badge
      color="error"
      max={IMAGE_SECTIONS_PENDING_BADGE_MAX}
      badgeContent={pending}
      invisible={pending === 0}
      slotProps={{
        badge: {
          'data-testid': IMAGE_SECTION_TEST_IDS.PENDING_BADGE,
          'data-count': String(pending),
          'aria-label': `${clampBadgeCount(pending, IMAGE_SECTIONS_PENDING_BADGE_MAX)} ${IMAGE_SECTIONS_PENDING_BADGE_ARIA}`,
        } as Record<string, string>,
      }}
    >
      {children}
    </Badge>
  );
}
