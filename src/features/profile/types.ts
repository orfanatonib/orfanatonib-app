import { UserRole } from "@/store/slices/auth/authSlice";

export type ProfileImage = {
  id: string;
  title: string;
  description: string;
  url: string;
  uploadType: string;
  mediaType: string;
  isLocalFile: boolean;
  platformType: string | null;
  originalName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  active: boolean;
  completed: boolean;
  commonUser: boolean;
  createdAt: string;
  updatedAt: string;
  image: ProfileImage | null;
  memberProfile?: {
    id: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    team?: {
      id: string;
      numberTeam: number;
      description: string | null;
      createdAt: string;
      updatedAt: string;
      shelter?: {
        id: string;
        name: string;
        description: string;
        teamsQuantity: number;
        createdAt: string;
        updatedAt: string;
        address?: {
          id: string;
          street: string;
          number: string;
          district: string;
          city: string;
          state: string;
          postalCode: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    };
  } | null;
  leaderProfile?: any | null;
};

export type UpdateProfileDto = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ChangePasswordDto = {
  currentPassword?: string;
  newPassword: string;
};

export type UpdateProfileImageDto = {
  uploadType: 'UPLOAD' | 'LINK';
  url?: string;
  title?: string;
  description?: string;
  isLocalFile?: boolean;
};

// ============================================
// Complete Profile Types (PersonalData + UserPreferences)
// ============================================

/**
 * Dados pessoais do usuário
 */
export type PersonalData = {
  birthDate?: string;        // Formato: "YYYY-MM-DD"
  gender?: string;           // Gênero (opcional)
  gaLeaderName?: string;     // Nome do líder de GA
  gaLeaderContact?: string;  // Contato do líder de GA
};

/**
 * Preferências do usuário
 */
export type UserPreferences = {
  loveLanguages?: string;      // Linguagens do amor (ex: "Atos de serviço, presente")
  temperaments?: string;       // Temperamentos (ex: "Melancólica Sanguínea")
  favoriteColor?: string;      // Cor favorita
  favoriteFood?: string;       // Comida favorita
  favoriteMusic?: string;      // Música favorita
  whatMakesYouSmile?: string;  // O que te faz sorrir
  skillsAndTalents?: string;   // Habilidades e talentos
};

/**
 * Perfil completo retornado pela API /profiles/me
 */
export type CompleteProfile = {
  id: string;                    // UUID do usuário
  email: string;
  phone: string;
  name: string;
  role?: string;                 // Role do usuário (admin, member, leader)
  personalData?: PersonalData;
  preferences?: UserPreferences;
};

/**
 * Item de perfil na listagem GET /profiles
 */
export type CompleteProfileListItem = CompleteProfile & {
  role: string;                  // Role é obrigatório na listagem
};

/**
 * DTO para criar/atualizar dados pessoais
 */
export type CreatePersonalDataDto = {
  birthDate?: string;        // Formato: "YYYY-MM-DD"
  gender?: string;           // Gênero
  gaLeaderName?: string;
  gaLeaderContact?: string;
};

export type UpdatePersonalDataDto = CreatePersonalDataDto;

/**
 * DTO para criar/atualizar preferências
 */
export type CreateUserPreferencesDto = {
  loveLanguages?: string;
  temperaments?: string;
  favoriteColor?: string;
  favoriteFood?: string;
  favoriteMusic?: string;
  whatMakesYouSmile?: string;
  skillsAndTalents?: string;
};

export type UpdateUserPreferencesDto = CreateUserPreferencesDto;

/**
 * DTO para criar perfil completo (POST /profiles)
 */
export type CreateCompleteProfileDto = {
  personalData?: CreatePersonalDataDto;
  preferences?: CreateUserPreferencesDto;
};

/**
 * DTO para atualizar perfil completo (PUT /profiles/me)
 */
export type UpdateCompleteProfileDto = {
  personalData?: UpdatePersonalDataDto;
  preferences?: UpdateUserPreferencesDto;
};

// ============================================
// Pagination & Filtering Types
// ============================================

/**
 * Query parameters para listagem de perfis com paginação e filtros
 * GET /profiles
 */
export type QueryProfilesDto = {
  // Paginação
  page?: number;                 // Número da página (padrão: 1, mínimo: 1)
  limit?: number;                // Itens por página (padrão: 10, mínimo: 1)
  
  // Filtros de busca
  q?: string;                    // Busca geral em nome e email
  name?: string;                 // Filtro por nome (parcial, case-insensitive)
  email?: string;                // Filtro por email (parcial, case-insensitive)
  role?: string;                 // Filtro por role (admin, member, leader)
  
  // Filtros de preferências
  loveLanguages?: string;        // Filtro por linguagens do amor (parcial)
  temperaments?: string;         // Filtro por temperamento (parcial)
  favoriteColor?: string;        // Filtro por cor favorita (parcial)
  
  // Ordenação
  sortBy?: 'name' | 'email' | 'createdAt' | 'birthDate';  // Campo para ordenação (padrão: 'name')
  order?: 'ASC' | 'DESC';        // Ordem (padrão: 'ASC')
};

/**
 * Metadados de paginação
 */
export type PaginationMeta = {
  currentPage: number;           // Página atual
  itemsPerPage: number;          // Itens por página
  totalItems: number;            // Total de itens (considerando filtros)
  totalPages: number;            // Total de páginas
  hasNextPage: boolean;          // Tem próxima página?
  hasPreviousPage: boolean;      // Tem página anterior?
};

/**
 * Resposta paginada de perfis
 * GET /profiles
 */
export type PaginatedProfilesResponse = {
  items: CompleteProfileListItem[];  // Array de perfis
  meta: PaginationMeta;              // Metadados de paginação
};
