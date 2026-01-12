export enum MediaType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  IMAGE = 'image',
  AUDIO = 'audio',
}

export enum MediaUploadType {
  LINK = 'link',
  UPLOAD = 'upload',
}

export enum MediaPlatform {
  YOUTUBE = 'youtube',
  GOOGLE_DRIVE = 'googledrive',
  ONEDRIVE = 'onedrive',
  DROPBOX = 'dropbox',
  ANY = 'ANY',
}

export enum MediaTargetType {
  VisitMaterialsPage = 'VisitMaterialsPage',
  VideosPage = 'VideosPage',
  ImagesPage = 'ImagesPage',
  Meditation = 'Meditation',
  IdeasSection = 'IdeasSection',
  IdeasPage = 'IdeasPage',
  Document = 'Document',
  Event = 'Event',
  Informative = 'Informative',
  ShelterPage = 'shelterPage'
}

export interface MediaItem {
  id?: string;
  file?: File;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  isLocalFile?: boolean;
  originalName?: string;
  title: string;
  description: string;
  mediaType: MediaType;
  uploadType: MediaUploadType;
  platformType?: MediaPlatform;
  url: string;
  fieldKey?: string;
  fileField?: string;
}

export enum FeedbackCategory {
  CONTENT = 'content',
  APPEARANCE = 'appearance',
  USABILITY = 'usability',
  BROKEN_FEATURE = 'broken_feature',
  MISSING_FEATURE = 'missing_feature',
  PERFORMANCE = 'performance',
  MOBILE_EXPERIENCE = 'mobile_experience',
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint',
  OTHER = 'other',
}

export const FeedbackCategoryLabels: Record<FeedbackCategory, string> = {
  [FeedbackCategory.CONTENT]: 'Conteúdo do site (textos, informações, erros)',
  [FeedbackCategory.APPEARANCE]: 'Aparência e organização do site',
  [FeedbackCategory.USABILITY]: 'Facilidade de uso / navegação',
  [FeedbackCategory.BROKEN_FEATURE]: 'Algo não está funcionando como deveria',
  [FeedbackCategory.MISSING_FEATURE]: 'Falta alguma funcionalidade importante',
  [FeedbackCategory.PERFORMANCE]: 'Velocidade ou desempenho do site',
  [FeedbackCategory.MOBILE_EXPERIENCE]: 'Problemas no celular ou tablet',
  [FeedbackCategory.SUGGESTION]: 'Sugestão de melhoria ou ideia',
  [FeedbackCategory.COMPLAINT]: 'Reclamação ou insatisfação',
  [FeedbackCategory.OTHER]: 'Outro tipo de feedback',
};

export type Address = {
  id?: string;
  street: string;
  number?: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  complement?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Shelter = {
  id: string;
  name: string;
  address: Address;
  teamsQuantity?: number; // Quantidade de equipes
  teams?: Array<{
    id: string;
    numberTeam: number; // ⭐ Número da equipe (1, 2, 3, 4...) - tipo NUMBER
    leaders?: LeaderProfile[];
    members?: MemberProfile[];
  }>;
  leaders?: LeaderProfile[]; // Calculado (agregação de todas as teams)
  members?: MemberProfile[]; // Calculado (agregação de todas as teams)
  createdAt: string;
  updatedAt: string;
};

export type LeaderProfile = {
  id: string;
  user: { id: string; name?: string; email?: string };
  team?: {
    id: string;
    name: string;
    shelter?: Shelter;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberProfile = {
  id: string;
  user: { id: string; name?: string; email?: string };
  team?: {
    id: string;
    name: string;
    shelter?: { id: string; name: string } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

