import type { Components, Theme } from '@mui/material/styles';

import { colors } from '../colors';

export const tablesComponents: Components<Theme> = {
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: colors.grey[100],
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 0, 0.04)',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 600,
        color: colors.secondary,
      },
    },
  },
};
