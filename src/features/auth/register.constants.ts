import type { RegisterFormData } from "./register.types";

export const REGISTER_DEFAULT_VALUES: RegisterFormData = {
  name: "",
  email: "",
  confirmEmail: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "",
  teamId: "",
};

export const REGISTER_ROLE_OPTIONS = [
  { value: "member", label: "Membro" },
  { value: "leader", label: "Líder" },
] as const;

export const REGISTER_TEAM_HELPER_TEXT =
  "Você pode escolher uma equipe agora ou deixar para o time definir depois. Se não encontrar sua equipe na lista, não tem problema: a coordenação vai te vincular à equipe correta mais pra frente.";

export const REGISTER_TITLES = {
  common: "Cadastro de Usuário",
  complete: "Completar Cadastro",
} as const;

export const REGISTER_SUBMIT_LABELS = {
  common: "Cadastrar",
  complete: "Completar Cadastro",
} as const;
