import type React from 'react';
import { FeatureFlagKeys } from '@/features/feature-flags/types';
import { MEMBER_SUBPAGE_PATHS } from '../../constants/navigation';
import {
  MenuBook as MenuBookIcon,
  PhotoCamera as PhotoCameraIcon,
  StarRate as StarRateIcon,
  Favorite as FavoriteIcon,
  LibraryBooks as LibraryBooksIcon,
  Celebration as CelebrationIcon,
  Schedule as ScheduleIcon,
  PeopleAlt as PeopleAltIcon,
  HelpOutline as HelpOutlineIcon,
  EventAvailable as EventAvailableIcon,
  Badge as BadgeIcon,
  ChildCare as ShelteredCareIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';

export type MUIButtonColor =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning'
  | 'inherit';

export type IconType = React.ElementType;

export interface MemberActionConfig {
  to: string;
  /** Flag que precisa estar ligada para o atalho aparecer. */
  featureKey?: FeatureFlagKeys;
  /** Página dinâmica: só aparece se a rota existir (a flag do tipo de página liga a rota). */
  dynamicRoute?: boolean;
  label: string;
  icon: IconType;
  color: MUIButtonColor;
}

export const memberActionMap: Record<string, MemberActionConfig> = {
  materials: {
    featureKey: FeatureFlagKeys.VISIT_MATERIALS,
    to: MEMBER_SUBPAGE_PATHS.materials,
    label: 'Materiais de visita',
    icon: MenuBookIcon,
    color: 'primary',
  },
  photos: {
    featureKey: FeatureFlagKeys.SHELTER_PHOTO_UPLOAD,
    to: MEMBER_SUBPAGE_PATHS.photos,
    label: 'Envie fotos do seu Abrigo',
    icon: PhotoCameraIcon,
    color: 'success',
  },
  rate: {
    featureKey: FeatureFlagKeys.SITE_FEEDBACK,
    to: MEMBER_SUBPAGE_PATHS.rate,
    label: 'Avalie nosso Site',
    icon: StarRateIcon,
    color: 'success',
  },
  love: {
    dynamicRoute: true,
    to: '/amor',
    label: 'Espalhe Amor',
    icon: FavoriteIcon,
    color: 'error',
  },
  teaching: {
    dynamicRoute: true,
    to: '/ensino',
    label: 'Plano de Aula',
    icon: LibraryBooksIcon,
    color: 'info',
  },
  fun: {
    dynamicRoute: true,
    to: '/diversao',
    label: 'Diversão Garantida',
    icon: CelebrationIcon,
    color: 'warning',
  },
  schedule: {
    dynamicRoute: true,
    to: '/horarios',
    label: 'Horários',
    icon: ScheduleIcon,
    color: 'secondary',
  },
  team: {
    dynamicRoute: true,
    to: '/equipe',
    label: 'Equipe',
    icon: PeopleAltIcon,
    color: 'primary',
  },
  help: {
    featureKey: FeatureFlagKeys.CONTACT_FORM,
    to: '/contato',
    label: 'Precisa de Ajuda?',
    icon: HelpOutlineIcon,
    color: 'error',
  },
  events: {
    featureKey: FeatureFlagKeys.EVENTS_SECTION,
    to: '/eventos',
    label: 'Eventos do Mês',
    icon: EventAvailableIcon,
    color: 'info',
  },
  memberArea: {
    to: '/area-do-membro',
    featureKey: FeatureFlagKeys.MEMBER_AREA,
    label: 'Área do Membro',
    icon: BadgeIcon,
    color: 'primary',
  },
  shelteredrenArea: {
    to: '/area-dos-acolhidos',
    featureKey: FeatureFlagKeys.SHELTERED_AREA,
    label: 'Área dos Acolhidos',
    icon: ShelteredCareIcon,
    color: 'primary',
  },
  integrations: {
    featureKey: FeatureFlagKeys.INTEGRATION,
    to: MEMBER_SUBPAGE_PATHS.integrations,
    label: 'Integrações FM',
    icon: GroupsIcon,
    color: 'secondary',
  },
  training: {
    featureKey: FeatureFlagKeys.MEMBER_MANUAL,
    to: MEMBER_SUBPAGE_PATHS.manual,
    label: 'Manual do Membro',
    icon: MenuBookIcon,
    color: 'warning',
  },
};
