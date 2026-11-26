import type { AdminFilterField } from "@/components/common/admin-shell";

/** Prefixo dos `data-testid` da tela /adm/abrigos (padrão `<p>-manager`, `<p>-toolbar`, ...). */
export const SHELTERS_TESTID = "shelters";

export const SHELTERS_FILTER = {
  SORT: "sort",
  CITY: "city",
  STATE: "state",
  CREATED_FROM: "createdFrom",
  CREATED_TO: "createdTo",
} as const;

export const SHELTERS_DEFAULT_SORT = "updatedAt:DESC";

/** Chaves aceitas pela whitelist `sort` da API (`QuerySheltersDto`). */
export const SHELTERS_SORT_KEY = {
  NAME: "name",
  CITY: "city",
  STATE: "state",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
} as const;

export const SHELTERS_LABELS = {
  TITLE: "Gerenciar Abrigos",
  SEARCH: "Buscar abrigo",
  SEARCH_PLACEHOLDER: "Nome, cidade, líder ou membro...",
  EMPTY: "Nenhum abrigo encontrado.",
  LOAD_ERROR: "Erro ao listar abrigos.",
  CREATE: "Novo abrigo",
  FILTER_CITY: "Cidade",
  FILTER_STATE: "Estado (UF)",
  FILTER_CREATED_FROM: "Criado a partir de",
  FILTER_CREATED_TO: "Criado até",
  FILTER_SORT: "Ordenar por",
} as const;

const SORT_OPTIONS: Array<{ value: string; label: string; needsAddress?: boolean }> = [
  { value: "updatedAt:DESC", label: "Atualizado (mais recente)" },
  { value: "updatedAt:ASC", label: "Atualizado (mais antigo)" },
  { value: "createdAt:DESC", label: "Criado (mais recente)" },
  { value: "createdAt:ASC", label: "Criado (mais antigo)" },
  { value: "name:ASC", label: "Nome (A–Z)" },
  { value: "name:DESC", label: "Nome (Z–A)" },
  { value: "city:ASC", label: "Cidade (A–Z)", needsAddress: true },
  { value: "city:DESC", label: "Cidade (Z–A)", needsAddress: true },
  { value: "state:ASC", label: "Estado (A–Z)", needsAddress: true },
  { value: "state:DESC", label: "Estado (Z–A)", needsAddress: true },
];

/** Campos da toolbar. Cidade/estado só existem quando o endereço está habilitado. */
export function buildSheltersFields(addressEnabled: boolean): AdminFilterField[] {
  const fields: AdminFilterField[] = [];
  if (addressEnabled) {
    fields.push(
      { kind: "text", key: SHELTERS_FILTER.CITY, label: SHELTERS_LABELS.FILTER_CITY, placeholder: "Cidade" },
      { kind: "text", key: SHELTERS_FILTER.STATE, label: SHELTERS_LABELS.FILTER_STATE, placeholder: "UF" },
    );
  }
  fields.push(
    { kind: "date", key: SHELTERS_FILTER.CREATED_FROM, label: SHELTERS_LABELS.FILTER_CREATED_FROM },
    { kind: "date", key: SHELTERS_FILTER.CREATED_TO, label: SHELTERS_LABELS.FILTER_CREATED_TO },
    {
      kind: "select",
      key: SHELTERS_FILTER.SORT,
      label: SHELTERS_LABELS.FILTER_SORT,
      allLabel: null,
      options: SORT_OPTIONS.filter((o) => addressEnabled || !o.needsAddress).map(({ value, label }) => ({
        value,
        label,
      })),
    },
  );
  return fields;
}
