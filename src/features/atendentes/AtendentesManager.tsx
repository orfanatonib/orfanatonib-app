import React from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GavelIcon from "@mui/icons-material/Gavel";
import { AdminCardGrid, AdminListScreen, useAdminList } from "@/components/common/admin-shell";
import type { AdminFilterField } from "@/components/common/admin-shell";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import MediaDocumentPreviewModal from "@/utils/MediaDocumentPreviewModal";
import type { MediaItem } from "@/store/slices/types";
import { apiGetAtendente, fetchAtendentesPage } from "./api";
import AtendenteCard from "./components/AtendenteCard";
import AtendenteFormDialog from "./components/AtendenteFormDialog";
import AtendenteViewDialog from "./components/AtendenteViewDialog";
import {
  ATENDENTES_DEFAULT_SORT,
  ATENDENTES_LABELS,
  ATENDENTES_TEST_ID_PREFIX,
  ATENDENTE_DOCUMENTS_OPTIONS,
  ATENDENTE_FILTER_KEYS,
  ATENDENTE_LINK_OPTIONS,
  ATENDENTE_SORT_OPTIONS,
} from "./constants";
import { useAtendenteMutations } from "./hooks";
import type {
  AtendenteFiles,
  AtendentePdf,
  AtendenteResponseDto,
  CreateAtendenteDto,
  PdfScope,
  UpdateAtendenteDto,
} from "./types";
import { displayNameOf, pdfToMediaItem } from "./utils";

const P = ATENDENTES_TEST_ID_PREFIX;
const K = ATENDENTE_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: "select",
    key: K.ATTENDABLE_TYPE,
    label: ATENDENTES_LABELS.FILTER_LINK,
    allLabel: ATENDENTES_LABELS.FILTER_LINK_ALL,
    options: ATENDENTE_LINK_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  {
    kind: "select",
    key: K.DOCUMENTS,
    label: ATENDENTES_LABELS.FILTER_DOCUMENTS,
    allLabel: ATENDENTES_LABELS.FILTER_DOCUMENTS_ALL,
    options: ATENDENTE_DOCUMENTS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  { kind: "date", key: K.CREATED_FROM, label: ATENDENTES_LABELS.FILTER_CREATED_FROM },
  { kind: "date", key: K.CREATED_TO, label: ATENDENTES_LABELS.FILTER_CREATED_TO },
  {
    kind: "select",
    key: K.SORT,
    label: ATENDENTES_LABELS.FILTER_SORT,
    allLabel: null,
    options: ATENDENTE_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: ATENDENTES_DEFAULT_SORT };

type SnackSeverity = "success" | "error";

export default function AtendentesManager() {
  const list = useAdminList<AtendenteResponseDto>({
    fetcher: fetchAtendentesPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: ATENDENTES_LABELS.LOAD_ERROR,
  });
  const { reload } = list;

  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: SnackSeverity }>({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnack = React.useCallback((message: string, severity: SnackSeverity = "success") => {
    setSnack({ open: true, message, severity });
  }, []);
  const closeSnack = (_?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setSnack((current) => ({ ...current, open: false }));
  };

  const [viewing, setViewing] = React.useState<AtendenteResponseDto | null>(null);
  const [editing, setEditing] = React.useState<AtendenteResponseDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<AtendenteResponseDto | null>(null);
  const [pdfPreviewMedia, setPdfPreviewMedia] = React.useState<MediaItem | null>(null);

  /**
   * O PDF de antecedente é privado: a URL da lista é assinada e vale poucos minutos. Ao abrir, busca uma URL nova
   * (a da lista pode ter vencido se a tela ficou aberta); se a busca falhar, usa a que já tinha.
   */
  const openPdfPreview = async (atendente: AtendenteResponseDto, scope: PdfScope, fallback: AtendentePdf) => {
    try {
      const fresh = await apiGetAtendente(atendente.id);
      setPdfPreviewMedia(pdfToMediaItem((scope === "estadual" ? fresh.pdfEstadual : fresh.pdfFederal) ?? fallback, scope));
    } catch {
      setPdfPreviewMedia(pdfToMediaItem(fallback, scope));
    }
  };

  const { dialogLoading, dialogError, setDialogError, handleCreate, handleUpdate, handleDelete } =
    useAtendenteMutations(reload);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await handleDelete(deleting.id);
      showSnack(ATENDENTES_LABELS.DELETED_OK, "success");
      setDeleting(null);
    } catch {
      showSnack(ATENDENTES_LABELS.DELETE_ERROR, "error");
    }
  };

  const handleFormSubmit = async (
    data: CreateAtendenteDto | UpdateAtendenteDto,
    files: AtendenteFiles,
    options?: { updateId?: string }
  ) => {
    if (options?.updateId) {
      await handleUpdate(options.updateId, data as UpdateAtendenteDto, files, () =>
        showSnack(ATENDENTES_LABELS.UPDATED_OK, "success")
      );
    } else {
      await handleCreate(data as CreateAtendenteDto, files, () => showSnack(ATENDENTES_LABELS.CREATED_OK, "success"));
    }
  };

  const handleCloseDialogs = () => {
    setCreating(false);
    setEditing(null);
    setViewing(null);
    setDialogError("");
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={ATENDENTES_LABELS.TITLE}
      searchLabel={ATENDENTES_LABELS.SEARCH}
      searchPlaceholder={ATENDENTES_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={ATENDENTES_LABELS.EMPTY}
      emptyIcon={<GavelIcon sx={{ fontSize: 64, color: "text.secondary" }} />}
      primaryAction={
        <Button
          data-testid={`${P}-create`}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreating(true)}
          fullWidth
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          {ATENDENTES_LABELS.CREATE}
        </Button>
      }
      overlays={
        <>
          <AtendenteFormDialog
            open={creating}
            onClose={handleCloseDialogs}
            onSubmit={handleFormSubmit}
            loading={dialogLoading}
            error={dialogError}
          />

          <AtendenteFormDialog
            open={!!editing}
            onClose={handleCloseDialogs}
            onSubmit={handleFormSubmit}
            editing={editing}
            loading={dialogLoading}
            error={dialogError}
          />

          <AtendenteViewDialog
            open={!!viewing}
            onClose={handleCloseDialogs}
            atendente={viewing}
            onPreviewPdf={(pdf, label) => setPdfPreviewMedia(pdfToMediaItem(pdf, label))}
          />

          <MediaDocumentPreviewModal
            open={!!pdfPreviewMedia}
            onClose={() => setPdfPreviewMedia(null)}
            media={pdfPreviewMedia}
            title={pdfPreviewMedia?.originalName ?? pdfPreviewMedia?.title}
          />

          <DeleteConfirmationModal
            testId={`${P}-delete-dialog`}
            open={!!deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleConfirmDelete}
            loading={dialogLoading}
            description={
              <span>
                Tem certeza que deseja excluir o antecedente criminal de{" "}
                <strong>{deleting ? displayNameOf(deleting) : ""}</strong>? {ATENDENTES_LABELS.DELETE_WARNING}
              </span>
            }
          />

          <Snackbar
            open={snack.open}
            autoHideDuration={4000}
            onClose={closeSnack}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert data-testid={`${P}-snackbar`} elevation={6} variant="filled" onClose={closeSnack} severity={snack.severity}>
              {snack.message}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((atendente) => (
          <AtendenteCard
            key={atendente.id}
            atendente={atendente}
            onView={setViewing}
            onEdit={setEditing}
            onDelete={setDeleting}
            onPreviewPdf={openPdfPreview}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
