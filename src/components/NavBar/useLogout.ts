import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { logout } from '@/store/slices/auth/authSlice';
import { requestServerLogout } from './logoutRequest';

/** Logout único das navegações (desktop, mobile e links): servidor → sessão local → home. */
export function useLogout(onDone?: () => void): () => Promise<void> {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await requestServerLogout();
    } finally {
      dispatch(logout());
      navigate('/');
      onDone?.();
    }
  }, [dispatch, navigate, onDone]);
}
