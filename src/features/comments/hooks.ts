import { useCallback, useState } from "react";
import { CommentData } from "store/slices/comment/commentsSlice";
import { apiDeleteComment, apiPublishComment, apiUpdateComment } from "./api";

export function useCommentActions(fetchComments: () => Promise<void> | void) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const publish = useCallback(async (c: CommentData) => {
    setActionLoading(true); setActionError("");
    try { await apiPublishComment(c); await fetchComments(); }
    catch (error: unknown) { setActionError("Erro ao publicar comentário"); throw error; }
    finally { setActionLoading(false); }
  }, [fetchComments]);

  const remove = useCallback(async (c: CommentData) => {
    if (!c.id) return;
    setActionLoading(true); setActionError("");
    try { await apiDeleteComment(c.id); await fetchComments(); }
    catch (error: unknown) { setActionError("Erro ao deletar comentário"); throw error; }
    finally { setActionLoading(false); }
  }, [fetchComments]);

  const update = useCallback(async (c: CommentData, payload: {
    name: string; comment: string; shelter: string; neighborhood: string; published?: boolean;
  }) => {
    setActionLoading(true); setActionError("");
    try { await apiUpdateComment(c, payload); await fetchComments(); }
    catch (error: unknown) { setActionError("Erro ao salvar comentário"); throw error; }
    finally { setActionLoading(false); }
  }, [fetchComments]);

  return { actionLoading, actionError, setActionError, publish, remove, update };
}
