export const TZ = "America/Manaus";

export type MinimalUser = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  completed?: boolean;
  commonUser?: boolean;
};

export type MinimalMember = {
  id: string;
  active?: boolean;
  user?: MinimalUser;
};

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

export type ShelterWithMembers = ShelterSimple & {
  members?: MinimalMember[];
};

export type TeamSimple = {
  id: string;
  numberTeam: number; 
  description?: string | null;
  shelterId: string;
  shelter?: ShelterWithMembers;
  createdAt: string;
  updatedAt: string;
};

export type TeamSimple = {
  id: string;
  numberTeam: number;
  description?: string | null;
  shelterId: string;
  shelter?: ShelterWithMembers;
  createdAt: string;
  updatedAt: string;
};

export type ShelterWithTeamsAndMembers = ShelterSimple & {
  teams: {
    id: string;
    numberTeam: number;
    description: string | null;
    isLeader?: boolean; 
    leaders?: MinimalUser[];
    members?: MinimalMember[];
  }[];
  members?: MinimalMember[]; 
};

export type LeaderShelterAssociation = {
  id: string;
  name: string;
  teams: {
    id: string;
    numberTeam: number;
    description: string | null;
  }[];
  members?: MinimalMember[]; 
};

export type LeaderProfile = {
  id: string;
  active: boolean;
  user: MinimalUser;
  shelters: LeaderShelterAssociation[]; 
  createdAt: string;
  updatedAt: string;
};

export type PageDto<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export type LeaderFilters = {
  page?: number;
  limit?: number;
  sort?: "name" | "updatedAt" | "createdAt";
  order?: "asc" | "desc";

  leaderSearchString?: string;  
  shelterSearchString?: string; 

  hasShelter?: boolean;         
  teamId?: string;             
  teamName?: string;           
  hasTeam?: boolean;           

  searchString?: string;
  q?: string;
  active?: boolean;
  hasShelters?: boolean;
  shelterName?: string;
};

export type LeaderSimpleListDto = {
  leaderProfileId: string;
  user: {
    id: string;
    name: string;
  };
  vinculado: boolean;
  shelters: LeaderShelterAssociation[]; 
};

export type LeaderAssociationUpdateDto = {
  shelterId: string;
  teams: number[]; 
}[];

export type MySheltersResponse = ShelterWithTeamsAndMembers[];

export type ShelterSimpleResponse = {
  id: string;
  name: string;
  teams: {
    id: string;
    numberTeam: number;
    description: string | null;
  }[];
};

export type TeamsCompleteResponse = {
  id: string;
  numberTeam: number;
  description: string | null;
  shelterId: string;
  leaders: MinimalUser[];
  members: MinimalMember[];
  createdAt: string;
  updatedAt: string;
}[];

export type LeaderSimpleApi = LeaderSimpleListDto;
