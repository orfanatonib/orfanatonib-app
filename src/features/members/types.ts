export const TZ = "America/Manaus";

export type MinimalUser = { id: string; name?: string; email?: string; phone?: string };

export type ShelterSimple = {
  id: string;
  name: string;
  address?: {
    id: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    complement?: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type TeamSimple = {
  id: string;
  numberTeam: number;
  description?: string | null;
  shelterId: string;
  shelter?: ShelterSimple;
  createdAt: string;
  updatedAt: string;
};

export type MemberProfile = {
  id: string;
  active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    completed: boolean;
    commonUser: boolean;
    imageProfile?: {
      id: string;
      url: string;
      title: string;
      description?: string;
      uploadType: string;
      mediaType: string;
      isLocalFile: boolean;
    };
  };
  shelter?: {
    id: string;
    name: string;
    team?: {
      id: string;
      numberTeam: number;
      description: string | null;
    };
    leader?: {
      id: string;
      active: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        active: boolean;
        completed: boolean;
        commonUser: boolean;
      };
    } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type MemberQuery = {
  memberSearchString?: string;
  shelterSearchString?: string;
  hasShelter?: boolean;
  teamId?: string;
  teamName?: string;
  hasTeam?: boolean;
  page?: number;
  limit?: number;
  sort?: "updatedAt" | "createdAt" | "name";
  order?: "asc" | "desc";
};

export type MemberSimpleListDto = {
  memberProfileId: string;
  name: string;
  vinculado: boolean;
};
