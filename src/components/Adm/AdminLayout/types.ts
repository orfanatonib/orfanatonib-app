import type {
  AdminNavigationFilter,
  AdminNavigationFilterId,
  AdminNavigationItem,
  AdminNavigationSection,
  AdminNavigationSectionId,
} from "../navigation";

/** Estado visual do menu lateral: no celular sempre "expandido"; no desktop pode ser o mini-drawer. */
export interface AdminSidebarLayoutState {
  readonly isMobile: boolean;
  readonly desktopOpen: boolean;
}

export interface AdminSidebarProps extends AdminSidebarLayoutState {
  readonly pathname: string;
  readonly visibleSections: readonly AdminNavigationSection[];
  readonly availableFilters: readonly AdminNavigationFilter[];
  readonly mobileTab: AdminNavigationFilterId;
  readonly expanded: AdminNavigationSectionId | null;
  readonly onChangeMobileTab: (filter: AdminNavigationFilterId) => void;
  readonly onToggleAccordion: (
    panel: AdminNavigationSectionId,
  ) => (event: React.SyntheticEvent, isExpanding: boolean) => void;
  readonly onNavigate: (path: string) => void;
  readonly onToggleDesktop: () => void;
}

export interface AdminSidebarSectionProps extends AdminSidebarLayoutState {
  readonly section: AdminNavigationSection;
  readonly pathname: string;
  readonly expanded: boolean;
  readonly onChange: (
    event: React.SyntheticEvent,
    isExpanding: boolean,
  ) => void;
  readonly onNavigate: (path: string) => void;
}

export interface AdminSidebarItemProps extends AdminSidebarLayoutState {
  readonly item: AdminNavigationItem;
  readonly pathname: string;
  readonly onNavigate: (path: string) => void;
}
