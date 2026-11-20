import CheckCircle from "@mui/icons-material/CheckCircle";
import EditNote from "@mui/icons-material/EditNote";
import Inventory2 from "@mui/icons-material/Inventory2";
import RateReview from "@mui/icons-material/RateReview";
import TaskAlt from "@mui/icons-material/TaskAlt";
import { Box, Card, CardActionArea, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

import type { ContentStudioDashboardResponse } from "../types";

interface MetricDefinition {
  key: string;
  testId: string;
  label: string;
  hint: string;
  icon: SvgIconComponent;
  color: "primary" | "warning" | "info" | "success" | "secondary";
  value: (dashboard: ContentStudioDashboardResponse) => number;
  to?: string;
}

const METRICS: readonly MetricDefinition[] = [
  { key: "total", testId: "total", label: "Total de materiais", hint: "Todos os criados no período", icon: Inventory2, color: "secondary", value: (d) => d.packages.total },
  { key: "production", testId: "production", label: "Em produção", hint: "Sendo escritos e gerados", icon: EditNote, color: "primary", value: (d) => d.packages.inProduction, to: "/adm/estudio/producao" },
  { key: "review", testId: "review", label: "Em revisão", hint: "Aguardando decisão editorial", icon: RateReview, color: "info", value: (d) => d.packages.awaitingReview, to: "/adm/estudio/revisao" },
  { key: "ready", testId: "ready", label: "Prontos para publicar", hint: "Aprovados em todas as etapas", icon: TaskAlt, color: "warning", value: (d) => d.packages.readyForPublication },
  { key: "published", testId: "published", label: "Publicados", hint: "Já liberados para uso", icon: CheckCircle, color: "success", value: (d) => d.packages.publishedTotal },
];

function MetricBody({ metric, value }: { metric: MetricDefinition; value: number }) {
  const Icon = metric.icon;
  return (
    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
      <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: { xs: 36, sm: 44 },
            height: { xs: 36, sm: 44 },
            borderRadius: 2,
            color: `${metric.color}.main`,
            bgcolor: (theme) => `${theme.palette[metric.color].main}1A`,
            flexShrink: 0,
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} lineHeight={1.1} sx={{ fontSize: { sm: "2.125rem" } }}>
            {value}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.25 }}>
            {metric.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            {metric.hint}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  );
}

const GRID_SX = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
  gap: { xs: 1, sm: 2 },
  // Em 2 colunas sobra um cartão: o último ocupa a linha toda.
  "& > :last-child": { gridColumn: { xs: "1 / -1", md: "auto" } },
} as const;

export function DashboardMetricsSkeleton() {
  return (
    <Box sx={GRID_SX} data-testid="content-studio-dashboard-metrics-skeleton">
      {METRICS.map((metric) => (
        <Card key={metric.key} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Skeleton variant="rounded" width={44} height={44} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" height={36} />
                <Skeleton width="80%" />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export function DashboardMetrics({ dashboard }: { dashboard: ContentStudioDashboardResponse }) {
  return (
    <Box sx={GRID_SX} data-testid="content-studio-dashboard-metrics">
      {METRICS.map((metric) => (
        <Card key={metric.key} variant="outlined" data-testid={`content-studio-dashboard-metric-${metric.testId}`}>
          {metric.to ? (
            <CardActionArea component={RouterLink} to={metric.to} aria-label={`${metric.label}: abrir`}>
              <MetricBody metric={metric} value={metric.value(dashboard)} />
            </CardActionArea>
          ) : (
            <MetricBody metric={metric} value={metric.value(dashboard)} />
          )}
        </Card>
      ))}
    </Box>
  );
}
