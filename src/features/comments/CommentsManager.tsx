import React from "react";
import { Comment as CommentIcon } from "@mui/icons-material";

import { CommentData } from "store/slices/comment/commentsSlice";
import { useRefreshPendingCounts } from "@/features/admin-pending-counts";
import { AdminCardGrid, AdminListScreen, useAdminList } from "@/components/common/admin-shell";
import type { AdminFilterField } from "@/components/common/admin-shell";
import { fetchCommentsPage } from "./api";
import {
  COMMENTS_DEFAULT_SORT,
  COMMENTS_LABELS,
  COMMENTS_TEST_ID_PREFIX,
  COMMENT_FILTER_KEYS,
  COMMENT_PUBLISHED_OPTIONS,
  COMMENT_SORT_OPTIONS,
} from "./constants";
import { useCommentActions } from "./hooks";
import CommentCard from "./components/CommentCard";
import EditCommentDialog, { EditState } from "./components/EditCommentDialog";
import CommentDetailsModal from "./components/CommentDetailsModal";
import ConfirmDialog from "@/components/common/modal/ConfirmDialog";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";

const P = COMMENTS_TEST_ID_PREFIX;
const K = COMMENT_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: "select",
    key: K.PUBLISHED,
    label: COMMENTS_LABELS.FILTER_PUBLISHED,
    allLabel: COMMENTS_LABELS.FILTER_PUBLISHED_ALL,
    options: COMMENT_PUBLISHED_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  {
    kind: "text",
    key: K.SHELTER,
    label: COMMENTS_LABELS.FILTER_SHELTER,
    placeholder: COMMENTS_LABELS.FILTER_SHELTER_PLACEHOLDER,
  },
  { kind: "date", key: K.CREATED_FROM, label: COMMENTS_LABELS.FILTER_CREATED_FROM },
  { kind: "date", key: K.CREATED_TO, label: COMMENTS_LABELS.FILTER_CREATED_TO },
  {
    kind: "select",
    key: K.SORT,
    label: COMMENTS_LABELS.FILTER_SORT,
    allLabel: null,
    options: COMMENT_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: COMMENTS_DEFAULT_SORT };

export default function CommentsManager() {
  const list = useAdminList<CommentData>({
    fetcher: fetchCommentsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: COMMENTS_LABELS.LOAD_ERROR,
  });
  const refreshPending = useRefreshPendingCounts();
  const { reload } = list;
  const refetchAll = React.useCallback(async () => {
    reload();
    void refreshPending();
  }, [reload, refreshPending]);
  const { actionLoading, actionError, setActionError, publish, remove, update } = useCommentActions(refetchAll);

  React.useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const [selected, setSelected] = React.useState<CommentData | null>(null);
  const [toDelete, setToDelete] = React.useState<CommentData | null>(null);
  const [toPublish, setToPublish] = React.useState<CommentData | null>(null);
  const [toEdit, setToEdit] = React.useState<CommentData | null>(null);

  const [editValue, setEditValue] = React.useState<EditState>({ name: "", comment: "", shelter: "", neighborhood: "" });
  const [editErrors, setEditErrors] = React.useState({ comment: false, shelter: false, neighborhood: false });

  const openEdit = (c: CommentData) => {
    setToEdit(c);
    setEditValue({
      name: c.name || "",
      comment: c.comment || "",
      shelter: c.shelter || "",
      neighborhood: c.neighborhood || "",
    });
    setEditErrors({ comment: false, shelter: false, neighborhood: false });
  };

  const onSaveEdit = async () => {
    if (!toEdit) return;
    const errs = {
      comment: !editValue.comment.trim(),
      shelter: !editValue.shelter.trim(),
      neighborhood: !editValue.neighborhood.trim(),
    };
    setEditErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    await update(toEdit, { ...editValue, published: true });
    setToEdit(null);
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={COMMENTS_LABELS.TITLE}
      searchLabel={COMMENTS_LABELS.SEARCH}
      searchPlaceholder={COMMENTS_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={COMMENTS_LABELS.EMPTY}
      emptyIcon={<CommentIcon sx={{ fontSize: 64, color: "text.secondary" }} />}
      overlays={
        <>
      <DeleteConfirmDialog
        open={!!toDelete}
        testId="comments-delete-dialog"
        title={toDelete?.name || "Sem Nome"}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove(toDelete);
          setToDelete(null);
        }}
      />
      
      <ConfirmDialog
        open={!!toPublish}
        title="Confirmar Publicação"
        testId="comments-publish-dialog"
        content={<>Deseja publicar o comentário de <strong>{toPublish?.name || "Sem Nome"}</strong>?</>}
        confirmText="Publicar"
        confirmColor="success"
        loading={actionLoading}
        onClose={() => setToPublish(null)}
        onConfirm={async () => {
          if (!toPublish) return;
          await publish(toPublish);
          setToPublish(null);
        }}
      />

      <EditCommentDialog
        open={!!toEdit}
        value={editValue}
        setValue={setEditValue}
        errors={editErrors}
        loading={actionLoading}
        error={actionError}
        onCancel={() => { setToEdit(null); setActionError(""); }}
        onSave={onSaveEdit}
      />

      <CommentDetailsModal
        comment={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((comment) => (
          <CommentCard
            key={comment.id || `${comment.createdAt}-${comment.name}`}
            comment={comment}
            onView={(c) => setSelected(c)}
            onEdit={openEdit}
            onAskPublish={(c) => setToPublish(c)}
            onAskDelete={(c) => setToDelete(c)}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
