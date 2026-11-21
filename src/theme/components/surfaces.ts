import type { Components, Theme } from '@mui/material/styles';

import { colors } from '../colors';

export const surfacesComponents: Components<Theme> = {
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: colors.secondary,
        color: colors.primary,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        border: `1px solid ${colors.grey[200]}`,
        '&:hover': {
          boxShadow: `0 4px 20px rgba(255, 255, 0, 0.15)`,
          borderColor: colors.primary,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: colors.background.paper,
      },
      elevation1: {
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
      },
      elevation2: {
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.15)`,
      },
      elevation3: {
        boxShadow: `0 6px 24px rgba(0, 0, 0, 0.2)`,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        border: `1px solid ${colors.primary}`,
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        backgroundColor: colors.primary,
        color: colors.secondary,
        fontWeight: 600,
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        border: `1px solid ${colors.grey[200]}`,
        '&:before': {
          display: 'none',
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        '&.Mui-expanded': {
          backgroundColor: 'rgba(255, 255, 0, 0.04)',
        },
      },
    },
  },
};
