import ExpandMore from "@mui/icons-material/ExpandMore";
import FactCheck from "@mui/icons-material/FactCheck";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Grid2, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ListingLayout, ListingToolbar } from "@/components/common/listing";
import type { ListingFilter } from "@/components/common/listing";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { ReviewPackageCard } from "../components/ReviewPackageCard";
import { CONTENT_STUDIO_REVIEW_CHECKLIST } from "../constants";
import { useContentPackages } from "../hooks/useContentPackages";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import { useContentStudioDashboard } from "../hooks/useContentStudioDashboard";
import { PRODUCTION_SEARCH_DEBOUNCE_MS } from "../production-list.constants";
import { REVIEW_DEFAULT_PAGE_SIZE, REVIEW_EMPTY_TEXTS, REVIEW_PAGE_SIZE_OPTIONS, REVIEW_QUEUE_VIEWS, REVIEW_TEXTS } from "../review-list.constants";
import { formatMaterialsCount } from "../production.utils";
import { readReviewListState, reviewQueueCounts, reviewViewStatuses, writeReviewListState, type ReviewListState } from "../review-list.utils";
import type { ContentAudience } from "../types";

/**
 * Fila de revisão (`/adm/estudio/revisao`).
 *
 * A fila é dividida em recortes — o que espera o revisor, o que está pronto para publicar, o que voltou à produção
 * e o que já saiu — cada um com a sua contagem. Recorte, faixa, busca e página moram na URL.
 */
export function ContentStudioReviewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readReviewListState(searchParams), [searchParams]);
  const [pageSize, setPageSize] = useState(REVIEW_DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState(state.search);

  const patch = useCallback(
    (changes: Partial<ReviewListState>) => setSearchParams((current) => writeReviewListState(current, { ...readReviewListState(current), ...changes }), { replace: true }),
    [setSearchParams],
  );

  const debouncedSearch = useDebouncedValue(search, PRODUCTION_SEARCH_DEBOUNCE_MS);
  useEffect(() => {
    if (debouncedSearch.trim() !== state.search) patch({ search: debouncedSearch, page: 1 });
    // `state.search` só é lido para comparar; reagir a ele desfaria a digitação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, patch]);

  const { catalog } = useContentStudioCatalog();
  const audiences = catalog?.audiences ?? [];
  const dashboard = useContentStudioDashboard();
  const counts = useMemo(() => reviewQueueCounts(dashboard.dashboard?.packages.byStatus), [dashboard.dashboard]);

  const query = useMemo(
    () => ({
      page: state.page,
      limit: pageSize,
      statuses: reviewViewStatuses(state.view),
      audience: state.audience || undefined,
      search: state.search.trim() || undefined,
      sort: "updatedAt" as const,
      order: "DESC" as const,
    }),
    [state, pageSize],
  );
  const { packages, total, loading, error, reload } = useContentPackages(query);

  const filters: ListingFilter[] = [
    {
      id: "audience",
      label: "Faixa etária",
      value: state.audience,
      options: audiences.map((item) => ({ value: item.audience, label: item.name })),
      onChange: (value) => patch({ audience: (value as ContentAudience | "") || "", page: 1 }),
    },
  ];

  return (
    <Box component="section" data-testid="content-studio-review-page">
      <Stack spacing={2}>
        <ListingLayout
          hideTitle
          embedded
          data-testid="content-studio-review-queue"
          title={REVIEW_TEXTS.listTitle}
          summary={`${formatMaterialsCount(total)} neste recorte`}
          toolbar={
            <Stack gap={1.5}>
              <Stack direction="row" flexWrap="wrap" gap={1} role="tablist" aria-label="Recortes da fila de revisão" data-testid="content-studio-review-views">
                {REVIEW_QUEUE_VIEWS.map((item) => {
                  const selected = item.view === state.view;
                  const count = counts[item.view];
                  const highlight = Boolean(item.urgent) && count > 0;
                  return (
                    <Chip
                      key={item.view}
                      role="tab"
                      aria-selected={selected}
                      data-testid={`content-studio-review-view-${item.view}`}
                      label={dashboard.dashboard ? `${item.label} · ${count}` : item.label}
                      color={selected ? "primary" : highlight ? "warning" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      onClick={() => patch({ view: item.view, page: 1 })}
                      sx={{ fontWeight: 700, minHeight: { xs: 44, sm: 36 }, borderRadius: 2 }}
                    />
                  );
                })}
              </Stack>
              <ListingToolbar
                searchValue={search}
                searchPlaceholder={REVIEW_TEXTS.searchPlaceholder}
                onSearchChange={setSearch}
                filters={filters}
                onRefresh={() => {
                  void reload();
                  void dashboard.reload();
                }}
                onClearFilters={() => {
                  setSearch("");
                  patch({ audience: "", search: "", page: 1 });
                }}
                action={
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesome />}
                    onClick={() => navigate("/adm/estudio/producao")}
                    sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: "none", minHeight: 44 }}
                  >
                    Ir para a produção
                  </Button>
                }
              />
            </Stack>
          }
          loading={loading}
          error={error ? REVIEW_TEXTS.loadError : undefined}
          itemCount={packages.length}
          emptyTitle={REVIEW_EMPTY_TEXTS[state.view].title}
          emptySubtitle={REVIEW_EMPTY_TEXTS[state.view].subtitle}
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
          pageSizeOptions={REVIEW_PAGE_SIZE_OPTIONS}
        >
          {packages.map((item) => (
            <Grid2 key={item.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ReviewPackageCard item={item} audiences={audiences} onOpen={(packageId) => navigate(`/adm/estudio/pacotes/${packageId}`)} />
            </Grid2>
          ))}
        </ListingLayout>

        <Accordion variant="outlined" disableGutters data-testid="content-studio-review-checklist" sx={{ borderRadius: 3, "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FactCheck color="primary" fontSize="small" />
              <Typography fontWeight={700}>O que conferir antes de aprovar</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {CONTENT_STUDIO_REVIEW_CHECKLIST.map((item) => (
                <ListItem key={item} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FactCheck color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}
