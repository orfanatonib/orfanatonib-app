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
  numberTeam: number; // ⭐ Número da equipe (1, 2, 3, 4...) - tipo NUMBER
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
    isLeader?: boolean; // Para /my-shelters - indica se o líder logado está nesta equipe
    leaders?: MinimalUser[];
    members?: MinimalMember[];
  }[];
  members?: MinimalMember[]; // Membros gerais do abrigo
};

export type LeaderShelterAssociation = {
  id: string;
  name: string;
  teams: {
    id: string;
    numberTeam: number;
    description: string | null;
  }[];
  members?: MinimalMember[]; // Membros do abrigo
};

export type LeaderProfile = {
  id: string;
  active: boolean;
  user: MinimalUser;
  shelters: LeaderShelterAssociation[]; // Múltiplos abrigos com suas equipes
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

  leaderSearchString?: string;  // Busca por nome, email ou telefone do líder
  shelterSearchString?: string; // Busca por nome ou endereço do abrigo

  hasShelter?: boolean;         // true: só líderes com abrigo, false: só sem abrigo
  teamId?: string;             // Filtrar por ID específico da equipe
  teamName?: string;           // Filtrar por número da equipe
  hasTeam?: boolean;           // true: só líderes com equipe, false: só sem equipe

  searchString?: string;
  q?: string;
  active?: boolean;
  hasShelters?: boolean;
  shelterName?: string;
};


/**
 * Tipo simplificado para listagem de líderes
 * Usado no endpoint GET /leader-profiles/simple
 * Conforme documentação: LeaderSimpleListDto
 */
export type LeaderSimpleListDto = {
  leaderProfileId: string;
  user: {
    id: string;
    name: string;
  };
  vinculado: boolean;
  shelters: LeaderShelterAssociation[]; // Adicionado conforme documentação
};

/**
 * Payload para edição de associações de líder
 * PUT /leader-profiles/:leaderId
 */
export type LeaderAssociationUpdateDto = {
  shelterId: string;
  teams: number[]; // Array de números de equipes
}[];

/**
 * Resposta do endpoint /my-shelters para líderes logados
 */
export type MySheltersResponse = ShelterWithTeamsAndMembers[];

/**
 * Resposta simplificada de abrigos para dropdowns
 */
export type ShelterSimpleResponse = {
  id: string;
  name: string;
  teams: {
    id: string;
    numberTeam: number;
    description: string | null;
  }[];
};

/**
 * Resposta completa do endpoint /teams
 */
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
