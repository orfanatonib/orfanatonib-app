import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import NetworkCheck from "@mui/icons-material/NetworkCheck";

import { AI_PROVIDER_LABELS, AI_USAGE_DEFAULT_DAYS, AI_USAGE_PERIOD_OPTIONS } from "./constants";
import { formatCount, formatDuration, healthSeverity } from "./diagnostics.utils";
import { useAiUsage, useCheckProviderHealth } from "./hooks";
import type { LlmProviderType } from "./types";

interface ProviderDiagnosticsPanelProps {
  provider: LlmProviderType;
  /** Há alterações não salvas: o teste usa a chave SALVA, então avisamos. */
  hasUnsavedChanges: boolean;
}

/** Testar conexão (chave salva + modelos escolhidos) e uso de IA do Estúdio no período. */
export const ProviderDiagnosticsPanel: React.FC<ProviderDiagnosticsPanelProps> = ({ provider, hasUnsavedChanges }) => {
  const [days, setDays] = useState<number>(AI_USAGE_DEFAULT_DAYS);
  const health = useCheckProviderHealth();
  const usage = useAiUsage(days);
  const label = AI_PROVIDER_LABELS[provider];

  return (
    <Paper data-testid="ai-providers-diagnostics" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
          <Box>
            <Typography fontWeight={800}>Testar conexão</Typography>
            <Typography variant="body2" color="text.secondary">
              Confere se a chave salva de {label} é aceita e se os modelos escolhidos existem.
            </Typography>
          </Box>
          <Button
            data-testid="ai-providers-health-button"
            variant="outlined"
            startIcon={health.isPending ? <CircularProgress size={18} color="inherit" /> : <NetworkCheck />}
            disabled={health.isPending}
            onClick={() => health.mutate(provider)}
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}
          >
            {health.isPending ? "Testando..." : `Testar ${label}`}
          </Button>
        </Stack>

        {hasUnsavedChanges && (
          <Alert severity="info" data-testid="ai-providers-health-unsaved">
            O teste usa o que está salvo. Salve antes para testar a chave e os modelos que você acabou de alterar.
          </Alert>
        )}
        {health.isError && (
          <Alert severity="error" data-testid="ai-providers-health-error">
            Não foi possível executar o teste agora. Tente novamente.
          </Alert>
        )}
        {health.data && (
          <Alert data-testid="ai-providers-health-result" data-health-status={health.data.status} severity={healthSeverity(health.data)}>
            {health.data.message} ({formatDuration(health.data.durationMs)})
          </Alert>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography fontWeight={800}>Uso de IA no Estúdio</Typography>
          <TextField
            select
            size="small"
            label="Período"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            sx={{ minWidth: 130, "&& .MuiSelect-select": { minHeight: 44, boxSizing: "border-box", display: "flex", alignItems: "center" } }}
            slotProps={{ htmlInput: { "data-testid": "ai-providers-usage-period" } }}
          >
            {AI_USAGE_PERIOD_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                Últimos {option} dias
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {usage.isLoading && <CircularProgress size={22} aria-label="Carregando uso" />}
        {usage.isError && (
          <Alert severity="warning" data-testid="ai-providers-usage-error">
            Não foi possível carregar o uso agora.
          </Alert>
        )}
        {usage.data && usage.data.generations === 0 && (
          <Typography data-testid="ai-providers-usage-empty" variant="body2" color="text.secondary">
            Nenhuma geração com IA nos últimos {usage.data.days} dias.
          </Typography>
        )}
        {usage.data && usage.data.generations > 0 && (
          <Stack spacing={1} data-testid="ai-providers-usage-list">
            <Typography variant="body2" color="text.secondary">
              {formatCount(usage.data.generations)} gerações · {formatCount(usage.data.totalTokens)} tokens
            </Typography>
            {usage.data.byModel.map((item) => (
              <Box key={`${item.provider}-${item.model}`} data-testid="ai-providers-usage-item" sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
                <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
                  {item.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.provider} · {formatCount(item.generations)} gerações · {formatCount(item.totalTokens)} tokens (entrada {formatCount(item.inputTokens)}, saída {formatCount(item.outputTokens)})
                  · média {formatDuration(item.averageDurationMs)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
