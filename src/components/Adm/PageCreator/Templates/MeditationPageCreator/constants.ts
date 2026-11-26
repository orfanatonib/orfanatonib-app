export const MEDITATION_PAGE_TEST_ID = 'meditation-page-creator';
export const MEDITATIONS_ENDPOINT = '/meditations';
export const MEDITATIONS_LIST_PATH = '/adm/meditacoes';
export const MEDITATION_DAYS_REQUIRED = 5;
export const MONDAY_INDEX = 1;
export const FRIDAY_INDEX = 5;

export const MEDITATION_MESSAGES = {
  CREATE_HEADING: '🧘 Criar Meditação da Semana',
  EDIT_HEADING: '✏️ Editar Meditação',
  TOPIC_LABEL: 'Tema da Meditação',
  START_LABEL: 'Data de Início',
  END_LABEL: 'Data de Término',
  MISSING_FIELDS: 'Informe tema, data de início e fim.',
  START_NOT_MONDAY: 'A data de início deve ser uma segunda-feira.',
  END_NOT_FRIDAY: 'A data de término deve ser uma sexta-feira.',
  DAYS_COUNT: 'Adicione exatamente 5 dias de meditação.',
  MEDIA_REQUIRED: 'Informe um link válido ou envie um arquivo.',
  SAVED: 'Meditação salva com sucesso!',
  SAVE_ERROR: 'Erro ao salvar meditação.',
  SAVE: 'Salvar Meditação',
  SAVING: 'Salvando...',
} as const;
