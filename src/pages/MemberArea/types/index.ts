export interface BannerSectionProps {
  showWeekBanner: boolean;
  showMeditationBanner: boolean;
}

export interface MemberContentProps {
  userName?: string;
}

export interface SpecialFamilyCalloutProps {
}

export interface IdeasSharingBannerProps {
}

export interface InformativeBannerProps {
}

export interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
}

export interface MemberAreaState {
  loading: boolean;
  showWeek: boolean;
  showMeditation: boolean;
}

export * from './navigation';
export * from './gallery';
