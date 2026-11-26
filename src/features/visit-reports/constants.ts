export const VISIT_REPORTS_TEST_ID_PREFIX = 'visit-reports';
export const VISIT_REPORTS_DEFAULT_SORT = 'createdAt:DESC';

export const VISIT_REPORT_FILTER_KEYS = {
    VISIT_FROM: 'visitFrom',
    VISIT_TO: 'visitTo',
    CREATED_FROM: 'createdFrom',
    CREATED_TO: 'createdTo',
    SORT: 'sort',
} as const;

export const VISIT_REPORT_SORT_OPTIONS = [
    { value: 'createdAt:DESC', label: 'Criação: mais recentes' },
    { value: 'createdAt:ASC', label: 'Criação: mais antigos' },
    { value: 'visitDate:DESC', label: 'Data da visita: mais recentes' },
    { value: 'visitDate:ASC', label: 'Data da visita: mais antigas' },
    { value: 'visitNumber:ASC', label: 'Nº da visita: crescente' },
    { value: 'visitNumber:DESC', label: 'Nº da visita: decrescente' },
    { value: 'shelter:ASC', label: 'Abrigo: A a Z' },
    { value: 'shelter:DESC', label: 'Abrigo: Z a A' },
    { value: 'team:ASC', label: 'Equipe: crescente' },
    { value: 'team:DESC', label: 'Equipe: decrescente' },
] as const;

export const VISIT_REPORTS_LABELS = {
    TITLE: 'Relatórios das Visitas',
    SEARCH: 'Buscar relatórios',
    SEARCH_PLACEHOLDER: 'Buscar por abrigo, equipe, conteúdo do relatório...',
    EMPTY: 'Nenhum relatório encontrado.',
    LOAD_ERROR: 'Erro ao carregar Relatórios das Visitas',
    CREATE: 'Novo Relatório',
    FILTER_VISIT_FROM: 'Visita a partir de',
    FILTER_VISIT_TO: 'Visita até',
    FILTER_CREATED_FROM: 'Criado a partir de',
    FILTER_CREATED_TO: 'Criado até',
    FILTER_SORT: 'Ordenar por',
    VIEW: 'Ver',
    EDIT: 'Editar',
    DELETE: 'Excluir relatório',
    NO_DATE: 'Sem data',
    DELETE_DESCRIPTION: 'Tem certeza que deseja excluir este relatório de visita? Esta ação não pode ser desfeita.',
    SAVE_ERROR: 'Não foi possível salvar o relatório.',
} as const;
