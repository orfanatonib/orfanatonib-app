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
  mediaItem?: MediaItemDto | null;
};

export type LeaderMiniDto = {
  id: string;
  active: boolean;
  user: UserPublicDto;
};

export type MemberMiniDto = {
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
  members: MemberMiniDto[];
  mediaItem?: MediaItemDto | null;
  createdAt: string;
  updatedAt: string;
};

export type SimpleShelterResponseDto = {
  id: string,
  name: string,
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
  memberProfileIds?: string[];
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
  memberId?: string;
  hasLeaders?: boolean;
  hasMembers?: boolean;
  leaderIds?: string[];
  memberIds?: string[];
};

export type ShelterSort =
  | { id: "name" | "createdAt" | "updatedAt" | "city" | "state"; desc: boolean }
  | null;

export type LeaderOption = { leaderProfileId: string; name: string; vinculado: boolean };
export type MemberOption = { memberProfileId: string; name: string; vinculado: boolean };

export type ShelterListResponseDto = {
  id: string;
  name: string;
  address: AddressResponseDto;
  leaders: LeaderMiniDto[];
  members: MemberMiniDto[];
  createdAt: string;
  updatedAt: string;
};

export type ShelterTeamsQuantityResponseDto = {
  id: string;
  teamsQuantity: number;
};

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
