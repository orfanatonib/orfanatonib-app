import type { Components, Theme } from '@mui/material/styles';

import { colors } from '../colors';

export const navigationComponents: Components<Theme> = {
  MuiTabs: {
    styleOverrides: {
      root: {
        '& .MuiTab-root.Mui-selected': {
          color: colors.primary,
        },
        '& .MuiTabs-indicator': {
          backgroundColor: colors.primary,
        },
      },
    },
  },
  MuiPagination: {
    styleOverrides: {
      root: {
        '& .MuiPaginationItem-root': {
          '&.Mui-selected': {
            backgroundColor: colors.primary,
            color: colors.secondary,
            '&:hover': {
              backgroundColor: '#CCCC00',
            },
          },
        },
      },
    },
  },
  MuiBreadcrumbs: {
    styleOverrides: {
      root: {
        '& .MuiBreadcrumbs-separator': {
          color: colors.primary,
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: colors.primary,
        '&:hover': {
          color: '#CCCC00',
        },
      },
    },
  },
  MuiStepper: {
    styleOverrides: {
      root: {
        '& .MuiStepIcon-root.Mui-active': {
          color: colors.primary,
        },
        '& .MuiStepIcon-root.Mui-completed': {
          color: colors.success,
        },
      },
    },
  },
};
