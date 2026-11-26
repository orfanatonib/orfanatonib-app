import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Timer from "@mui/icons-material/Timer";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { audienceLabel, formatDuration, groupActivityByPackage } from "../../generation-activity.utils";
import { GenerationJobStatus, generationErrorMessage } from "../../generation.utils";
import { useGenerationActivity } from "../../hooks/useGenerationActivity";
import { useNow } from "../../hooks/useNow";
import { AiGenerationCapability, type ContentAudienceDefinitionResponse } from "../../types";
import { formatContentStudioDateTime } from "../../utils";
import { GenerationCapacityMeter } from "./GenerationCapacityMeter";
import { GenerationJobRow } from "./GenerationJobRow";

interface GenerationActivityDashboardProps {
  audiences: readonly ContentAudienceDefinitionResponse[];
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "success" | "error" | "info" }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: tone ? `${tone}.main` : "text.secondary", display: { xs: "none", sm: "flex" } }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ m: 0 }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/** Painel completo do Estúdio: vagas, o que está gerando por material e categoria, resultado das últimas 24 horas. */
export function GenerationActivityDashboard({ audiences }: GenerationActivityDashboardProps) {
  const { activity, loading, error, reload } = useGenerationActivity();
  const now = useNow((activity?.active.length ?? 0) > 0);

  if (loading && !activity) return <Skeleton variant="rounded" height={220} data-testid="content-studio-activity-loading" />;
  if (!activity)
    return error ? (
      <Alert
        severity="error"
        data-testid="content-studio-activity-error"
        action={
          <Button color="inherit" onClick={() => void reload()} sx={{ minHeight: 44 }}>
            Tentar novamente
          </Button>
        }
      >
        Não foi possível carregar o andamento das gerações.
      </Alert>
    ) : null;

  const order = audiences.map((item) => item.audience);
  const groups = groupActivityByPackage(activity.active, order);
  const { last24h } = activity;

  return (
    <Box component="section" aria-labelledby="studio-activity-title" data-testid="content-studio-activity-dashboard">
      <Stack spacing={2}>
        <Typography id="studio-activity-title" component="h2" variant="h6" fontWeight={700}>
          Gerações em andamento
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <GenerationCapacityMeter activity={activity} />
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }} aria-label="Resultado das últimas 24 horas" role="group">
                    <Stat icon={<CheckCircleOutline />} label="Concluídas" value={String(last24h.succeeded)} tone="success" />
          <Stat icon={<ErrorOutline />} label="Falhas" value={String(last24h.failed)} tone={last24h.failed > 0 ? "error" : undefined} />
          <Stat icon={<Timer />} label="Tempo médio" value={last24h.averageDurationMs === null ? "—" : formatDuration(last24h.averageDurationMs)} />
        </Box>

        {groups.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }} data-testid="content-studio-activity-empty">
            <Typography fontWeight={600}>Nada sendo gerado agora.</Typography>
            <Typography variant="body2" color="text.secondary">
              Quando alguém iniciar uma geração, ela aparece aqui com o andamento ao vivo.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }} data-testid="content-studio-activity-packages">
            {groups.map((group) => (
              <Paper key={group.packageId} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} noWrap>
                      {group.theme}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ m: 0 }}>
                      {group.biblicalReferences}
                    </Typography>
                  </Box>
                  <Button component={RouterLink} to={`/adm/estudio/pacotes/${group.packageId}`} size="small" sx={{ minHeight: 44, flexShrink: 0 }}>
                    Abrir
                  </Button>
                </Stack>
                <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} sx={{ mt: 1 }}>
                  {group.items.map((item) => (
                    <GenerationJobRow key={item.jobId} item={item} audienceName={audienceLabel(item.audience, audiences)} now={now} />
                  ))}
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }} data-testid="content-studio-activity-history">
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 48 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography component="h3" variant="subtitle1" fontWeight={700}>
                Últimas 24 horas
              </Typography>
              <Chip size="small" variant="outlined" label={activity.recent.length} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            {activity.recent.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma geração encerrada nas últimas 24 horas.
              </Typography>
            ) : (
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} data-testid="content-studio-activity-recent">
                {activity.recent.slice(0, 8).map((item) => (
                  <Stack key={item.jobId} direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ py: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {item.theme}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0 }}>
                        {audienceLabel(item.audience, audiences)} · {CONTENT_STAGE_TYPE_LABELS[item.stageType]}
                        {item.capability === AiGenerationCapability.IMAGE_GENERATION ? " (imagens)" : ""} ·{" "}
                        {formatContentStudioDateTime(item.updatedAt)} · {formatDuration(item.durationMs)}
                      </Typography>
                      {item.status === GenerationJobStatus.FAILED && (
                        <Typography variant="caption" color="error" component="p" sx={{ m: 0 }}>
                          {generationErrorMessage({ errorCode: item.errorCode })}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      size="small"
                      label={item.status === GenerationJobStatus.SUCCEEDED ? "Concluída" : item.status === GenerationJobStatus.FAILED ? "Falhou" : "Cancelada"}
                      color={item.status === GenerationJobStatus.SUCCEEDED ? "success" : item.status === GenerationJobStatus.FAILED ? "error" : "default"}
                      variant={item.status === GenerationJobStatus.CANCELLED ? "outlined" : "filled"}
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}
