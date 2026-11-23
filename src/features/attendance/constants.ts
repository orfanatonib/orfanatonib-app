export const ATTENDANCE_RECORDS_PAGE_SIZE = 100;
export const ATTENDANCE_MEMBERS_PAGE_SIZE = 12;
export const ATTENDANCE_COMMENT_LIMIT = 500;
export const ATTENDANCE_HISTORY_PAGE_SIZE = 12;
export const ATTENDANCE_TOUCH_SIZE = 44;

export const ATTENDANCE_PATHS = {
  root: "/adm/presenca",
  register: "/adm/presenca/lancar",
  history: "/adm/presenca/consultar",
  pending: "/adm/presenca/pendencias",
  teams: "/adm/presenca/equipes",
} as const;

/** Prefixo dos `data-testid` da lista de "Lançar presença" (`-toolbar`, `-loading`, `-cards`, `-card-<id>`...). */
export const ATTENDANCE_LIST_PREFIX = "attendance-register";
