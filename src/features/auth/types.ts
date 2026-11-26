import type { LoginResponse } from "@/store/slices/auth/authSlice";

/** Resposta de `POST /auth/verify-email`. */
export interface VerifyEmailResponse {
  verified: boolean;
  email: string;
  message: string;
}

/** Resposta de `POST /auth/resend-verification`. */
export interface ResendVerificationResponse {
  verificationEmailSent: boolean;
  message?: string;
}

/** Resposta de `POST /auth/google`: usuário existente (com sessão) ou novo (precisa completar o cadastro). */
export type GoogleLoginResponse = Partial<
  Pick<
    LoginResponse,
    "user" | "accessToken" | "refreshToken" | "emailVerification"
  >
> & {
  active?: boolean;
  newUser?: boolean;
  name?: string;
  email?: string;
  /** Prova de posse da conta Google (≈15 min, uso único); só vem com `newUser`. Vive em memória. */
  completionToken?: string;
};

/** Equipe oferecida no cadastro de membro. */
export interface ShelterTeamOption {
  id: string;
  shelterId: string;
  label: string;
  teamNumber: number;
  shelterName: string;
}

/** Corpo de `POST /auth/register` e `/auth/complete-register`. */
export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: string;
  teamId?: string;
}

/** Corpo de `POST /auth/complete-register`: a identidade vem do token, nunca do e-mail. */
export interface CompleteRegisterRequest {
  completionToken: string;
  name: string;
  phone: string;
  password?: string;
  role?: string;
  teamId?: string;
}

/** Resposta de registro (só o que a tela usa). */
export interface RegisterResponse {
  emailVerification?: { verificationEmailSent?: boolean };
}
