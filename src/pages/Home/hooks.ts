import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/slices';
import { setComments } from 'store/slices/comment/commentsSlice';
import { apiGetPublishedComments } from '@/features/comments/api';
import { logger } from '@/utils/logger';

export const useComments = () => {
  const comments = useSelector((state: RootState) => state.comments.comments);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (comments !== null) return;

    const fetchComments = async () => {
      try {
        dispatch(setComments(await apiGetPublishedComments()));
      } catch (error: unknown) {
        // Depoimentos são opcionais na Home: a falha é registrada, a página segue sem eles.
        logger.warn('Falha ao carregar depoimentos publicados', { feature: 'home', action: 'fetch-comments' }, error);
      }
    };
    fetchComments();
  }, [dispatch, comments]);

  return comments;
};

export const useAuth = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  return { isAuthenticated, user };
};
