import type { MediaType } from '@/store/slices/types';
import type {
  ActiveLightboxState,
  FeedMonthGroup,
  FeedMediaViewModel,
  FeedPhotoWallItem,
  FeedSectionViewModel,
  FeedViewMode,
} from './types';

export interface FeedHeroBannerProps {
  title: string;
  description: string;
  totalSections: number;
  canUploadPhotos: boolean;
  canManageFeed: boolean;
  isRefreshing: boolean;
  onNavigateHome: () => void;
  onNavigateUpload: () => void;
  onNavigateManage: () => void;
  onRefresh: () => void;
}

export interface FeedHighlightsCarouselProps {
  sections: FeedSectionViewModel[];
  viewedStoryIds: ReadonlySet<string>;
  /** Data de referência do "mês corrente" (injetável para testes). */
  referenceDate?: Date;
  onSelectStory: (section: FeedSectionViewModel) => void;
}

export interface FeedControlBarProps {
  viewMode: FeedViewMode;
  searchQuery: string;
  visibleCount: number;
  loadedCount: number;
  totalPhotosCount: number;
  onViewModeChange: (mode: FeedViewMode) => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export interface FeedTimelineRailProps {
  groups: FeedMonthGroup[];
  activeSectionId: string | null;
  canUploadPhotos: boolean;
  onJumpToSection: (section: FeedSectionViewModel) => void;
  onNavigateUpload: () => void;
  onScrollTop: () => void;
}

export interface AdaptiveMediaCollageProps {
  sectionId: string;
  caption: string;
  mediaItems: FeedMediaViewModel[];
  onSelectMedia: (mediaIndex: number) => void;
}

export interface FeedMediaFrameProps {
  src: string;
  mediaType?: MediaType;
  alt: string;
  ariaLabel: string;
  testId: string;
  ambientBackdrop?: boolean;
  aspectRatio?: string;
  minHeight?: number | Record<string, number>;
  maxHeight?: number | Record<string, number>;
  badgeText?: string;
  moreCountOverlay?: number;
  onClick: () => void;
}

export interface FeedVideoPlayerProps {
  src: string;
  title: string;
}

export interface FeedPostCardProps {
  section: FeedSectionViewModel;
  isCopied: boolean;
  onShare: (section: FeedSectionViewModel, mediaIndex?: number) => void;
  onOpenLightbox: (section: FeedSectionViewModel, mediaIndex: number) => void;
}

export interface FeedBentoMuralProps {
  groups: FeedMonthGroup[];
  onOpenLightbox: (section: FeedSectionViewModel, mediaIndex: number) => void;
}

export interface FeedPhotoWallProps {
  photos: FeedPhotoWallItem[];
  onSelectPhoto: (photo: FeedPhotoWallItem) => void;
}

export interface FeedLightboxDialogProps {
  activeState: ActiveLightboxState | null;
  isCopied: boolean;
  onShare: (section: FeedSectionViewModel, mediaIndex: number) => void;
  onClose: () => void;
}

export interface FeedErrorStateProps {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
  onNavigateHome: () => void;
}

export interface FeedEmptyStateProps {
  canUploadPhotos: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateUpload: () => void;
}

export interface FeedFilterEmptyStateProps {
  onClear: () => void;
}

export interface FeedPaginationFooterProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  nextPageErrorMessage: string | null;
  showEnd: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  onLoadMore: () => void;
}

export interface ShelterFeedViewProps {
  feed?: boolean;
}
