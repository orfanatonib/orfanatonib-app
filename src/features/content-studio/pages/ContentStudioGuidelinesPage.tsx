import GppGood from "@mui/icons-material/GppGood";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { CONTENT_STUDIO_SAFETY_GUIDELINES } from "../constants";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import { formatAudienceAgeRange } from "../utils";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STAGE_TYPE_LABELS } from "../constants";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

export function ContentStudioGuidelinesPage() {
  const { catalog, loading, error, reload } = useContentStudioCatalog();

  return (
    <Box
      component="section"
      data-testid="content-studio-guidelines-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Orientações editoriais"
          description="Regras obrigatórias para produzir material seguro e responsável."
          backTo="/adm/estudio"
          backLabel="Voltar à visão geral"
        />

        <Card variant="outlined" data-testid="content-studio-safety-guidelines">
          <CardContent>
            <Typography component="h2" variant="h6" fontWeight={700}>
              Segurança transversal
            </Typography>
            <List>
              {CONTENT_STUDIO_SAFETY_GUIDELINES.map((guideline) => (
                <ListItem
                  key={guideline}
                  disableGutters
                  alignItems="flex-start"
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <GppGood color="success" />
                  </ListItemIcon>
                  <ListItemText primary={guideline} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {loading && (
          <Stack
            data-testid="content-studio-guidelines-loading"
            alignItems="center"
            spacing={2}
            py={6}
          >
            <CircularProgress />
            <Typography color="text.secondary">Carregando catálogo…</Typography>
          </Stack>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            data-testid="content-studio-guidelines-error"
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
            Não foi possível carregar as faixas editoriais.
          </Alert>
        )}

        {!loading && catalog && (
          <Box
            data-testid="content-studio-guidelines-audiences"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            {catalog.audiences.map((audience) => (
              <Card key={audience.audience} variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6" fontWeight={700}>
                    {audience.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {formatAudienceAgeRange(audience)}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`${audience.stages.filter((stage) => stage.required).length} obrigatórias`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${audience.stages.filter((stage) => !stage.required).length} opcionais`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <List dense disablePadding sx={{ mt: 1 }}>
                    {audience.stages.map((stage) => (
                      <ListItem
                        key={stage.type}
                        disableGutters
                        secondaryAction={
                          <Chip
                            label={stage.required ? "Obrigatória" : "Opcional"}
                            size="small"
                            variant="outlined"
                          />
                        }
                      >
                        <ListItemText
                          primary={`${stage.position}. ${CONTENT_STAGE_TYPE_LABELS[stage.type]}`}
                          secondary={
                            stage.dependencies.length
                              ? `Depende de: ${stage.dependencies.map((dependency) => CONTENT_STAGE_TYPE_LABELS[dependency]).join(", ")}`
                              : "Sem dependências"
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
