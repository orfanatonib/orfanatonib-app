import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Link,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SettingsInputCompositeIcon from "@mui/icons-material/SettingsInputComposite";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";

import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";
import {
  OBSERVABILITY_AUDIT_ROUTE,
  OBSERVABILITY_AUDIT_TEST_IDS,
} from "@/features/observability-audit/constants";
import type { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

const FOOTER_ADMIN_LINK_SX = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  minHeight: 44,
  fontSize: "0.75rem",
} as const;

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isAdmin = useSelector(
    (state: RootState) => state.auth.user?.role === UserRole.ADMIN,
  );

  const auditEnabled = useIsFeatureEnabled(FeatureFlagKeys.OBSERVABILITY_AUDIT);
  const studioEnabled = useIsFeatureEnabled(FeatureFlagKeys.CONTENT_STUDIO);
  const providerAdminFlag = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_PROVIDER_ADMIN,
  );
  const providerAdminEnabled = studioEnabled && providerAdminFlag;

  return (
    <Box
      component="footer"
      data-testid="app-footer"
      sx={{
        position: "relative",
        zIndex: 1220,
        backgroundColor: "#000000",
        color: "#FFFF00",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        textAlign: "center",
        width: "100%",
        mt: "auto",
      }}
    >
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={isMobile ? 3 : 6}
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        textAlign="center"
      >
        <Stack
          direction="row"
          spacing={3}
          justifyContent="center"
          flexWrap="wrap"
        >
          <Link href="/" underline="hover" color="inherit" fontWeight="medium">
            Início
          </Link>
          <Link
            href="/sobre"
            underline="hover"
            color="inherit"
            fontWeight="medium"
          >
            Sobre
          </Link>
          <Link
            href="/eventos"
            underline="hover"
            color="inherit"
            fontWeight="medium"
          >
            Eventos
          </Link>
          <Link
            href="/contato"
            underline="hover"
            color="inherit"
            fontWeight="medium"
          >
            Contato
          </Link>
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="center">
          <IconButton
            aria-label="Facebook"
            component="a"
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            <FacebookIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Instagram"
            component="a"
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            <InstagramIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="YouTube"
            component="a"
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            <YouTubeIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack spacing={0.5} alignItems="center">
          <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
            © 2025 NIB - Nova Igreja Batista. Todos os direitos reservados.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
            Desenvolvido por{" "}
            <Link
              href="https://rodolfo-silva.com"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              fontWeight="bold"
              underline="hover"
            >
              Diego Seven System
            </Link>
          </Typography>
          {isAdmin ? (
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              justifyContent="center"
            >
              <Link
                component={RouterLink}
                to="/adm/feature-flags"
                color="inherit"
                underline="hover"
                data-testid="footer-feature-flags-link"
                sx={FOOTER_ADMIN_LINK_SX}
              >
                <FlagOutlinedIcon sx={{ fontSize: "0.9rem" }} />
                Feature flags
              </Link>
              {auditEnabled ? (
                <Link
                  component={RouterLink}
                  to={OBSERVABILITY_AUDIT_ROUTE}
                  color="inherit"
                  underline="hover"
                  data-testid={OBSERVABILITY_AUDIT_TEST_IDS.footerLink}
                  sx={FOOTER_ADMIN_LINK_SX}
                >
                  <FactCheckOutlinedIcon sx={{ fontSize: "0.9rem" }} />
                  Auditoria e observabilidade
                </Link>
              ) : null}
              {providerAdminEnabled ? (
                <Link
                  component={RouterLink}
                  to="/adm/config-provedores-ia"
                  color="inherit"
                  underline="hover"
                  data-testid="footer-ai-providers-link"
                  sx={FOOTER_ADMIN_LINK_SX}
                >
                  <SettingsInputCompositeIcon sx={{ fontSize: "0.9rem" }} />
                  Provedores e Modelos IA
                </Link>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
};

export default Footer;
