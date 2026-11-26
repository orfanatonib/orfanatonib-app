import React, { useCallback, useState } from "react";
import { Button } from "@mui/material";
import { Add, ChildCare } from "@mui/icons-material";
import {
  AdminTableListScreen,
  splitSort,
  useAdminList,
  type AdminFilterField,
  type AdminListFetcher,
} from "@/components/common/admin-shell";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import ShelteredCard from "./components/ShelteredCard";
import { buildShelteredColumns } from "./components/shelteredColumns";
import ShelteredViewDialog from "./components/ShelteredViewDialog";
import ShelteredFormDialog from "./components/ShelteredFormDialog";
import { apiFetchShelteredList } from "./api";
import { useShelteredDetails, useShelteredMutations } from "./hooks";
import {
  GENDER_LABELS,
  MIN_TOUCH_TARGET_PX,
  SHELTERED_MESSAGES,
  SHELTERED_PAGE_SIZE_DEFAULT,
  SHELTERED_SORT_DEFAULT_VALUE,
  SHELTERED_SORT_FIELD_OPTIONS,
  SHELTERED_TESTID,
  SHELTERED_TESTID_PREFIX,
} from "./constants";
import { ShelteredFormMode, ShelteredGender, ShelteredOrderBy } from "./enums";
import type {
  CreateShelteredForm,
  EditShelteredForm,
  ShelteredResponseDto,
} from "./types";

const emptyCreateForm = (): CreateShelteredForm => ({
  name: "",
  gender: ShelteredGender.MALE,
  guardianName: "",
  guardianPhone: "",
  birthDate: "",
  joinedAt: null,
  shelterId: null,
  address: { street: "", district: "", city: "", state: "", postalCode: "" },
});

const toEditForm = (sheltered: ShelteredResponseDto): EditShelteredForm => ({
  id: sheltered.id,
  name: sheltered.name,
  gender: sheltered.gender,
  guardianName: sheltered.guardianName ?? "",
  guardianPhone: sheltered.guardianPhone ?? "",
  // Mantém ISO: `isoToDayjs` só interpreta esse formato sem ambiguidade.
  // Uma data em DD/MM/AAAA seria lida como MM/DD/AAAA e trocaria dia por mês.
  birthDate: sheltered.birthDate,
  joinedAt: sheltered.joinedAt,
  shelterId: sheltered.shelter?.id ?? null,
  address: sheltered.address
    ? {
        street: sheltered.address.street,
        number: sheltered.address.number,
        district: sheltered.address.district,
        city: sheltered.address.city,
        state: sheltered.address.state,
        postalCode: sheltered.address.postalCode,
        complement: sheltered.address.complement,
      }
    : null,
});


/** Campos da toolbar padrão: um por filtro que a API de `/sheltered` aceita (a busca geral é o campo de busca). */
const FILTER_FIELDS: AdminFilterField[] = [
  { kind: "select", key: "sort", label: "Ordenar por", allLabel: null, options: [...SHELTERED_SORT_FIELD_OPTIONS] },
  {
    kind: "select",
    key: "gender",
    label: "Gênero",
    allLabel: "Todos",
    options: [
      { value: ShelteredGender.MALE, label: GENDER_LABELS[ShelteredGender.MALE] },
      { value: ShelteredGender.FEMALE, label: GENDER_LABELS[ShelteredGender.FEMALE] },
    ],
  },
  { kind: "text", key: "shelterSearchingString", label: "Abrigo", placeholder: "Nome, cidade ou estado" },
  { kind: "text", key: "addressFilter", label: "Endereço", placeholder: "Rua, bairro, cidade" },
  { kind: "date", key: "birthDateFrom", label: "Nascimento a partir de" },
  { kind: "date", key: "birthDateTo", label: "Nascimento até" },
  { kind: "date", key: "joinedFrom", label: "No abrigo desde" },
  { kind: "date", key: "joinedTo", label: "No abrigo até" },
];

const DEFAULT_FILTERS = { sort: SHELTERED_SORT_DEFAULT_VALUE };

/** Traduz o estado da lista (busca, filtros, página 1-indexada) para `GET /sheltered`. */
const fetchSheltered: AdminListFetcher<ShelteredResponseDto> = async (params, signal) => {
  const { filters } = params;
  const { sortBy, order } = splitSort(filters.sort);
  const { data, meta } = await apiFetchShelteredList({
    page: params.page,
    limit: params.limit,
    sort: sortBy ? { id: sortBy as ShelteredOrderBy, desc: order === "DESC" } : null,
    filters: {
      searchString: params.search,
      shelterSearchingString: filters.shelterSearchingString,
      addressFilter: filters.addressFilter,
      gender: (filters.gender || undefined) as ShelteredGender | undefined,
      birthDateFrom: filters.birthDateFrom,
      birthDateTo: filters.birthDateTo,
      joinedFrom: filters.joinedFrom,
      joinedTo: filters.joinedTo,
    },
    signal,
  });
  return { items: data, total: meta.totalItems, totalPages: meta.totalPages };
};

export default function ShelteredManager() {
  const list = useAdminList<ShelteredResponseDto>({
    fetcher: fetchSheltered,
    pageSize: SHELTERED_PAGE_SIZE_DEFAULT,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: SHELTERED_MESSAGES.LIST_ERROR,
  });

  const refetch = useCallback(async () => list.reload(), [list.reload]);

  const { viewing, setViewing, loading: viewingLoading, fetchSheltered: loadSheltered } =
    useShelteredDetails();

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    createSheltered,
    updateSheltered,
    deleteSheltered,
  } = useShelteredMutations(refetch);

  const [creating, setCreating] = useState<CreateShelteredForm | null>(null);
  const [editing, setEditing] = useState<EditShelteredForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ShelteredResponseDto | null>(null);

  const handleOpenView = (row: ShelteredResponseDto) => {
    setViewing(row);
    void loadSheltered(row.id);
  };

  const handleStartEdit = (row: ShelteredResponseDto) => {
    setViewing(null);
    setDialogError("");
    setEditing(toEditForm(row));
  };

  const submitCreate = async () => {
    if (!creating) return;
    if (await createSheltered(creating)) setCreating(null);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const { id, ...payload } = editing;
    if (await updateSheltered(id, payload)) setEditing(null);
  };

  const submitDelete = async () => {
    if (!confirmDelete) return;
    if (await deleteSheltered(confirmDelete.id)) setConfirmDelete(null);
  };

  const rowActions = {
    onOpenView: handleOpenView,
    onStartEdit: handleStartEdit,
    onAskDelete: setConfirmDelete,
  };

  return (
    <AdminTableListScreen
      testIdPrefix={SHELTERED_TESTID_PREFIX}
      title="Gerenciar Acolhidos"
      searchLabel="Buscar acolhido"
      searchPlaceholder="Nome do acolhido, responsável ou telefone"
      fields={FILTER_FIELDS}
      list={list}
      emptyMessage={SHELTERED_MESSAGES.EMPTY_HINT}
      emptyIcon={<ChildCare aria-hidden sx={{ fontSize: 56, color: "text.secondary" }} />}
      columns={buildShelteredColumns(rowActions)}
      rowKey={(row) => row.id}
      renderCard={(row) => <ShelteredCard sheltered={row} {...rowActions} />}
      cardsBelow="sm"
      primaryAction={
        <Button
          variant="contained"
          fullWidth
          startIcon={<Add />}
          onClick={() => {
            setDialogError("");
            setCreating(emptyCreateForm());
          }}
          data-testid="sheltered-create"
          sx={{ minHeight: MIN_TOUCH_TARGET_PX, textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Criar acolhido
        </Button>
      }
      overlays={
        <>
          <ShelteredViewDialog
            open={Boolean(viewing)}
            loading={viewingLoading}
            sheltered={viewing}
            onClose={() => setViewing(null)}
            onEdit={handleStartEdit}
          />

          <ShelteredFormDialog
            mode={ShelteredFormMode.CREATE}
            open={Boolean(creating)}
            value={creating}
            onChange={(next) => setCreating(next as CreateShelteredForm)}
            onCancel={() => {
              setCreating(null);
              setDialogError("");
            }}
            onSubmit={() => void submitCreate()}
            error={dialogError}
            loading={dialogLoading}
          />

          <ShelteredFormDialog
            mode={ShelteredFormMode.EDIT}
            open={Boolean(editing)}
            value={editing}
            onChange={(next) => setEditing(next as EditShelteredForm)}
            onCancel={() => {
              setEditing(null);
              setDialogError("");
            }}
            onSubmit={() => void submitEdit()}
            error={dialogError}
            loading={dialogLoading}
          />

          <DeleteConfirmDialog
            open={Boolean(confirmDelete)}
            title={confirmDelete?.name ?? ""}
            loading={dialogLoading}
            testId={SHELTERED_TESTID.DELETE_DIALOG}
            onClose={() => {
              setConfirmDelete(null);
              setDialogError("");
            }}
            onConfirm={submitDelete}
          />
        </>
      }
    />
  );
}
