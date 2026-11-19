import ArrowBack from "@mui/icons-material/ArrowBack";
import Add from "@mui/icons-material/Add";
import Settings from "@mui/icons-material/Settings";
import { Alert, Box, Button, CircularProgress, Grid2, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import { ListingLayout, ListingToolbar } from "@/components/common/listing";
import type { ListingFilter } from "@/components/common/listing";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/utils/apiError";

import { archiveContentPackage, downloadExport, exportPath } from "../api";
import { PackageArchiveDialog } from "../components/PackageArchiveDialog";
import { PackageCard } from "../components/PackageCard";
import { PackageFormDialog } from "../components/PackageFormDialog";
import { useContentPackages } from "../hooks/useContentPackages";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import { exportFileName } from "../export.utils";
import {
  PRODUCTION_DEFAULT_PAGE_SIZE,
  PRODUCTION_DEFAULT_SORT,
  PRODUCTION_LIST_TEXTS,
  PRODUCTION_PAGE_SIZE_OPTIONS,
  PRODUCTION_SEARCH_DEBOUNCE_MS,
  PRODUCTION_SORT_OPTIONS,
  PRODUCTION_STATUS_FILTER_OPTIONS,
} from "../production-list.constants";
import { productionQuery, readProductionListState, writeProductionListState, type ProductionListState } from "../production-list.utils";
import { formatMaterialsCount } from "../production.utils";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";
import { ContentAudience, ContentPackageStatus, ExportFormat, type ContentPackageListItemResponse } from "../types";

/**
 * Produção de materiais para visita (`/adm/estudio/producao`).
 *
 * Filtros, busca, ordem e página moram na URL: voltar de um material devolve a lista como estava.
 * Sem filtro de situação, os arquivados ficam de fora.
 */
export function ContentStudioProductionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readProductionListState(searchParams), [searchParams]);

  const [createOpen, setCreateOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PRODUCTION_DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState(state.search);
  const [feedbackError, setFeedbackError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ContentPackageListItemResponse | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const patch = useCallback(
    (changes: Partial<ProductionListState>) =>
      setSearchParams((current) => writeProductionListState(current, { ...readProductionListState(current), ...changes }), { replace: true }),
    [setSearchParams],
  );

  // A busca digitada chega à URL já com a espera, e volta para a página 1.
  const debouncedSearch = useDebouncedValue(search, PRODUCTION_SEARCH_DEBOUNCE_MS);
  useEffect(() => {
    if (debouncedSearch.trim() !== state.search) patch({ search: debouncedSearch, page: 1 });
    // `state.search` só é lido para comparar; reagir a ele desfaria a digitação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, patch]);

  const { catalog, loading: catalogLoading, error: catalogError, reload: reloadCatalog } = useContentStudioCatalog();
  const query = useMemo(() => productionQuery(state, pageSize), [state, pageSize]);
  const { packages, total, loading, error, reload } = useContentPackages(query);
  const audiences = catalog?.audiences ?? [];

  const handleDownload = async (item: ContentPackageListItemResponse) => {
    if (downloadingId) return;
    setDownloadingId(item.id);
    setFeedbackError("");
    try {
      await downloadExport(item.id, exportPath.all(ExportFormat.PDF), exportFileName([item.theme, "completo"], ExportFormat.PDF));
    } catch {
      setFeedbackError("Não foi possível baixar o PDF agora. Confira se alguma etapa já tem conteúdo salvo.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveContentPackage(archiveTarget.id);
      setArchiveTarget(null);
      void reload();
    } catch (failure: unknown) {
      setArchiveError(getErrorMessage(failure, "Não foi possível arquivar o material."));
    } finally {
      setArchiving(false);
    }
  };

  const filters: ListingFilter[] = [
    {
      id: "status",
      label: "Situação",
      value: state.status,
      options: PRODUCTION_STATUS_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
      onChange: (value) => patch({ status: (value as ContentPackageStatus | "") || "", page: 1 }),
    },
    {
      id: "audience",
      label: "Faixa etária",
      value: state.audience,
      options: audiences.map((item) => ({ value: item.audience, label: item.name })),
      onChange: (value) => patch({ audience: (value as ContentAudience | "") || "", page: 1 }),
    },
    {
      id: "sort",
      label: "Ordenar por",
      value: state.sort,
      options: PRODUCTION_SORT_OPTIONS.map(({ value, label }) => ({ value, label })),
      onChange: (value) => patch({ sort: value || PRODUCTION_DEFAULT_SORT, page: 1 }),
    },
  ];

  const clearFilters = () => {
    setSearch("");
    patch({ status: "", audience: "", sort: PRODUCTION_DEFAULT_SORT, search: "", page: 1 });
  };

  return (
    <Box component="section" data-testid="content-studio-production-page" sx={CONTENT_STUDIO_PAGE_SX}>
      <Stack spacing={2}>
        <Button component={RouterLink} to="/adm/estudio" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start", minHeight: 44, fontWeight: 700, textTransform: "none" }}>
          Voltar à visão geral
        </Button>

        {catalogLoading && (
          <Stack data-testid="content-studio-production-loading" alignItems="center" justifyContent="center" minHeight={120} spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Carregando catálogo editorial…</Typography>
          </Stack>
        )}
        {!catalogLoading && catalogError && (
          <Alert
            severity="error"
            data-testid="content-studio-production-error"
            action={
              <Button color="inherit" onClick={() => void reloadCatalog()} sx={{ minHeight: 44 }}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar o catálogo do Estúdio.
          </Alert>
        )}

        <ListingLayout
          data-testid="content-studio-packages-list"
          title={PRODUCTION_LIST_TEXTS.title}
          summary={`${formatMaterialsCount(total)} ${state.status ? "nesta situação" : "no estúdio (arquivados à parte)"}`}
          toolbar={
            <Stack gap={1.5}>
              {/* As ações ficam fora da barra de filtros: junto delas a busca ficava estreita. */}
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => navigate("/adm/estudio/orientacoes")}
                  sx={{ minHeight: 44, borderRadius: 2.5, fontWeight: 600, textTransform: "none" }}
                >
                  Orientações
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!catalog}
                  onClick={() => setCreateOpen(true)}
                  data-testid="content-studio-new-material"
                  sx={{ minHeight: 44, borderRadius: 2.5, fontWeight: 700, textTransform: "none" }}
                >
                  Novo material para visita
                </Button>
              </Stack>
              <ListingToolbar
                searchValue={search}
                searchPlaceholder={PRODUCTION_LIST_TEXTS.searchPlaceholder}
                onSearchChange={setSearch}
                filters={filters}
                onRefresh={() => void reload()}
                onClearFilters={clearFilters}
              />
            </Stack>
          }
          loading={loading}
          error={feedbackError || (error ? "Erro ao carregar os materiais." : undefined)}
          onDismissError={() => setFeedbackError("")}
          itemCount={packages.length}
          emptyTitle={PRODUCTION_LIST_TEXTS.emptyTitle}
          emptySubtitle={PRODUCTION_LIST_TEXTS.emptySubtitle}
          pagination={{
            page: state.page,
            pageSize,
            total,
            onPageChange: (page) => patch({ page }),
            onPageSizeChange: (size) => {
              setPageSize(size);
              patch({ page: 1 });
            },
          }}
          pageSizeOptions={PRODUCTION_PAGE_SIZE_OPTIONS}
          overlays={
            <>
              {catalog && (
                <PackageFormDialog
                  open={createOpen}
                  catalog={catalog}
                  onClose={() => setCreateOpen(false)}
                  onCreated={(packageId) => navigate(`/adm/estudio/pacotes/${packageId}`)}
                />
              )}
              <PackageArchiveDialog
                item={archiveTarget}
                pending={archiving}
                error={archiveError}
                onCancel={() => setArchiveTarget(null)}
                onConfirm={() => void handleArchiveConfirm()}
              />
            </>
          }
        >
          {packages.map((item) => (
            <Grid2 key={item.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <PackageCard
                item={item}
                audiences={audiences}
                downloadingId={downloadingId}
                onOpen={(packageId) => navigate(`/adm/estudio/pacotes/${packageId}`)}
                onDownload={(target) => void handleDownload(target)}
                onArchive={(target) => {
                  setArchiveError(null);
                  setArchiveTarget(target);
                }}
              />
            </Grid2>
          ))}
        </ListingLayout>
      </Stack>
    </Box>
  );
}
