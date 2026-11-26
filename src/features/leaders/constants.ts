import {
  ADMIN_CREATED_FROM_KEY,
  ADMIN_CREATED_TO_KEY,
  ADMIN_SORT_FILTER_KEY,
} from "@/components/common/admin-shell";

export const LEADERS_TEST_ID_PREFIX = "leader-profiles";
export const LEADERS_CARD_TEST_ID_PREFIX = "leader-profiles-card";

export const LEADERS_LABELS = {
  TITLE: "Gerenciar Líderes",
  SEARCH: "Buscar líder",
  SEARCH_PLACEHOLDER: "Nome, e-mail ou telefone do líder",
  EMPTY: "Nenhum líder encontrado.",
  LOAD_ERROR: "Erro ao listar líderes",
  VIEW: "Ver",
  EDIT: "Abrigos",
  NO_SHELTER: "Sem abrigo",
} as const;

export const LEADERS_FILTER_KEYS = {
  SHELTER: "shelterId",
  LINK: "hasShelter",
  TEAM: "teamName",
  CREATED_FROM: ADMIN_CREATED_FROM_KEY,
  CREATED_TO: ADMIN_CREATED_TO_KEY,
  SORT: ADMIN_SORT_FILTER_KEY,
} as const;

export const LEADERS_DEFAULT_SORT = "updatedAt:DESC";

export const LEADERS_SORT_COLUMNS = {
  NAME: "name",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
} as const;

export const LEADERS_SORT_OPTIONS = [
  { value: "updatedAt:DESC", label: "Atualização (mais recente)" },
  { value: "updatedAt:ASC", label: "Atualização (mais antiga)" },
  { value: "createdAt:DESC", label: "Criação (mais recente)" },
  { value: "createdAt:ASC", label: "Criação (mais antiga)" },
  { value: "name:ASC", label: "Nome (A–Z)" },
  { value: "name:DESC", label: "Nome (Z–A)" },
];

export const LEADERS_LINK_OPTIONS = [
  { value: "true", label: "Com abrigo" },
  { value: "false", label: "Sem abrigo" },
];

/** Máximo de abrigos/equipes/membros listados na linha antes de resumir ("+N"). */
export const LEADERS_INLINE_LIMIT = 2;
