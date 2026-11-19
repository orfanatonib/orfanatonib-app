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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  STUDIO_PAGE_SIZE as PAGE_SIZE,
  EMPTY_STUDIO_FORM as EMPTY_FORM,
} from "../workspace.constants";
import { CONTENT_PACKAGE_STATUS_LABELS } from "../constants";
import { useContentPackages } from "../hooks/useContentPackages";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import {
  ContentAudience,
  ContentPackageStatus,
  type CreateContentPackagePayload,
} from "../types";
import { formatAudienceAgeRange, formatContentStudioDateTime } from "../utils";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

export function ContentStudioProductionPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
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
  const [audienceFilter, setAudienceFilter] = useState<ContentAudience | "">(
    "",
  );
  const [statusFilter, setStatusFilter] = useState<ContentPackageStatus | "">(
    "",
  );

  const packagesQuery = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      audience: audienceFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, search, audienceFilter, statusFilter],
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
      audience: form.audience,
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
    setAudienceFilter("");
    setStatusFilter("");
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
          description="Crie materiais para baby, crianças, adolescentes e adultos."
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
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateOpen(true)}
              data-testid="content-studio-new-material"
              sx={{ minHeight: 44, alignSelf: "flex-start" }}
            >
              Novo material
            </Button>
            <Dialog
              open={createOpen}
              onClose={() => {
                if (!submitting) setCreateOpen(false);
              }}
              fullWidth
              maxWidth="md"
              data-testid="content-studio-create-dialog"
            >
              <DialogTitle>Novo material</DialogTitle>
              <DialogContent>
                <Card
                  variant="outlined"
                  component="form"
                  onSubmit={handleCreate}
                  data-testid="content-studio-package-form"
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography component="h2" variant="h6" fontWeight={700}>
                        Prepare o encontro
                      </Typography>
                      {submitError && (
                        <Alert severity="error">{submitError}</Alert>
                      )}
                      <TextField
                        select
                        label="Categoria"
                        value={form.audience}
                        onChange={handleFieldChange("audience")}
                        data-testid="content-studio-create-audience"
                      >
                        {catalog.audiences.map((audience) => (
                          <MenuItem
                            key={audience.audience}
                            value={audience.audience}
                          >
                            {audience.name} · {formatAudienceAgeRange(audience)}
                          </MenuItem>
                        ))}
                      </TextField>
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
                        label="Objetivo do encontro"
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
                        label="Orientações adicionais"
                        value={form.canonicalNotes ?? ""}
                        onChange={handleFieldChange("canonicalNotes")}
                        inputProps={{
                          "data-testid": "content-studio-notes-input",
                        }}
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
                          Criar material
                        </Button>
                        {!catalog.capabilities.generation && (
                          <Typography color="text.secondary" variant="body2">
                            Você pode criar e editar pacotes manualmente; a
                            geração por IA está desabilitada.
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </DialogContent>
              <DialogActions>
                <Button
                  disabled={submitting}
                  onClick={() => setCreateOpen(false)}
                  sx={{ minHeight: 44 }}
                >
                  Cancelar
                </Button>
              </DialogActions>
            </Dialog>
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
                    Seus materiais
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

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                data-testid="content-studio-production-filters"
              >
                <TextField
                  select
                  label="Categoria"
                  value={audienceFilter}
                  sx={{ minWidth: 180 }}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAudienceFilter(
                      Object.values(ContentAudience).find(
                        (item) => item === value,
                      ) ?? "",
                    );
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Todas as categorias</MenuItem>
                  {catalog?.audiences.map((item) => (
                    <MenuItem key={item.audience} value={item.audience}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Situação"
                  value={statusFilter}
                  sx={{ minWidth: 180 }}
                  onChange={(event) => {
                    const value = event.target.value;
                    setStatusFilter(
                      Object.values(ContentPackageStatus).find(
                        (item) => item === value,
                      ) ?? "",
                    );
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Todas as situações</MenuItem>
                  {Object.values(ContentPackageStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {CONTENT_PACKAGE_STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </TextField>
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
                  Você ainda não criou nenhum material. Comece em Novo material.
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
                            Continuar produção
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
