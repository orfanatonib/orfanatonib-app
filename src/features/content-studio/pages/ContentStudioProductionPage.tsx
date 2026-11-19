import Add from "@mui/icons-material/Add";
import Inventory2 from "@mui/icons-material/Inventory2";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Skeleton, Stack, TablePagination, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { STUDIO_PAGE_SIZE as PAGE_SIZE } from "../workspace.constants";
import { useContentPackages } from "../hooks/useContentPackages";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import { displayedRowsLabel, formatMaterialsCount } from "../production.utils";
import type { ContentAudience, ContentPackageStatus } from "../types";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { PackageCard } from "../components/PackageCard";
import { PackageFormDialog } from "../components/PackageFormDialog";
import { PackagesToolbar } from "../components/PackagesToolbar";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

function PackagesSkeleton() {
  return (
    <Stack spacing={1.5} data-testid="content-studio-packages-loading">
      {[0, 1, 2].map((key) => (
        <Card key={key} variant="outlined">
          <CardContent>
            <Skeleton width="45%" height={28} />
            <Skeleton width="30%" />
            <Skeleton variant="rounded" height={8} sx={{ my: 2 }} />
            <Skeleton width="60%" />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function ContentStudioProductionPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(1);
  const [audienceFilter, setAudienceFilter] = useState<ContentAudience | "">("");
  const [statusFilter, setStatusFilter] = useState<ContentPackageStatus | "">("");

  const { catalog, loading: catalogLoading, error: catalogError, reload: reloadCatalog } = useContentStudioCatalog();

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

  // Buscar de novo volta para a primeira página.
  useEffect(() => {
    setPage(1);
  }, [search]);

  const hasFilters = !!(searchInput || audienceFilter || statusFilter);
  const clearFilters = () => {
    setSearchInput("");
    setAudienceFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <Box component="section" data-testid="content-studio-production-page" sx={CONTENT_STUDIO_PAGE_SX}>
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Materiais para visita"
          description="Produza o material de cada visita para bebês, crianças, adolescentes e adultos: gere, revise e aprove etapa por etapa."
          backTo="/adm/estudio"
          backLabel="Voltar à visão geral"
        />

        {catalogLoading && (
          <Stack data-testid="content-studio-production-loading" alignItems="center" justifyContent="center" minHeight={160} spacing={2}>
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

        {!catalogLoading && catalog && (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setCreateOpen(true)}
              data-testid="content-studio-new-material"
              sx={{ minHeight: 48, alignSelf: "flex-start" }}
            >
              Novo material para visita
            </Button>
            <PackageFormDialog
              open={createOpen}
              catalog={catalog}
              onClose={() => setCreateOpen(false)}
              onCreated={(packageId) => navigate(`/adm/estudio/pacotes/${packageId}`)}
            />
          </>
        )}

        <Card variant="outlined" data-testid="content-studio-packages-list">
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography component="h2" variant="h6" fontWeight={700}>
                  Seus materiais para visita
                </Typography>
                <Typography color="text.secondary" aria-live="polite">
                  {packagesLoading ? "Carregando…" : `${formatMaterialsCount(total)} ${hasFilters ? "com esses filtros" : ""}`.trim()}
                </Typography>
              </Box>

              <PackagesToolbar
                search={searchInput}
                status={statusFilter}
                audience={audienceFilter}
                audiences={catalog?.audiences ?? []}
                hasFilters={hasFilters}
                onSearchChange={setSearchInput}
                onStatusChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                onAudienceChange={(value) => {
                  setAudienceFilter(value);
                  setPage(1);
                }}
                onClear={clearFilters}
                onRefresh={() => void reloadPackages()}
              />

              {packagesLoading && <PackagesSkeleton />}

              {!packagesLoading && packagesError && (
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" onClick={() => void reloadPackages()} sx={{ minHeight: 44 }}>
                      Tentar novamente
                    </Button>
                  }
                >
                  Não foi possível carregar os materiais.
                </Alert>
              )}

              {!packagesLoading && !packagesError && packages.length === 0 && (
                <Stack alignItems="center" spacing={1.5} textAlign="center" sx={{ py: 4 }} data-testid="content-studio-packages-empty">
                  <Inventory2 color="disabled" sx={{ fontSize: 48 }} />
                  <Typography fontWeight={600}>
                    {hasFilters ? "Nenhum material encontrado com esses filtros." : "Você ainda não criou nenhum material para visita."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hasFilters ? "Tente outra busca ou limpe os filtros." : "Comece pelo botão Novo material para visita."}
                  </Typography>
                  {hasFilters && <Button onClick={clearFilters}>Limpar filtros</Button>}
                </Stack>
              )}

              {!packagesLoading && !packagesError && packages.length > 0 && (
                <Stack spacing={1.5}>
                  {packages.map((item) => (
                    <PackageCard key={item.id} item={item} audiences={catalog?.audiences ?? []} />
                  ))}
                </Stack>
              )}

              {total > limit && (
                <TablePagination
                  component="div"
                  count={total}
                  page={Math.max(0, page - 1)}
                  rowsPerPage={limit}
                  onPageChange={(_event, nextPage) => setPage(nextPage + 1)}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  labelRowsPerPage="Por página"
                  labelDisplayedRows={displayedRowsLabel}
                  getItemAriaLabel={(type) =>
                    ({ first: "Primeira página", last: "Última página", next: "Próxima página", previous: "Página anterior" })[type]
                  }
                />
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
