import type { RegisterRoleChoice } from "./registerSchema";

/** Valores do formulário de cadastro (cadastro comum e complemento do Google). */
export interface RegisterFormData {
  name: string;
  email: string;
  confirmEmail?: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  role: RegisterRoleChoice;
  teamId?: string;
}

/** Propriedades da página: `commonUser` = cadastro comum; senão é o complemento do Google. */
export interface RegisterProps {
  commonUser: boolean;
}
