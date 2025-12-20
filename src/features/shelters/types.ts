import { UserRole } from "@/store/slices/auth/authSlice";
import { TeamWithMembersDto } from "../teams/types";

export type UserPublicDto = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  completed: boolean;
  commonUser: boolean;
};

export type LeaderMiniDto = { 
  id: string; 
  active: boolean;
  user: UserPublicDto;
};

export type TeacherMiniDto = { 
  id: string; 
  active: boolean;
  user: UserPublicDto;
};

export type AddressResponseDto = {
  id: string;
  street: string;
  number?: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  complement?: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaItemDto = {
  id: string;
  title: string;
  description?: string;
  mediaType: "image" | "video";
  uploadType: "upload" | "link";
  url: string;
  isLocalFile: boolean;
  platformType?: string | null;
  originalName?: string | null;
  size?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ShelterSimpleResponseDto = {
  id: string;
  name: string;
  description?: string | null;
  teamsQuantity?: number;
  address: AddressResponseDto;
  teams: TeamWithMembersDto[];
  mediaItem?: MediaItemDto | null;
  createdAt: string;
  updatedAt: string;
};

export type ShelterResponseDto = {
  id: string;
  name: string;
  description?: string | null;
  teamsQuantity?: number;
  address: AddressResponseDto;
  teams: TeamWithMembersDto[];
  leaders: LeaderMiniDto[];
  teachers: TeacherMiniDto[];
  mediaItem?: MediaItemDto | null;
  createdAt: string;
  updatedAt: string;
};

export type SimpleShelterResponseDto = {
  id: string,
  detalhe: string,
  leader: boolean
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export type TeamInputDto = {
  numberTeam: number;
  description?: string;
  leaderProfileIds?: string[];
  teacherProfileIds?: string[];
};

export type CreateShelterForm = {
  name: string;
  description?: string;
  teamsQuantity: number;
  teams?: TeamInputDto[];
  address: Partial<AddressResponseDto> & {
    street: string; district: string; city: string; state: string; postalCode: string;
  };
  mediaItem?: {
    title?: string;
    description?: string;
    uploadType: "upload" | "link";
    url?: string;
  };
  file?: File;
};

export type EditShelterForm = Partial<CreateShelterForm> & { id: string };
export type UserLite = { id: string; name?: string; email?: string };

export type ShelterFilters = {
  shelterName?: string;
  staffFilters?: string;
  addressFilter?: string;
  teamId?: string;
  teamName?: string;
  leaderId?: string;
  searchString?: string;
  nameSearchString?: string;
  shelterSearchString?: string;
  userSearchString?: string;
  addressSearchString?: string;
  city?: string;
  state?: string;
  teacherId?: string;
  hasLeaders?: boolean;
  hasTeachers?: boolean;
  leaderIds?: string[];
  teacherIds?: string[];
};

export type ShelterSort =
  | { id: "name" | "createdAt" | "updatedAt" | "city" | "state"; desc: boolean }
  | null;

export type LeaderOption = { leaderProfileId: string; name: string; vinculado: boolean };
export type TeacherOption = { teacherProfileId: string; name: string; vinculado: boolean };

export type ShelterListResponseDto = {
  id: string;
  name: string;
  address: AddressResponseDto;
  leaders: LeaderMiniDto[];
  teachers: TeacherMiniDto[];
  createdAt: string;
  updatedAt: string;
};

export type ShelterTeamsQuantityResponseDto = {
  id: string;
  teamsQuantity: number;
};
