import { useCallback, useMemo, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { Add, Home } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AdminTableListScreen,
  splitSort,
  useAdminList,
  type AdminListFetcher,
} from "@/components/common/admin-shell";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import { selectIsAdmin, selectIsLeader } from "@/store/selectors/routeSelectors";
import { useIsFeatureEnabled, FeatureFlagKeys } from "@/features/feature-flags";
import ShelterViewDialog from "./ShelterViewDialog";
import ShelterDetailsPage from "./ShelterDetailsPage";
import ShelterCard from "./list/ShelterCard";
import { buildShelterColumns } from "./list/columns";
import {
  SHELTERS_DEFAULT_SORT,
  SHELTERS_FILTER as F,
  SHELTERS_LABELS,
  SHELTERS_TESTID,
  buildSheltersFields,
} from "./list/constants";
import { apiFetchSheltersPage } from "./api";
import { useShelterDetails, useShelterMutations } from "./hooks";
import type { ShelterResponseDto } from "./types";

const DEFAULT_FILTERS = { [F.SORT]: SHELTERS_DEFAULT_SORT };

/** Mapeia busca/filtros/ordenação/página da casca para a query do `/shelters` (tudo filtrado no banco). */
const fetchShelters: AdminListFetcher<ShelterResponseDto> = async ({ page, limit, search, filters }, signal) => {
  const { sortBy, order } = splitSort(filters[F.SORT]);
  const data = await apiFetchSheltersPage(
    {
      page,
      limit,
      search,
      sort: sortBy,
      order,
      city: filters[F.CITY],
      state: filters[F.STATE],
      createdFrom: filters[F.CREATED_FROM],
      createdTo: filters[F.CREATED_TO],
    },
    signal,
  );
  return {
    items: data.items ?? [],
    total: Number(data.total ?? 0),
    totalPages: Math.max(1, Number(data.pageCount ?? 1)),
  };
};

export default function SheltersManager() {
  const isLeader = useSelector(selectIsLeader);
  return isLeader ? <ShelterDetailsPage /> : <SheltersListScreen />;
}

function SheltersListScreen() {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const addressEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_ADDRESS);

  const list = useAdminList<ShelterResponseDto>({
    fetcher: fetchShelters,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: SHELTERS_LABELS.LOAD_ERROR,
  });

  const { viewing, setViewing, loading: viewingLoading, fetchShelter } = useShelterDetails();
  const [confirmDelete, setConfirmDelete] = useState<ShelterResponseDto | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const reload = useCallback(async () => list.reload(), [list.reload]);
  const { deleteShelter } = useShelterMutations(reload);

  const onView = useCallback(
    (shelter: ShelterResponseDto) => {
      setViewing(shelter);
      void fetchShelter(shelter.id);
    },
    [fetchShelter, setViewing],
  );
  const onEdit = useCallback((shelter: ShelterResponseDto) => navigate(`/adm/abrigos/${shelter.id}/edit`), [navigate]);
  const onDelete = useCallback((shelter: ShelterResponseDto) => setConfirmDelete(shelter), []);

  const submitDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteShelter(confirmDelete.id);
    } catch {
      setDeleteError("Não foi possível excluir o abrigo.");
    }
    setConfirmDelete(null);
  };

  const fields = useMemo(() => buildSheltersFields(addressEnabled), [addressEnabled]);
  const columns = useMemo(
    () => buildShelterColumns({ isAdmin, addressEnabled, onView, onEdit, onDelete }),
    [isAdmin, addressEnabled, onView, onEdit, onDelete],
  );

  return (
    <AdminTableListScreen<ShelterResponseDto>
      testIdPrefix={SHELTERS_TESTID}
      title={SHELTERS_LABELS.TITLE}
      searchLabel={SHELTERS_LABELS.SEARCH}
      searchPlaceholder={SHELTERS_LABELS.SEARCH_PLACEHOLDER}
      fields={fields}
      list={list}
      columns={columns}
      rowKey={(shelter) => shelter.id}
      renderCard={(shelter) => (
        <ShelterCard
          shelter={shelter}
          isAdmin={isAdmin}
          addressEnabled={addressEnabled}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      emptyMessage={SHELTERS_LABELS.EMPTY}
      emptyIcon={<Home sx={{ fontSize: 64, color: "text.secondary" }} />}
      primaryAction={
        <Button
          data-testid="create-shelter-button"
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/adm/abrigos/novo")}
          sx={{ minHeight: 44, textTransform: "none", whiteSpace: "nowrap" }}
        >
          {SHELTERS_LABELS.CREATE}
        </Button>
      }
      overlays={
        <>
          <ShelterViewDialog
            open={!!viewing}
            loading={viewingLoading}
            shelter={viewing}
            onClose={() => setViewing(null)}
          />
          <DeleteConfirmDialog
            testId="shelters-delete-dialog"
            open={!!confirmDelete}
            title={confirmDelete ? confirmDelete.name : ""}
            onClose={() => setConfirmDelete(null)}
            onConfirm={submitDelete}
          />
          <Snackbar open={!!deleteError} autoHideDuration={6000} onClose={() => setDeleteError("")}>
            <Alert severity="error" data-testid="shelters-delete-error" onClose={() => setDeleteError("")}>
              {deleteError}
            </Alert>
          </Snackbar>
        </>
      }
    />
  );
}
