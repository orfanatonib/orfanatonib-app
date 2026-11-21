import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/slices';
import { setComments } from 'store/slices/comment/commentsSlice';
import { apiGetPublishedComments } from '@/features/comments/api';
import { logger } from '@/utils/logger';

/** `enabled` = flag `home_comments`: desligada, a Home nem consulta a API de depoimentos. */
export const useComments = (enabled = true) => {
  const comments = useSelector((state: RootState) => state.comments.comments);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!enabled || comments !== null) return;

    const fetchComments = async () => {
      try {
        dispatch(setComments(await apiGetPublishedComments()));
      } catch (error: unknown) {
        // Depoimentos são opcionais na Home: a falha é registrada, a página segue sem eles.
        logger.warn('Falha ao carregar depoimentos publicados', { feature: 'home', action: 'fetch-comments' }, error);
      }
    };
    fetchComments();
  }, [dispatch, comments, enabled]);

  return comments;
};

export const useAuth = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  return { isAuthenticated, user };
};
