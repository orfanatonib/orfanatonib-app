import type React from 'react';
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
  label: string;
  icon: IconType;
  color: MUIButtonColor;
}

export const memberActionMap: Record<string, MemberActionConfig> = {
  materials: {
    to: MEMBER_SUBPAGE_PATHS.materials,
    label: 'Materiais de visita',
    icon: MenuBookIcon,
    color: 'primary',
  },
  photos: {
    to: MEMBER_SUBPAGE_PATHS.photos,
    label: 'Envie fotos do seu Abrigo',
    icon: PhotoCameraIcon,
    color: 'success',
  },
  rate: {
    to: MEMBER_SUBPAGE_PATHS.rate,
    label: 'Avalie nosso Site',
    icon: StarRateIcon,
    color: 'success',
  },
  love: {
    to: '/amor',
    label: 'Espalhe Amor',
    icon: FavoriteIcon,
    color: 'error',
  },
  teaching: {
    to: '/ensino',
    label: 'Plano de Aula',
    icon: LibraryBooksIcon,
    color: 'info',
  },
  fun: {
    to: '/diversao',
    label: 'Diversão Garantida',
    icon: CelebrationIcon,
    color: 'warning',
  },
  schedule: {
    to: '/horarios',
    label: 'Horários',
    icon: ScheduleIcon,
    color: 'secondary',
  },
  team: {
    to: '/equipe',
    label: 'Equipe',
    icon: PeopleAltIcon,
    color: 'primary',
  },
  help: {
    to: '/contato',
    label: 'Precisa de Ajuda?',
    icon: HelpOutlineIcon,
    color: 'error',
  },
  events: {
    to: '/eventos',
    label: 'Eventos do Mês',
    icon: EventAvailableIcon,
    color: 'info',
  },
  memberArea: {
    to: '/area-do-membro',
    label: 'Área do Membro',
    icon: BadgeIcon,
    color: 'primary',
  },
  shelteredrenArea: {
    to: '/area-dos-acolhidos',
    label: 'Área dos Acolhidos',
    icon: ShelteredCareIcon,
    color: 'primary',
  },
  integrations: {
    to: MEMBER_SUBPAGE_PATHS.integrations,
    label: 'Integrações FM',
    icon: GroupsIcon,
    color: 'secondary',
  },
  training: {
    to: MEMBER_SUBPAGE_PATHS.manual,
    label: 'Manual do Membro',
    icon: MenuBookIcon,
    color: 'warning',
  },
};
