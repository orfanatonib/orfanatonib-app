import { UserRole } from "@/store/slices/auth/authSlice";
import type { AdminFilterField } from "@/components/common/admin-shell";
import {
  ADMIN_CREATED_FROM_KEY,
  ADMIN_CREATED_TO_KEY,
  ADMIN_SORT_FILTER_KEY,
} from "@/components/common/admin-shell";

export const USERS_TEST_ID_PREFIX = "users";
export const USERS_CARD_TEST_ID_PREFIX = "users-card";

export const USERS_LABELS = {
  TITLE: "Gerenciador de Usuários",
  SEARCH: "Buscar usuário",
  SEARCH_PLACEHOLDER: "Nome, e-mail, telefone ou papel",
  EMPTY: "Nenhum usuário encontrado. Crie um novo usuário para começar.",
  LOAD_ERROR: "Erro ao buscar usuários",
  CREATE: "Criar Usuário",
  VIEW: "Ver",
  EDIT: "Editar",
  DELETE: "Excluir",
} as const;

export const USERS_FILTER_KEYS = {
  ROLE: "role",
  ACTIVE: "active",
  COMPLETED: "completed",
  CREATED_FROM: ADMIN_CREATED_FROM_KEY,
  CREATED_TO: ADMIN_CREATED_TO_KEY,
  SORT: ADMIN_SORT_FILTER_KEY,
} as const;

export const USERS_DEFAULT_SORT = "updatedAt:DESC";

export const USERS_SORT_COLUMNS = {
  NAME: "name",
  ROLE: "role",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
} as const;

export const USERS_FILTER_FIELDS: AdminFilterField[] = [
  {
    kind: "select",
    key: USERS_FILTER_KEYS.ROLE,
    label: "Papel",
    allLabel: "Todos",
    options: [
      { value: UserRole.LEADER, label: "Líder" },
      { value: UserRole.MEMBER, label: "Membro" },
    ],
  },
  {
    kind: "select",
    key: USERS_FILTER_KEYS.ACTIVE,
    label: "Status",
    allLabel: "Todos",
    options: [
      { value: "active", label: "Ativos" },
      { value: "inactive", label: "Inativos" },
    ],
  },
  {
    kind: "select",
    key: USERS_FILTER_KEYS.COMPLETED,
    label: "Cadastro",
    allLabel: "Todos",
    options: [
      { value: "completed", label: "Completos" },
      { value: "incomplete", label: "Incompletos" },
    ],
  },
  { kind: "date", key: USERS_FILTER_KEYS.CREATED_FROM, label: "Criado a partir de" },
  { kind: "date", key: USERS_FILTER_KEYS.CREATED_TO, label: "Criado até" },
  {
    kind: "select",
    key: USERS_FILTER_KEYS.SORT,
    label: "Ordenar por",
    allLabel: null,
    options: [
      { value: "updatedAt:DESC", label: "Atualização (mais recente)" },
      { value: "updatedAt:ASC", label: "Atualização (mais antiga)" },
      { value: "createdAt:DESC", label: "Criação (mais recente)" },
      { value: "createdAt:ASC", label: "Criação (mais antiga)" },
      { value: "name:ASC", label: "Nome (A–Z)" },
      { value: "name:DESC", label: "Nome (Z–A)" },
      { value: "role:ASC", label: "Papel (A–Z)" },
      { value: "role:DESC", label: "Papel (Z–A)" },
    ],
  },
];
