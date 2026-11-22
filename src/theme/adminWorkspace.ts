import type { SxProps, Theme } from "@mui/material";

/** Largura útil do conteúdo dentro do painel admin: 98% no celular, 95% no desktop. */
export const ADMIN_WORKSPACE_WIDTH = { mobile: "98%", desktop: "95%" } as const;

/** O `<main>` do painel recua 32px por lado a partir de `md`; aqui o recuo é anulado. */
const ADMIN_MAIN_INSET_PX = 64;

/** Faixa que ocupa toda a área ao lado da gaveta (para que os 95% sejam medidos sobre ela). */
export const adminWorkspaceBleedSx: SxProps<Theme> = {
  width: { xs: "100%", md: `calc(100% + ${ADMIN_MAIN_INSET_PX}px)` },
  mx: { xs: 0, md: -4 },
  minWidth: 0,
};

/** Conteúdo centralizado dentro da faixa. */
export const adminWorkspaceContentSx: SxProps<Theme> = {
  width: { xs: ADMIN_WORKSPACE_WIDTH.mobile, md: ADMIN_WORKSPACE_WIDTH.desktop },
  mx: "auto",
  minWidth: 0,
  boxSizing: "border-box",
};
