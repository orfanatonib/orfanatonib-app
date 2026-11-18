import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
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
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

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

  return (
    <Box
      component="section"
      data-testid="content-studio-home-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          eyebrow="Painel editorial"
          title="Estúdio Orfanato"
          description="Acompanhe o fluxo editorial, identifique pendências e acesse rapidamente produção e revisão."
        />

        {/* Dashboard loading */}
        {dashboardLoading && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            data-testid="content-studio-dashboard-loading"
          >
            <CircularProgress size={24} />
            <Typography color="text.secondary">Carregando painel…</Typography>
          </Stack>
        )}

        {/* Dashboard error */}
        {!dashboardLoading && dashboardError && (
          <Alert
            severity="error"
            data-testid="content-studio-dashboard-error"
            action={
              <Button
                color="inherit"
                onClick={() => void reloadDashboard()}
                sx={{ minHeight: 44 }}
              >
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar o painel do Estúdio.
          </Alert>
        )}

        {/* Dashboard metrics */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          data-testid="content-studio-dashboard-filters"
        >
          <TextField
            label="De"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              "data-testid": "content-studio-dashboard-start-date",
            }}
          />
          <TextField
            label="Até"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ "data-testid": "content-studio-dashboard-end-date" }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="content-studio-dashboard-audience-label">
              Faixa
            </InputLabel>
            <Select
              labelId="content-studio-dashboard-audience-label"
              label="Faixa"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              inputProps={{
                "data-testid": "content-studio-dashboard-audience",
              }}
            >
              <MenuItem value="">Todas as faixas</MenuItem>
              {catalog?.audiences.map((definition) => (
                <MenuItem key={definition.audience} value={definition.audience}>
                  {definition.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {!dashboardLoading && dashboard && (
          <Box
            data-testid="content-studio-dashboard-metrics"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
              gap: 2,
            }}
          >
            <Card
              variant="outlined"
              data-testid="content-studio-dashboard-metric-total"
            >
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Pacotes total
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard.packages.total}
                </Typography>
              </CardContent>
            </Card>
            <Card
              variant="outlined"
              data-testid="content-studio-dashboard-metric-production"
            >
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Em produção
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard.packages.inProduction}
                </Typography>
              </CardContent>
            </Card>
            <Card
              variant="outlined"
              data-testid="content-studio-dashboard-metric-review"
            >
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Em revisão
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard.packages.awaitingReview}
                </Typography>
              </CardContent>
            </Card>
            <Card
              variant="outlined"
              data-testid="content-studio-dashboard-metric-ready"
            >
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Prontos para publicar
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard.packages.readyForPublication}
                </Typography>
              </CardContent>
            </Card>
            <Card
              variant="outlined"
              data-testid="content-studio-dashboard-metric-published"
            >
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Publicados
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard.packages.publishedTotal}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {!dashboardLoading &&
          dashboard &&
          dashboard.jobs.failed +
            dashboard.jobs.pending +
            dashboard.jobs.running >
            0 && (
            <Alert
              severity="warning"
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
              Há {dashboard.jobs.failed} falha(s), {dashboard.jobs.pending}{" "}
              pendente(s) e {dashboard.jobs.running} em execução. Confira a
              produção; jobs antigos sem worker precisam de tratamento
              operacional.
            </Alert>
          )}

        {/* Recent packages */}
        {!dashboardLoading && dashboard && (
          <Box>
            <Typography
              component="h2"
              variant="h6"
              fontWeight={700}
              gutterBottom
            >
              Pacotes recentes
            </Typography>
            {dashboard.recent.length === 0 ? (
              <Typography
                color="text.secondary"
                data-testid="content-studio-dashboard-empty"
              >
                Nenhum pacote criado ainda.
              </Typography>
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
                      <Box>
                        <Typography fontWeight={600}>{pkg.theme}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pkg.biblicalReferences} ·{" "}
                          {formatContentStudioDateTime(pkg.updatedAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={CONTENT_PACKAGE_STATUS_LABELS[pkg.status]}
                          size="small"
                          variant="outlined"
                        />
                        <Button
                          component={RouterLink}
                          to={`/adm/estudio/pacotes/${pkg.id}`}
                          size="small"
                          sx={{ minHeight: 44, minWidth: 44 }}
                        >
                          Ver
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

        {/* Catalog loading */}
        {catalogLoading && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            data-testid="content-studio-catalog-loading"
          >
            <CircularProgress size={24} />
            <Typography color="text.secondary">
              Verificando capacidades disponíveis…
            </Typography>
          </Stack>
        )}

        {/* Catalog error */}
        {!catalogLoading && catalogError && (
          <Alert
            severity="error"
            data-testid="content-studio-catalog-error"
            action={
              <Button
                color="inherit"
                onClick={() => void reloadCatalog()}
                sx={{ minHeight: 44 }}
              >
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
            flexWrap="wrap"
            data-testid="content-studio-primary-actions"
          >
            <Button
              component={RouterLink}
              to="/adm/estudio/producao"
              variant="contained"
              data-testid="content-studio-start-production"
              sx={{ minHeight: 44 }}
            >
              Iniciar produção
            </Button>
            <Button
              component={RouterLink}
              to="/adm/estudio/orientacoes"
              variant="outlined"
              data-testid="content-studio-open-guidelines"
              sx={{ minHeight: 44 }}
            >
              Orientações
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
            {catalog.capabilities.providerAdministration && (
              <Button
                component={RouterLink}
                to="/adm/estudio/provedores-ia"
                variant="outlined"
                data-testid="content-studio-open-ai-providers"
                sx={{ minHeight: 44 }}
              >
                Provedores de IA
              </Button>
            )}
          </Stack>
        )}

        {/* Workflow cards */}
        <Box
          data-testid="content-studio-workflow"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {CONTENT_STUDIO_WORKFLOW.map(
            ({
              title,
              description,
              icon: WorkflowIcon,
              path,
              action,
              available,
            }) => {
              const canNavigate =
                available &&
                path !== null &&
                (path !== "/adm/estudio/revisao" ||
                  catalog?.capabilities.review === true);

              return (
                <Card key={title} variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack spacing={2} alignItems="flex-start">
                      <WorkflowIcon color="primary" fontSize="large" />
                      <Box>
                        <Typography
                          component="h2"
                          variant="h6"
                          fontWeight={700}
                          gutterBottom
                        >
                          {title}
                        </Typography>
                        <Typography color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                      {canNavigate && path ? (
                        <Button
                          component={RouterLink}
                          to={path}
                          sx={{ minHeight: 44, px: 0 }}
                        >
                          {action}
                        </Button>
                      ) : (
                        <Chip
                          label={
                            path === "/adm/estudio/revisao"
                              ? "Revisão desabilitada"
                              : action
                          }
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
      </Stack>
    </Box>
  );
}
