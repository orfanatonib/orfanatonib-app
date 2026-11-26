export const PROFILES_TEST_ID_PREFIX = 'profiles';
export const PROFILES_DEFAULT_SORT = 'name:ASC';

/** Limite das buscas do painel de aniversariantes (um mês de cadastros cabe com folga). */
export const BIRTHDAYS_FETCH_LIMIT = 1000;
export const NO_BIRTHDAY_SORT_DAYS = 999;
/** O painel mostra "esta semana" (próximos 7 dias): perto do fim do mês olha também o mês seguinte. */
export const BIRTHDAY_WEEK_DAYS = 7;

export const PROFILE_FILTER_KEYS = {
  ROLE: 'role',
  GENDER: 'gender',
  BIRTH_MONTH: 'birthMonth',
  TEMPERAMENTS: 'temperaments',
  LOVE_LANGUAGES: 'loveLanguages',
  FAVORITE_COLOR: 'favoriteColor',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const PROFILE_ROLE_OPTIONS = ['member', 'leader', 'admin'] as const;

export const PROFILE_GENDER_OPTIONS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
] as const;

export const BIRTH_MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export const PROFILE_SORT_OPTIONS = [
  { value: 'name:ASC', label: 'Nome (A-Z)' },
  { value: 'name:DESC', label: 'Nome (Z-A)' },
  { value: 'email:ASC', label: 'E-mail (A-Z)' },
  { value: 'email:DESC', label: 'E-mail (Z-A)' },
  { value: 'createdAt:DESC', label: 'Cadastro: mais recentes' },
  { value: 'createdAt:ASC', label: 'Cadastro: mais antigos' },
  { value: 'birthDate:ASC', label: 'Idade: mais velhos primeiro' },
  { value: 'birthDate:DESC', label: 'Idade: mais novos primeiro' },
] as const;

export const MANAGER_TEXTS = {
  title: 'Nossa Família ❤️',
  loadError: 'Erro ao carregar perfis.',
  birthdaysWarn: 'Não foi possível carregar os perfis para os aniversários',
  searchLabel: 'Buscar perfis',
  searchPlaceholder: 'Buscar por nome ou email...',
  empty: 'Nenhum perfil encontrado.',
  filterRole: 'Papel',
  filterRoleAll: 'Todos os papéis',
  filterGender: 'Gênero',
  filterGenderAll: 'Todos os gêneros',
  filterBirthMonth: 'Aniversário em',
  filterBirthMonthAll: 'Qualquer mês',
  filterTemperaments: 'Temperamento',
  filterTemperamentsPlaceholder: 'Ex: Sanguíneo',
  filterLoveLanguages: 'Linguagem do Amor',
  filterLoveLanguagesPlaceholder: 'Ex: Palavras',
  filterFavoriteColor: 'Cor Favorita',
  filterFavoriteColorPlaceholder: 'Ex: Azul',
  filterCreatedFrom: 'Cadastro a partir de',
  filterCreatedTo: 'Cadastro até',
  filterSort: 'Ordenar por',
  registeredAt: 'Cadastro em',
  years: 'anos',
} as const;
