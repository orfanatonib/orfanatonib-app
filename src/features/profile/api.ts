import api from "@/config/axiosConfig";
import { 
  Profile, 
  UpdateProfileDto, 
  ChangePasswordDto, 
  UpdateProfileImageDto,
  CompleteProfile,
  CompleteProfileListItem,
  CreateCompleteProfileDto,
  UpdateCompleteProfileDto,
  QueryProfilesDto,
  PaginatedProfilesResponse
} from "./types";

/**
 * Obtém o perfil do usuário autenticado
 */
export async function apiGetProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>("/profile");
  return data;
}

/**
 * Atualiza o perfil do usuário autenticado
 * Campos editáveis: name, email, phone
 */
export async function apiUpdateProfile(payload: UpdateProfileDto): Promise<Profile> {
  const { data } = await api.patch<Profile>("/profile", payload);
  return data;
}

/**
 * Altera a senha do usuário autenticado
 * Requer a senha atual para validação
 */
export async function apiChangePassword(payload: ChangePasswordDto): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>("/profile/password", payload);
  return data;
}

/**
 * Atualiza a imagem de perfil do usuário autenticado
 * Suporta upload de arquivo ou URL externa
 */
export async function apiUpdateProfileImage(
  payload: UpdateProfileImageDto | FormData
): Promise<Profile> {
  const { data } = await api.patch<Profile>("/profile/image", payload, {
    headers: payload instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' }
  });
  return data;
}

// ============================================
// Complete Profile API (PersonalData + UserPreferences)
// ============================================

/**
 * Obtém o perfil completo do usuário autenticado
 * Inclui dados pessoais e preferências
 * GET /profiles/me
 */
export async function apiGetCompleteProfile(): Promise<CompleteProfile> {
  const { data } = await api.get<CompleteProfile>("/profiles/me");
  return data;
}

/**
 * Cria ou atualiza o perfil completo do usuário autenticado
 * POST /profiles
 */
export async function apiCreateCompleteProfile(
  payload: CreateCompleteProfileDto
): Promise<CompleteProfile> {
  const { data } = await api.post<CompleteProfile>("/profiles", payload);
  return data;
}

/**
 * Atualiza o perfil completo do usuário autenticado
 * PUT /profiles/me
 */
export async function apiUpdateCompleteProfile(
  payload: UpdateCompleteProfileDto
): Promise<CompleteProfile> {
  const { data } = await api.put<CompleteProfile>("/profiles/me", payload);
  return data;
}

/**
 * Lista todos os perfis com paginação e filtros (Admin e Leader)
 * - Admin: retorna todos os perfis
 * - Leader: retorna apenas perfis de teachers das suas equipes
 * GET /profiles
 */
export async function apiGetAllProfiles(params?: QueryProfilesDto): Promise<PaginatedProfilesResponse> {
  // Remove parâmetros undefined/null/empty para não poluir a query string
  const cleanParams: Record<string, string | number> = {};
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
  }
  
  const { data } = await api.get<PaginatedProfilesResponse>("/profiles", { params: cleanParams });
  return data;
}

/**
 * Obtém perfil por ID (Admin only)
 * GET /profiles/:id
 */
export async function apiGetProfileById(id: string): Promise<CompleteProfile> {
  const { data } = await api.get<CompleteProfile>(`/profiles/${id}`);
  return data;
}
