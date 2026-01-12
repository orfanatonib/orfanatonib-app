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
  sort?: "updatedAt" | "createdAt" | "name"; // Padrão: updatedAt
  order?: "asc" | "desc"; // Padrão: desc
};

/**
 * Tipo simplificado para listagem de membros
 * Usado no endpoint GET /member-profiles/simple
 * Conforme documentação: MemberSimpleListDto
 */
export type MemberSimpleListDto = {
  memberProfileId: string;  // UUID do perfil do membro
  name: string;              // Nome do usuário (ou email se não tiver nome, ou "—" se não tiver nenhum)
  vinculado: boolean;        // Se está vinculado a uma equipe/abrigo
};
