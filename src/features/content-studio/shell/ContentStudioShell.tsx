import ArrowBack from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useEffect } from "react";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { CONTENT_STUDIO_PAGE_SX } from "../styles";
import { studioRouteMeta } from "./shell.utils";

/**
 * Casca de todas as telas do Estúdio (rota-layout: as telas entram pelo `<Outlet />`).
 *
 * Largura, margens e o cabeçalho (voltar, título e descrição) ficam sempre no mesmo lugar, então navegar entre
 * as telas só troca o conteúdo — nada "dança". As telas não desenham cabeçalho nem moldura próprios.
 */
export function ContentStudioShell() {
  const { pathname } = useLocation();
  const meta = studioRouteMeta(pathname);

  // Cada tela abre no topo, como uma página nova.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <Box component="section" data-testid="content-studio-shell" sx={CONTENT_STUDIO_PAGE_SX}>
      <Box component="header" data-testid="content-studio-shell-header" sx={{ mb: { xs: 2, md: 3 } }}>
        {/* A faixa do "voltar" existe em todas as telas (na visão geral fica vazia) para o título não pular. */}
        <Box sx={{ minHeight: 44, display: "flex", alignItems: "center" }}>
          {meta.backTo && (
            <Button
              component={RouterLink}
              to={meta.backTo}
              startIcon={<ArrowBack />}
              data-testid="content-studio-shell-back"
              sx={{ fontWeight: 700, textTransform: "none", minHeight: 44 }}
            >
              {meta.backLabel ?? "Voltar"}
            </Button>
          )}
        </Box>
        <Typography
          component="h1"
          variant="h4"
          fontWeight={700}
          textAlign="center"
          data-testid="content-studio-shell-title"
          sx={{ color: "#1a3c34", fontSize: { xs: "1.5rem", md: "2.125rem" } }}
        >
          {meta.title}
        </Typography>
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 0.5, minHeight: { sm: 24 } }}>
          {meta.description}
        </Typography>
      </Box>
      <Outlet />
    </Box>
  );
}
