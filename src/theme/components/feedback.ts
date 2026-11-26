import type { Components, Theme } from '@mui/material/styles';

import { colors } from '../colors';

export const feedbackComponents: Components<Theme> = {
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
      },
      colorPrimary: {
        backgroundColor: colors.primary,
        color: colors.secondary,
      },
      colorSecondary: {
        backgroundColor: colors.secondary,
        color: colors.primary,
      },
      colorSuccess: {
        backgroundColor: colors.success,
        color: '#FFFFFF',
      },
      colorError: {
        backgroundColor: colors.error,
        color: '#FFFFFF',
      },
      colorWarning: {
        backgroundColor: colors.warning,
        color: colors.secondary,
      },
      colorInfo: {
        backgroundColor: colors.info,
        color: '#FFFFFF',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      standardSuccess: {
        backgroundColor: 'rgba(0, 153, 51, 0.1)',
        color: colors.success,
        border: `1px solid ${colors.success}`,
      },
      standardError: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        color: colors.error,
        border: `1px solid ${colors.error}`,
      },
      standardWarning: {
        backgroundColor: 'rgba(255, 255, 0, 0.1)',
        color: colors.secondary,
        border: `1px solid ${colors.warning}`,
      },
      standardInfo: {
        backgroundColor: 'rgba(0, 153, 51, 0.1)',
        color: colors.info,
        border: `1px solid ${colors.info}`,
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        '& .MuiSnackbarContent-root': {
          backgroundColor: colors.secondary,
          color: colors.primary,
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
      },
      bar: {
        backgroundColor: colors.primary,
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: colors.primary,
      },
    },
  },
};
