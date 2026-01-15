import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, useMediaQuery, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorScreen, { type ErrorScreenProps, type ErrorScreenType } from '../ErrorScreen/ErrorScreen';
import ErrorState, { type ErrorType } from '../ErrorState/ErrorState';
import { useElegantErrorDisplay } from '@/hooks/useElegantErrorDisplay';
import type { AppError } from '@/types/error';

export interface ErrorDisplayProps {
  error: AppError | string | null;
  context?: string;
  mode?: 'auto' | 'snackbar' | 'inline' | 'modal' | 'fullscreen';
  onRetry?: () => void;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showDetails?: boolean;
}

export default function ErrorDisplay({
  error,
  context = 'unknown',
  mode = 'auto',
  onRetry,
  onClose,
  autoHide = false,
  autoHideDelay = 5000,
  showDetails = false,
}: ErrorDisplayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [displayMode, setDisplayMode] = useState<'snackbar' | 'inline' | 'modal' | 'fullscreen'>(mode === 'auto' ? 'snackbar' : mode);
  const [isVisible, setIsVisible] = useState(false);

  const { displayError, clearCurrentError, currentError } = useElegantErrorDisplay(context);

  // Auto-hide timer
  useEffect(() => {
    if (!autoHide || !isVisible) return;

    const timer = setTimeout(() => {
      handleClose();
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay, isVisible]);

  useEffect(() => {
    if (!error) {
      setIsVisible(false);
      return;
    }

    let determinedMode: 'snackbar' | 'inline' | 'modal' | 'fullscreen' = 'snackbar';

    if (mode !== 'auto') {
      determinedMode = mode;
    } else {
      const errorObj: AppError = typeof error === 'string' ? { message: error, category: 'UNKNOWN' } : error;

      switch (errorObj.category) {
        case 'NETWORK':
          determinedMode = isMobile ? 'modal' : 'snackbar';
          break;
        case 'AUTHENTICATION':
        case 'AUTHORIZATION':
          determinedMode = 'modal';
          break;
        case 'SERVER':
          determinedMode = errorObj.severity === 'CRITICAL' ? 'fullscreen' : 'modal';
          break;
        case 'VALIDATION':
          determinedMode = 'inline';
          break;
        case 'BUSINESS':
          determinedMode = 'snackbar';
          break;
        default:
          determinedMode = context.includes('page') || context.includes('screen') ? 'fullscreen' : 'snackbar';
      }

      if (isMobile && determinedMode === 'snackbar') {
        determinedMode = 'modal';
      }
    }

    setDisplayMode(determinedMode);
    setIsVisible(true);
  }, [error, mode, context, isMobile]);

  const handleClose = () => {
    setIsVisible(false);
    clearCurrentError();
    onClose?.();
  };

  const handleRetry = () => {
    onRetry?.();
    if (mode === 'auto') {
      displayError(error!, { mode: 'snackbar', action: { label: 'Tentando...', onClick: () => { } } });
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  const errorObj: AppError = typeof error === 'string' ? { message: error, category: 'UNKNOWN' } : error;

  const getScreenType = (): ErrorScreenType => {
    switch (errorObj.category) {
      case 'NETWORK':
        return 'network';
      case 'SERVER':
        return 'server';
      case 'AUTHENTICATION':
        return 'forbidden';
      case 'AUTHORIZATION':
        return 'forbidden';
      case 'VALIDATION':
        return 'validation';
      default:
        return 'generic';
    }
  };

  const getErrorStateType = (): ErrorType => {
    switch (errorObj.category) {
      case 'NETWORK':
        return 'network';
      case 'SERVER':
        return '500';
      default:
        return 'generic';
    }
  };

  switch (displayMode) {
    case 'snackbar':
      return null;

    case 'inline':
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorState
              type={getErrorStateType()}
              message={errorObj.message}
              onRetry={onRetry}
              showRetryButton={!!onRetry}
            />
          </motion.div>
        </AnimatePresence>
      );

    case 'modal':
      return (
        <Dialog
          open={isVisible}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 2,
              m: isMobile ? 0 : 2,
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <ErrorScreen
              type={getScreenType()}
              error={errorObj}
              showDetails={showDetails}
              showHomeButton={false}
              showBackButton={false}
              showRefreshButton={!!onRetry}
              onRetry={handleRetry}
              actions={[
                {
                  label: 'Fechar',
                  onClick: handleClose,
                  variant: 'outlined' as const,
                },
                ...(onRetry ? [{
                  label: 'Tentar novamente',
                  onClick: handleRetry,
                  variant: 'contained' as const,
                }] : []),
              ]}
            />
          </DialogContent>
        </Dialog>
      );

    case 'fullscreen':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <ErrorScreen
            type={getScreenType()}
            error={errorObj}
            showDetails={showDetails}
            showHomeButton={true}
            showBackButton={true}
            showRefreshButton={!!onRetry}
            onRetry={handleRetry}
            onHome={() => window.location.href = '/'}
            onBack={() => window.history.back()}
            autoRetry={false}
          />
        </motion.div>
      );

    default:
      return null;
  }
}
