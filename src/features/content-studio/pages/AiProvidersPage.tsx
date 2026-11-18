import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import { useAiProviders } from "../hooks/useAiProviders";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";
import { AiGenerationCapability, AiProvider, AiProviderHealth } from "../types";

const PROVIDER_LABELS: Record<AiProvider, string> = {
  [AiProvider.OPENAI]: "OpenAI",
  [AiProvider.GEMINI]: "Google Gemini",
};

const HEALTH_LABELS: Record<AiProviderHealth, string> = {
  [AiProviderHealth.HEALTHY]: "Saudável",
  [AiProviderHealth.DEGRADED]: "Instável",
  [AiProviderHealth.UNAVAILABLE]: "Indisponível",
  [AiProviderHealth.UNKNOWN]: "Não verificada",
};

const CAPABILITY_LABELS: Record<AiGenerationCapability, string> = {
  [AiGenerationCapability.TEXT_STRUCTURED]: "Texto estruturado",
  [AiGenerationCapability.IMAGE_GENERATION]: "Geração de imagem",
};

export function AiProvidersPage() {
  const { providers, loading, error, reload } = useAiProviders();

  return (
    <Box
      component="section"
      data-testid="content-studio-ai-providers-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Provedores de IA"
          description="Visão segura da configuração aplicada pelo ambiente de execução."
          backTo="/adm/estudio"
          backLabel="Voltar à visão geral"
        />

        <Alert severity="info" data-testid="content-studio-ai-providers-policy">
          Credenciais e valores secretos nunca são enviados ao navegador.
          Alterações são feitas pelo processo seguro de deploy.
        </Alert>

        {loading && (
          <Stack
            data-testid="content-studio-ai-providers-loading"
            alignItems="center"
            justifyContent="center"
            minHeight={200}
            spacing={2}
          >
            <CircularProgress />
            <Typography color="text.secondary">
              Carregando provedores…
            </Typography>
          </Stack>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            data-testid="content-studio-ai-providers-error"
            action={
              <Button
                color="inherit"
                onClick={() => void reload()}
                sx={{ minHeight: 44 }}
              >
                Tentar novamente
              </Button>
            }
          >
            Não foi possível consultar os provedores.
          </Alert>
        )}

        {!loading && !error && (
          <Box
            data-testid="content-studio-ai-providers-list"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            {providers.map((provider) => (
              <Card key={provider.provider} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography component="h2" variant="h6" fontWeight={700}>
                        {PROVIDER_LABELS[provider.provider]}
                      </Typography>
                      <Chip
                        color={provider.enabled ? "success" : "default"}
                        label={provider.enabled ? "Habilitado" : "Desabilitado"}
                        size="small"
                      />
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        color={
                          provider.credentialConfigured ? "success" : "warning"
                        }
                        label={
                          provider.credentialConfigured
                            ? "Credencial configurada"
                            : "Credencial ausente"
                        }
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        color={
                          provider.health === AiProviderHealth.HEALTHY
                            ? "success"
                            : provider.health === AiProviderHealth.UNAVAILABLE
                              ? "error"
                              : "default"
                        }
                        label={`Saúde: ${HEALTH_LABELS[provider.health]}`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Modelos e capacidades
                      </Typography>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {provider.models.length === 0 ? (
                          <Chip
                            label="Nenhum modelo"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          provider.models.map((model) => (
                            <Box key={model.id} sx={{ width: "100%" }}>
                              <Typography variant="body2" fontWeight={600}>
                                {model.id}
                              </Typography>
                              <Stack
                                direction="row"
                                gap={0.75}
                                flexWrap="wrap"
                                mt={0.75}
                              >
                                {model.capabilities.map((capability) => (
                                  <Chip
                                    key={capability}
                                    label={CAPABILITY_LABELS[capability]}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                            </Box>
                          ))
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
