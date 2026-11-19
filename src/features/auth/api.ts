import api from "@/config/axiosConfig";
import type {
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ValidateTokenResponse,
} from "@/types/api/auth";
import type { LoginResponse } from "@/store/slices/auth/authSlice";

import type {
  GoogleLoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  ShelterTeamOption,
  VerifyEmailResponse,
} from "./types";

/**
 * Chamadas de autenticação das páginas públicas (login, cadastro, recuperação de
 * senha, confirmação de e-mail). As páginas não falam com o Axios direto.
 */
export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function apiGoogleLogin(
  credential: string,
): Promise<GoogleLoginResponse> {
  const { data } = await api.post<GoogleLoginResponse>("/auth/google", {
    token: credential,
  });
  return data;
}

/** `commonUser` = cadastro comum; senão é o complemento do cadastro iniciado pelo Google. */
export async function apiRegister(
  commonUser: boolean,
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const endpoint = commonUser ? "/auth/register" : "/auth/complete-register";
  const { data } = await api.post<RegisterResponse>(endpoint, payload);
  return data;
}

export async function apiForgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    { email },
  );
  return data;
}

/** O token vai em `params` (codificado), nunca concatenado na URL. */
export async function apiValidateResetToken(
  token: string,
): Promise<ValidateTokenResponse> {
  const { data } = await api.get<ValidateTokenResponse>(
    "/auth/reset-password/validate",
    { params: { token } },
  );
  return data;
}

export async function apiResetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>(
    "/auth/reset-password",
    { token, newPassword },
  );
  return data;
}

export async function apiVerifyEmail(
  token: string,
): Promise<VerifyEmailResponse> {
  const { data } = await api.post<VerifyEmailResponse>("/auth/verify-email", {
    token,
  });
  return data;
}

export async function apiResendVerification(
  email: string,
): Promise<ResendVerificationResponse> {
  const { data } = await api.post<ResendVerificationResponse>(
    "/auth/resend-verification",
    { email },
  );
  return data;
}

export async function apiListShelterTeams(): Promise<ShelterTeamOption[]> {
  const { data } = await api.get<ShelterTeamOption[]>("/shelters/list-teams", {
    params: {},
  });
  return data ?? [];
}
