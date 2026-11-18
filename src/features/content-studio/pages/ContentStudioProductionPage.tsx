import Add from "@mui/icons-material/Add";
import Refresh from "@mui/icons-material/Refresh";
import Visibility from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormHelperText,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { createContentPackage } from "../api";
import {
  CONTENT_PACKAGE_STATUS_LABELS,
  CONTENT_STAGE_TYPE_LABELS,
} from "../constants";
import { useContentPackages } from "../hooks/useContentPackages";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import type { CreateContentPackagePayload } from "../types";
import { formatAudienceAgeRange, formatContentStudioDateTime } from "../utils";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

const PAGE_SIZE = 10;

const EMPTY_FORM: CreateContentPackagePayload = {
  theme: "",
  biblicalReferences: "",
  canonicalObjective: "",
  canonicalNotes: "",
};

export function ContentStudioProductionPage() {
  const navigate = useNavigate();
  const {
    catalog,
    loading: catalogLoading,
    error: catalogError,
    reload: reloadCatalog,
  } = useContentStudioCatalog();
  const [form, setForm] = useState<CreateContentPackagePayload>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const packagesQuery = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
    }),
    [page, search],
  );

  const {
    packages,
    total,
    limit,
    loading: packagesLoading,
    error: packagesError,
    reload: reloadPackages,
  } = useContentPackages(packagesQuery);

  const handleFieldChange =
    (field: keyof CreateContentPackagePayload) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    const payload: CreateContentPackagePayload = {
      theme: form.theme.trim(),
      biblicalReferences: form.biblicalReferences.trim(),
      canonicalObjective: form.canonicalObjective.trim(),
      canonicalNotes: form.canonicalNotes?.trim() || null,
    };

    if (
      !payload.theme ||
      !payload.biblicalReferences ||
      !payload.canonicalObjective
    ) {
      setSubmitError(
        "Preencha tema, referências bíblicas e objetivo canônico.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createContentPackage(payload);
      setForm(EMPTY_FORM);
      navigate(`/adm/estudio/pacotes/${created.id}`);
    } catch {
      setSubmitError("Não foi possível criar o pacote agora.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const resetSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <Box
      component="section"
      data-testid="content-studio-production-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Produção"
          description="Crie pacotes multifaixa e acompanhe a estrutura editorial persistida."
          backTo="/adm/estudio"
          backLabel="Voltar à visão geral"
        />

        {catalogLoading && (
          <Stack
            data-testid="content-studio-production-loading"
            alignItems="center"
            justifyContent="center"
            minHeight={160}
            spacing={2}
          >
            <CircularProgress />
            <Typography color="text.secondary">
              Carregando catálogo editorial…
            </Typography>
          </Stack>
        )}

        {!catalogLoading && catalogError && (
          <Alert
            severity="error"
            data-testid="content-studio-production-error"
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
            Não foi possível carregar o catálogo do Estúdio.
          </Alert>
        )}

        {!catalogLoading && catalog && (
          <>
            <Alert
              severity="info"
              data-testid="content-studio-production-catalog-status"
            >
              Catálogo {catalog.version}. Cada pacote cria bebê, criança,
              adolescente e adulto.
            </Alert>

            <Card
              variant="outlined"
              component="form"
              onSubmit={handleCreate}
              data-testid="content-studio-package-form"
            >
              <CardContent>
                <Stack spacing={2}>
                  <Typography component="h2" variant="h6" fontWeight={700}>
                    Novo pacote
                  </Typography>
                  {submitError && <Alert severity="error">{submitError}</Alert>}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Tema"
                      value={form.theme}
                      onChange={handleFieldChange("theme")}
                      inputProps={{
                        maxLength: 180,
                        "data-testid": "content-studio-theme-input",
                      }}
                      required
                    />
                    <TextField
                      label="Referências bíblicas"
                      value={form.biblicalReferences}
                      onChange={handleFieldChange("biblicalReferences")}
                      inputProps={{
                        maxLength: 500,
                        "data-testid": "content-studio-references-input",
                      }}
                      required
                    />
                  </Box>
                  <TextField
                    label="Objetivo canônico"
                    value={form.canonicalObjective}
                    onChange={handleFieldChange("canonicalObjective")}
                    inputProps={{
                      "data-testid": "content-studio-objective-input",
                    }}
                    multiline
                    minRows={3}
                    required
                  />
                  <TextField
                    label="Notas canônicas"
                    value={form.canonicalNotes ?? ""}
                    onChange={handleFieldChange("canonicalNotes")}
                    inputProps={{ "data-testid": "content-studio-notes-input" }}
                    multiline
                    minRows={2}
                  />
                  <FormHelperText>
                    Não inclua nomes, contatos, históricos ou outros dados
                    pessoais de pessoas acolhidas.
                  </FormHelperText>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        submitting ? (
                          <CircularProgress color="inherit" size={18} />
                        ) : (
                          <Add />
                        )
                      }
                      disabled={submitting}
                      data-testid="content-studio-create-package"
                      sx={{ minHeight: 44 }}
                    >
                      Criar pacote
                    </Button>
                    {!catalog.capabilities.generation && (
                      <Typography color="text.secondary" variant="body2">
                        Você pode criar e editar pacotes manualmente; a geração
                        por IA está desabilitada.
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Box
              data-testid="content-studio-production-audiences"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {catalog.audiences.map((audience) => (
                <Card key={audience.audience} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography
                          component="h2"
                          variant="h6"
                          fontWeight={700}
                        >
                          {audience.name}
                        </Typography>
                        <Typography color="text.secondary">
                          {formatAudienceAgeRange(audience)}
                        </Typography>
                      </Box>
                      <Stack spacing={1}>
                        {audience.stages.map((stage) => (
                          <Stack
                            key={stage.type}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Typography>
                              {stage.position}.{" "}
                              {CONTENT_STAGE_TYPE_LABELS[stage.type]}
                            </Typography>
                            <Chip
                              label={
                                stage.required ? "Obrigatória" : "Opcional"
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}

        <Card variant="outlined" data-testid="content-studio-packages-list">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography component="h2" variant="h6" fontWeight={700}>
                    Pacotes criados
                  </Typography>
                  <Typography color="text.secondary">
                    {total} pacote{total === 1 ? "" : "s"} encontrado
                    {total === 1 ? "" : "s"}.
                  </Typography>
                </Box>
                <Stack
                  component="form"
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  onSubmit={handleSearch}
                >
                  <TextField
                    size="small"
                    label="Buscar"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    inputProps={{
                      "data-testid": "content-studio-package-search",
                    }}
                  />
                  <Button
                    type="submit"
                    variant="outlined"
                    sx={{ minHeight: 44 }}
                  >
                    Buscar
                  </Button>
                  <Button onClick={resetSearch} sx={{ minHeight: 44 }}>
                    Limpar
                  </Button>
                  <Button
                    onClick={() => void reloadPackages()}
                    startIcon={<Refresh />}
                    sx={{ minHeight: 44 }}
                  >
                    Atualizar
                  </Button>
                </Stack>
              </Stack>

              {packagesLoading && (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  minHeight={120}
                  spacing={2}
                >
                  <CircularProgress />
                  <Typography color="text.secondary">
                    Carregando pacotes…
                  </Typography>
                </Stack>
              )}

              {!packagesLoading && packagesError && (
                <Alert severity="error">
                  Não foi possível carregar os pacotes.
                </Alert>
              )}

              {!packagesLoading && !packagesError && packages.length === 0 && (
                <Alert
                  severity="info"
                  data-testid="content-studio-packages-empty"
                >
                  Nenhum pacote criado ainda.
                </Alert>
              )}

              {!packagesLoading && !packagesError && packages.length > 0 && (
                <Stack spacing={1.5}>
                  {packages.map((contentPackage) => (
                    <Card key={contentPackage.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box>
                              <Typography
                                component="h3"
                                variant="subtitle1"
                                fontWeight={700}
                              >
                                {contentPackage.theme}
                              </Typography>
                              <Typography color="text.secondary">
                                {contentPackage.biblicalReferences}
                              </Typography>
                            </Box>
                            <Chip
                              label={
                                CONTENT_PACKAGE_STATUS_LABELS[
                                  contentPackage.status
                                ]
                              }
                            />
                          </Stack>
                          <Typography color="text.secondary" variant="body2">
                            {contentPackage.tracksCount} faixas,{" "}
                            {contentPackage.stagesCount} etapas,{" "}
                            {contentPackage.approvedStagesCount} aprovadas.
                            Criado em{" "}
                            {formatContentStudioDateTime(
                              contentPackage.createdAt,
                            )}
                            .
                          </Typography>
                          <Button
                            component={RouterLink}
                            to={`/adm/estudio/pacotes/${contentPackage.id}`}
                            startIcon={<Visibility />}
                            sx={{ alignSelf: "flex-start", minHeight: 44 }}
                            data-testid={`content-studio-package-${contentPackage.id}`}
                          >
                            Abrir pacote
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              <TablePagination
                component="div"
                count={total}
                page={Math.max(0, page - 1)}
                rowsPerPage={limit}
                onPageChange={(_event, nextPage) => setPage(nextPage + 1)}
                rowsPerPageOptions={[PAGE_SIZE]}
                labelRowsPerPage="Itens por página"
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
