import type { Components, Theme } from '@mui/material/styles';

import { colors } from '../colors';

export const buttonsComponents: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
      containedPrimary: {
        backgroundColor: colors.primary,
        color: colors.secondary,
        '&:hover': {
          backgroundColor: '#CCCC00',
          boxShadow: '0 4px 12px rgba(255, 255, 0, 0.3)',
        },
      },
      containedSecondary: {
        backgroundColor: colors.secondary,
        color: colors.primary,
        '&:hover': {
          backgroundColor: '#333333',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
      },
      containedSuccess: {
        backgroundColor: colors.success,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#006600',
          boxShadow: '0 4px 12px rgba(0, 153, 51, 0.3)',
        },
      },
      containedError: {
        backgroundColor: colors.error,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#CC0000',
          boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
        },
      },
      containedWarning: {
        backgroundColor: colors.warning,
        color: colors.secondary,
        '&:hover': {
          backgroundColor: '#CCCC00',
          boxShadow: '0 4px 12px rgba(255, 255, 0, 0.3)',
        },
      },
      containedInfo: {
        backgroundColor: colors.info,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#006600',
          boxShadow: '0 4px 12px rgba(0, 153, 51, 0.3)',
        },
      },
      outlinedPrimary: {
        borderColor: colors.primary,
        color: colors.primary,
        '&:hover': {
          borderColor: '#CCCC00',
          backgroundColor: 'rgba(255, 255, 0, 0.08)',
        },
      },
      outlinedSecondary: {
        borderColor: colors.secondary,
        color: colors.secondary,
        '&:hover': {
          borderColor: '#333333',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
      textPrimary: {
        color: colors.primary,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 0, 0.08)',
        },
      },
      textSecondary: {
        color: colors.secondary,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 0, 0.08)',
        },
      },
      colorPrimary: {
        color: colors.primary,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 0, 0.12)',
        },
      },
      colorSecondary: {
        color: colors.secondary,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      primary: {
        backgroundColor: colors.primary,
        color: colors.secondary,
        '&:hover': {
          backgroundColor: '#CCCC00',
          boxShadow: '0 6px 16px rgba(255, 255, 0, 0.4)',
        },
      },
      secondary: {
        backgroundColor: colors.secondary,
        color: colors.primary,
        '&:hover': {
          backgroundColor: '#333333',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
        },
      },
    },
  },
};
