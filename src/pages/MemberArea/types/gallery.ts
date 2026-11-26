export interface MemberGalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

export interface MemberGalleryGridProps {
  items: readonly MemberGalleryItem[];
  /** Prefixo kebab-case dos `data-testid` (ex.: `member-ideas`). */
  testIdPrefix: string;
  searchLabel: string;
  emptyMessage: string;
  accentColor: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}
