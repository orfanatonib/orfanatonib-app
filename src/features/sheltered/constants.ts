import { ShelteredGender, ShelteredOrderBy, SortOrder } from "./enums";
import type { ShelteredFilters, ShelteredSort } from "./types";

export const SHELTERED_ENDPOINT = "/sheltered";

export const SHELTERED_PAGE_SIZE_DEFAULT = 12;
export const SHELTERED_PAGE_SIZE_OPTIONS = [12, 24, 50] as const;
export const SHELTERED_CARD_PAGE_SIZE_OPTIONS = [6, 12, 24] as const;

export const SHELTERED_SORT_DEFAULT: ShelteredSort = {
  id: ShelteredOrderBy.UPDATED_AT,
  desc: true,
};

export const SHELTERED_FILTERS_EMPTY: ShelteredFilters = {
  searchString: "",
  shelterSearchingString: "",
  addressFilter: "",
  gender: undefined,
  birthDateFrom: "",
  birthDateTo: "",
  joinedFrom: "",
  joinedTo: "",
};

/** Minimum interactive size required by the accessibility guideline. */
export const MIN_TOUCH_TARGET_PX = 44;

export const GENDER_LABELS: Readonly<Record<ShelteredGender, string>> = {
  [ShelteredGender.MALE]: "Masculino",
  [ShelteredGender.FEMALE]: "Feminino",
};

export const SHELTERED_SORT_OPTIONS: ReadonlyArray<{
  id: ShelteredOrderBy;
  label: string;
}> = [
  { id: ShelteredOrderBy.NAME, label: "Nome" },
  { id: ShelteredOrderBy.BIRTH_DATE, label: "Nascimento" },
  { id: ShelteredOrderBy.JOINED_AT, label: "No abrigo desde" },
  { id: ShelteredOrderBy.UPDATED_AT, label: "Atualizado em" },
  { id: ShelteredOrderBy.CREATED_AT, label: "Criado em" },
];

export const SORT_ORDER_BY_DESC: Readonly<Record<"true" | "false", SortOrder>> = {
  true: SortOrder.DESC,
  false: SortOrder.ASC,
};

export const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=";

export const SHELTERED_MESSAGES = {
  LIST_ERROR: "Erro ao listar acolhidos",
  CREATE_ERROR: "Erro ao criar acolhido",
  UPDATE_ERROR: "Erro ao atualizar acolhido",
  DELETE_ERROR: "Erro ao remover acolhido",
  SHELTERS_ERROR: "Falha ao carregar abrigos",
  INVALID_BIRTH_DATE: "Data de nascimento inválida. Use o formato DD/MM/AAAA.",
  INVALID_JOINED_AT: 'Data "No abrigo desde" inválida. Use o formato DD/MM/AAAA.',
  EMPTY_TITLE: "Nenhum acolhido encontrado",
  EMPTY_HINT: "Tente ajustar os filtros de busca ou criar um novo acolhido.",
  LOADING: "Carregando acolhidos...",
  NO_SHELTER: "Sem abrigo",
  NO_GUARDIAN: "Sem responsável",
  NO_ADDRESS: "Nenhum endereço cadastrado.",
  MEMBER_WITHOUT_SHELTER: "Seu perfil não possui um abrigo vinculado.",
} as const;

/** Root of every `data-testid` in the feature, so selectors stay predictable. */
export const SHELTERED_TESTID = {
  MANAGER: "sheltered-manager",
  LOADING: "sheltered-loading",
  ERROR: "sheltered-error",
  EMPTY: "sheltered-empty",
  TOOLBAR: "sheltered-toolbar",
  TABLE: "sheltered-table",
  CARDS: "sheltered-cards",
  VIEW_DIALOG: "sheltered-view-dialog",
  FORM_DIALOG: "sheltered-form-dialog",
  DELETE_DIALOG: "sheltered-delete-dialog",
} as const;
