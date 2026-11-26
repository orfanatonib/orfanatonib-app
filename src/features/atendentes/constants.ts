import { AtendenteDocumentsFilter } from "./types";

export const ATENDENTES_ENDPOINT = "/antecedentes-criminais";
export const ATENDENTES_TEST_ID_PREFIX = "atendentes";
export const ATENDENTES_DEFAULT_SORT = "createdAt:DESC";

export const ATENDENTE_FILTER_KEYS = {
  ATTENDABLE_TYPE: "attendableType",
  DOCUMENTS: "documents",
  CREATED_FROM: "createdFrom",
  CREATED_TO: "createdTo",
  SORT: "sort",
} as const;

export const ATENDENTE_LINK_OPTIONS = [
  { value: "integration", label: "Integração FM" },
  { value: "user", label: "Usuário" },
] as const;

export const ATENDENTE_DOCUMENTS_OPTIONS = [
  { value: AtendenteDocumentsFilter.COMPLETE, label: "Estadual e federal" },
  { value: AtendenteDocumentsFilter.ONLY_ESTADUAL, label: "Só estadual" },
  { value: AtendenteDocumentsFilter.ONLY_FEDERAL, label: "Só federal" },
] as const;

export const ATENDENTE_SORT_OPTIONS = [
  { value: "createdAt:DESC", label: "Cadastro: mais recentes" },
  { value: "createdAt:ASC", label: "Cadastro: mais antigos" },
  { value: "updatedAt:DESC", label: "Atualizados recentemente" },
  { value: "name:ASC", label: "Nome: A a Z" },
  { value: "name:DESC", label: "Nome: Z a A" },
] as const;

export const ATENDENTES_LABELS = {
  TITLE: "Antecedentes Criminais",
  SEARCH: "Buscar antecedentes",
  SEARCH_PLACEHOLDER: "Buscar por nome...",
  EMPTY: "Nenhum antecedente criminal cadastrado ainda.",
  LOAD_ERROR: "Erro ao listar antecedentes criminais",
  CREATE: "Novo antecedente",
  FILTER_LINK: "Vínculo",
  FILTER_LINK_ALL: "Todos os vínculos",
  FILTER_DOCUMENTS: "Documentos",
  FILTER_DOCUMENTS_ALL: "Todas as situações",
  FILTER_CREATED_FROM: "Cadastrado a partir de",
  FILTER_CREATED_TO: "Cadastrado até",
  FILTER_SORT: "Ordenar por",
  VIEW: "Ver",
  EDIT: "Editar",
  DELETE: "Excluir antecedente",
  ESTADUAL_PDF: "Estadual.pdf",
  FEDERAL_PDF: "Federal.pdf",
  NO_ESTADUAL: "Sem estadual",
  NO_FEDERAL: "Sem federal",
  PREVIEW_PDF: "Visualizar PDF",
  UPDATED_AT: "Atualizado em",
  CREATED_AT: "Cadastrado em",
  CREATED_OK: "Antecedente criminal criado com sucesso!",
  UPDATED_OK: "Antecedente criminal atualizado com sucesso!",
  DELETED_OK: "Antecedente criminal excluído com sucesso!",
  DELETE_ERROR: "Erro ao excluir antecedente criminal",
  DELETE_WARNING: "Esta ação não pode ser desfeita (os dois PDFs serão removidos).",
  CREATE_ERROR: "Erro ao criar antecedente criminal",
  UPDATE_ERROR: "Erro ao atualizar antecedente criminal",
  DELETE_FAILED: "Erro ao deletar antecedente criminal",
  USER_LINK: "Usuário",
  INTEGRATION_LINK: "Integração FM",
  DEFAULT_NAME: "Antecedente Criminal",
} as const;
