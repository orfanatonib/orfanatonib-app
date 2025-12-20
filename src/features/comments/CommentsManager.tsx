import React from "react";
import { Box, Container } from "@mui/material";
import { motion } from "framer-motion";

import { CommentData } from "store/slices/comment/commentsSlice";
import { useCommentActions, useCommentsData, useCommentsFilter } from "./hooks";
import CommentsToolbar from "./components/CommentsToolbar";
import CommentsGrid from "./components/CommentsGrid";
import EditCommentDialog, { EditState } from "./components/EditCommentDialog";
import CommentDetailsModal from "./components/CommentDetailsModal";
import ConfirmDialog from "@/components/common/modal/ConfirmDialog";
import BackHeader from "@/components/common/header/BackHeader";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";

export default function CommentsManager() {
  const { comments, loading, error, setError, fetchComments } = useCommentsData();
  const { filtered, search, onSearchChange, status, setStatus, isFiltering } = useCommentsFilter(comments);
  const { actionLoading, actionError, setActionError, publish, remove, update } = useCommentActions(fetchComments);

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
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="💬 Gerenciar Comentários" />
        </motion.div>

        {/* Toolbar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CommentsToolbar
            search={search}
            onSearchChange={onSearchChange}
            status={status}
            setStatus={setStatus}
            isFiltering={isFiltering}
          />
        </motion.div>

        {/* Grid Section */}
        <CommentsGrid
          comments={filtered}
          loading={loading}
          error={error}
          onView={(c) => setSelected(c)}
          onEdit={openEdit}
          onAskPublish={(c) => setToPublish(c)}
          onAskDelete={(c) => setToDelete(c)}
        />

      <DeleteConfirmDialog
        open={!!toDelete}
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
      </Container>
    </Box>
  );
}
