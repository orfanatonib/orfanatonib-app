/** Rota do Estúdio Orfanato: layout com fundo e respiros próprios. */
export const CONTENT_STUDIO_ROUTE_PREFIX = "/adm/estudio";

export const ADMIN_MOBILE_BAR_SPACER_TEST_ID = "admin-mobile-bar-spacer";

/** Alvo de toque mínimo (px) dos itens do menu. */
export const ADMIN_TOUCH_TARGET_PX = 44;

/** Fundo da área principal nas telas do Estúdio (o menu lateral usa o mesmo estilo dos outros grupos). */
export const STUDIO_COLORS = {
  mainBackground: "#f6f8fb",
} as const;

export const ADMIN_DRAWER_Z_INDEX = { mobile: 1300, desktop: 1000 } as const;
