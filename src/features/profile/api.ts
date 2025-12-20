import api from "@/config/axiosConfig";
import { Profile, UpdateProfileDto, ChangePasswordDto, UpdateProfileImageDto } from "./types";

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

