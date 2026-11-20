import type { SxProps, Theme } from "@mui/material/styles";

export const CONTENT_STUDIO_PAGE_SX: SxProps<Theme> = {
  // Telas do Estúdio usam quase toda a largura: 98% no celular e 95% a partir do desktop (sem teto em px).
  width: { xs: "98%", md: "95%" },
  maxWidth: "none",
  mx: "auto",
  px: 0,
  py: { xs: 2, md: 3 },
  "& .MuiCard-root": {
    borderColor: "rgba(26, 48, 84, 0.12)",
    borderRadius: 3,
    boxShadow: "0 2px 12px rgba(23, 42, 69, 0.045)",
    transition: "border-color 160ms ease, box-shadow 160ms ease",
    "&:hover": {
      borderColor: "rgba(26, 48, 84, 0.2)",
      boxShadow: "0 8px 24px rgba(23, 42, 69, 0.08)",
    },
  },
  "& .MuiCardContent-root": {
    p: { xs: 2, sm: 2.5, md: 3 },
    "&:last-child": { pb: { xs: 2, sm: 2.5, md: 3 } },
  },
};
