import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/slices";
import { fetchRoutes } from "@/store/slices/route/routeSlice";
import { useVideoPageById } from "@/features/video-pages/hooks";
import { videoPageApi, toVideoPageData, GetVideoPageResponse } from "./api";

export const DELETE_ERROR_MESSAGE = "Erro ao excluir a página. Tente novamente mais tarde.";

export const useVideoPage = (idToFetch: string) => {
    const dispatch = useDispatch<AppDispatch>();
    const { page, loading, error: loadError, reload } = useVideoPageById(idToFetch);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const videoData = useMemo(
        () => (page ? toVideoPageData(page as GetVideoPageResponse) : null),
        [page],
    );

    const deletePage = useCallback(
        async (onSuccess?: () => void, onError?: (msg: string) => void) => {
            if (!videoData?.id) return;
            try {
                setIsDeleting(true);
                setDeleteError(null);
                await videoPageApi.deleteById(videoData.id);
                await dispatch(fetchRoutes());
                onSuccess?.();
            } catch {
                setDeleteError(DELETE_ERROR_MESSAGE);
                onError?.(DELETE_ERROR_MESSAGE);
            } finally {
                setIsDeleting(false);
            }
        },
        [dispatch, videoData?.id]
    );

    return {
        videoData,
        loading,
        error: deleteError ?? loadError,
        isDeleting,
        reload,
        deletePage,
    } as const;
};
