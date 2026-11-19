import { useState } from "react";

import ArrowForward from "@mui/icons-material/ArrowForward";
import Inventory2 from "@mui/icons-material/Inventory2";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import {
  CONTENT_PACKAGE_STATUS_LABELS,
  CONTENT_STUDIO_WORKFLOW,
} from "../constants";
import type { ContentAudience } from "../types";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import { useContentStudioDashboard } from "../hooks/useContentStudioDashboard";
import { formatContentStudioDateTime } from "../utils";
import { DashboardFilters } from "../components/DashboardFilters";
import { DashboardMetrics, DashboardMetricsSkeleton } from "../components/DashboardMetrics";
import { PACKAGE_STATUS_COLORS } from "../period.utils";

export function ContentStudioHomePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [audience, setAudience] = useState("");
  const {
    catalog,
    loading: catalogLoading,
    error: catalogError,
    reload: reloadCatalog,
  } = useContentStudioCatalog();
  const {
    dashboard,
    loading: dashboardLoading,
    error: dashboardError,
    reload: reloadDashboard,
  } = useContentStudioDashboard({
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(audience ? { audience: audience as ContentAudience } : {}),
  });

  const failedJobs = dashboard?.jobs.failed ?? 0;
  const activeJobs = (dashboard?.jobs.pending ?? 0) + (dashboard?.jobs.running ?? 0);
  const hasFilters = !!(startDate || endDate || audience);

  return (
    <Box component="section" data-testid="content-studio-home-page">
      <Stack spacing={3}>

        {catalogLoading && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            data-testid="content-studio-catalog-loading"
          >
            <CircularProgress size={20} />
            <Typography color="text.secondary">Verificando capacidades disponíveis…</Typography>
          </Stack>
        )}

        {!catalogLoading && catalogError && (
          <Alert
            severity="error"
            data-testid="content-studio-catalog-error"
            action={
              <Button color="inherit" onClick={() => void reloadCatalog()} sx={{ minHeight: 44 }}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível consultar as capacidades do Estúdio.
          </Alert>
        )}

        {!catalogLoading && catalog && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            data-testid="content-studio-primary-actions"
          >
            <Button
              component={RouterLink}
              to="/adm/estudio/producao"
              variant="contained"
              endIcon={<ArrowForward />}
              data-testid="content-studio-start-production"
              sx={{ minHeight: 44 }}
            >
              Iniciar produção
            </Button>
            {catalog.capabilities.review && (
              <Button
                component={RouterLink}
                to="/adm/estudio/revisao"
                variant="outlined"
                data-testid="content-studio-open-review"
                sx={{ minHeight: 44 }}
              >
                Abrir revisão
              </Button>
            )}
            <Button
              component={RouterLink}
              to="/adm/estudio/orientacoes"
              variant="outlined"
              data-testid="content-studio-open-guidelines"
              sx={{ minHeight: 44 }}
            >
              Orientações
            </Button>
          </Stack>
        )}

        <DashboardFilters
          startDate={startDate}
          endDate={endDate}
          audience={audience}
          audiences={catalog?.audiences ?? []}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onAudienceChange={setAudience}
        />

        {dashboardLoading && (
          <Box data-testid="content-studio-dashboard-loading">
            <DashboardMetricsSkeleton />
          </Box>
        )}

        {!dashboardLoading && dashboardError && (
          <Alert
            severity="error"
            data-testid="content-studio-dashboard-error"
            action={
              <Button color="inherit" onClick={() => void reloadDashboard()} sx={{ minHeight: 44 }}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar o painel do Estúdio.
          </Alert>
        )}

        {!dashboardLoading && dashboard && <DashboardMetrics dashboard={dashboard} />}

        {!dashboardLoading && dashboard && failedJobs + activeJobs > 0 && (
          <Alert
            severity={failedJobs > 0 ? "error" : "info"}
            data-testid="content-studio-dashboard-generation-alert"
            action={
              <Button
                component={RouterLink}
                to="/adm/estudio/producao"
                color="inherit"
                sx={{ minHeight: 44 }}
              >
                Abrir produção
              </Button>
            }
          >
            {failedJobs > 0 &&
              `${failedJobs} geração(ões) de conteúdo falharam. `}
            {activeJobs > 0 &&
              `${activeJobs} geração(ões) em andamento. `}
            {failedJobs > 0
              ? "Abra a produção para tentar de novo ou editar o conteúdo manualmente."
              : "Os resultados aparecem na produção assim que ficarem prontos."}
          </Alert>
        )}

        {!dashboardLoading && dashboard && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Typography component="h2" variant="h6" fontWeight={700}>
                Materiais para visita recentes
              </Typography>
              {dashboard.recent.length > 0 && (
                <Button
                  component={RouterLink}
                  to="/adm/estudio/producao"
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{ minHeight: 36 }}
                >
                  Ver todos
                </Button>
              )}
            </Stack>

            {dashboard.recent.length === 0 ? (
              <Card variant="outlined" data-testid="content-studio-dashboard-empty">
                <CardContent>
                  <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ py: 2 }}>
                    <Inventory2 color="disabled" sx={{ fontSize: 48 }} />
                    <Typography fontWeight={600}>
                      {hasFilters
                        ? "Nenhum material encontrado com esses filtros."
                        : "Nenhum material para visita criado ainda."}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hasFilters
                        ? "Ajuste o período ou a faixa etária para ver outros resultados."
                        : "Comece criando o primeiro material para visita na produção."}
                    </Typography>
                    {!hasFilters && (
                      <Button
                        component={RouterLink}
                        to="/adm/estudio/producao"
                        variant="contained"
                        sx={{ minHeight: 44 }}
                      >
                        Criar primeiro material
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={1} data-testid="content-studio-dashboard-recent">
                {dashboard.recent.map((pkg) => (
                  <Card key={pkg.id} variant="outlined">
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { sm: "center" },
                        justifyContent: "space-between",
                        gap: 1,
                        py: "12px !important",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={600} noWrap>
                          {pkg.theme}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pkg.biblicalReferences} · atualizado em{" "}
                          {formatContentStudioDateTime(pkg.updatedAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={CONTENT_PACKAGE_STATUS_LABELS[pkg.status]}
                          size="small"
                          color={PACKAGE_STATUS_COLORS[pkg.status]}
                          variant={PACKAGE_STATUS_COLORS[pkg.status] === "default" ? "outlined" : "filled"}
                        />
                        <Button
                          component={RouterLink}
                          to={`/adm/estudio/pacotes/${pkg.id}`}
                          size="small"
                          endIcon={<ArrowForward />}
                          sx={{ minHeight: 44, minWidth: 44 }}
                        >
                          Abrir
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}

        <Divider />

        <Box>
          <Typography component="h2" variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
            Como funciona o fluxo
          </Typography>
          <Box
            data-testid="content-studio-workflow"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {CONTENT_STUDIO_WORKFLOW.map(
              ({ title, description, icon: WorkflowIcon, path, action, available }, index) => {
                const canNavigate =
                  available &&
                  path !== null &&
                  (path !== "/adm/estudio/revisao" || catalog?.capabilities.review === true);

                return (
                  <Card key={title} variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Stack spacing={2} alignItems="flex-start">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <WorkflowIcon color="primary" fontSize="large" />
                          <Typography variant="overline" color="text.secondary">
                            Etapa {index + 1}
                          </Typography>
                        </Stack>
                        <Box>
                          <Typography component="h3" variant="h6" fontWeight={700} gutterBottom>
                            {title}
                          </Typography>
                          <Typography color="text.secondary">{description}</Typography>
                        </Box>
                        {canNavigate && path ? (
                          <Button
                            component={RouterLink}
                            to={path}
                            endIcon={<ArrowForward />}
                            sx={{ minHeight: 44, px: 0 }}
                          >
                            {action}
                          </Button>
                        ) : (
                          <Chip
                            label={path === "/adm/estudio/revisao" ? "Revisão desabilitada" : action}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
