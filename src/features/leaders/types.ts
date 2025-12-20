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

export type MinimalTeacher = {
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

export type ShelterWithTeachers = ShelterSimple & {
  teachers?: MinimalTeacher[];
};

export type TeamSimple = {
  id: string;
  numberTeam: number; // ⭐ Número da equipe (1, 2, 3, 4...) - tipo NUMBER
  description?: string | null;
  shelterId: string;
  shelter?: ShelterWithTeachers;
  createdAt: string;
  updatedAt: string;
};

// Tipo conforme documentação: LeaderResponseDto
export type LeaderProfile = {
  id: string;
  active: boolean;
  user: MinimalUser;
  shelter?: {
    id: string;
    name: string;
    team?: {
      id: string;
      numberTeam: number;
      description: string | null;
    };
    teachers?: {           // Professores da equipe
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
    }[];
  } | null;
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
  leaderSearchString?: string;
  shelterSearchString?: string;
  hasShelter?: boolean;
  teamId?: string;
  teamName?: string;
  hasTeam?: boolean;
  // Filtros legados (compatibilidade)
  searchString?: string;
  q?: string;
  active?: boolean;
  hasShelters?: boolean;
  shelterName?: string;
  page?: number;
  limit?: number;
  sort?: "updatedAt" | "createdAt" | "name";
  order?: "asc" | "desc";
};

/**
 * Tipo simplificado para listagem de líderes
 * Usado no endpoint GET /leader-profiles/simple
 * Conforme documentação: LeaderSimpleListDto
 */
export type LeaderSimpleListDto = {
  leaderProfileId: string;  // UUID do perfil do líder
  name: string;              // Nome do usuário (ou email se não tiver nome, ou "—" se não tiver nenhum)
  vinculado: boolean;        // Se está vinculado a uma equipe/abrigo
};

// Mantido para compatibilidade (deprecated)
export type LeaderSimpleApi = LeaderSimpleListDto;
