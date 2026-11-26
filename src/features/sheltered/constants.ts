import { ShelteredGender, ShelteredOrderBy, SortOrder } from "./enums";
import type { ShelteredSort } from "./types";

export const SHELTERED_ENDPOINT = "/sheltered";

export const SHELTERED_PAGE_SIZE_DEFAULT = 12;

export const SHELTERED_SORT_DEFAULT: ShelteredSort = {
  id: ShelteredOrderBy.UPDATED_AT,
  desc: true,
};

/** Ordenação inicial da tela, no formato `campo:ORDEM` do select `sort` da toolbar. */
export const SHELTERED_SORT_DEFAULT_VALUE = `${ShelteredOrderBy.UPDATED_AT}:${SortOrder.DESC}`;

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
  EMPTY_HINT: "Nenhum acolhido cadastrado ainda. Use o botão Criar acolhido.",
  NO_SHELTER: "Sem abrigo",
  NO_GUARDIAN: "Sem responsável",
  NO_ADDRESS: "Nenhum endereço cadastrado.",
  MEMBER_WITHOUT_SHELTER: "Seu perfil não possui um abrigo vinculado.",
} as const;

/** Prefixo dos `data-testid` da tela (`sheltered-manager`, `sheltered-toolbar`, `sheltered-card-<id>`...). */
export const SHELTERED_TESTID_PREFIX = "sheltered";

/** Diálogos da tela. */
export const SHELTERED_TESTID = {
  TABLE: "sheltered-table",
  CARDS: "sheltered-cards",
  VIEW_DIALOG: "sheltered-view-dialog",
  FORM_DIALOG: "sheltered-form-dialog",
  DELETE_DIALOG: "sheltered-delete-dialog",
} as const;

/** Opções do select de ordenação: `campo:ORDEM` (o servidor recebe `orderBy` + `order`). */
export const SHELTERED_SORT_FIELD_OPTIONS: ReadonlyArray<{ value: string; label: string }> =
  SHELTERED_SORT_OPTIONS.flatMap((option) => [
    { value: `${option.id}:${SortOrder.ASC}`, label: `${option.label} (crescente)` },
    { value: `${option.id}:${SortOrder.DESC}`, label: `${option.label} (decrescente)` },
  ]);
