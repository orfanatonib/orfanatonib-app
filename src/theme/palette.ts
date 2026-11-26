import type { PaletteOptions } from '@mui/material/styles';

import { colors } from './colors';

export const palette: PaletteOptions = {
    mode: 'light',
    primary: {
      main: colors.primary,
      light: '#FFFF66',
      dark: '#CCCC00',
      contrastText: colors.secondary,
    },
    secondary: {
      main: colors.secondary,
      light: '#333333',
      dark: '#000000',
      contrastText: colors.primary,
    },
    success: {
      main: colors.success,
      light: '#33CC66',
      dark: '#006600',
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.error,
      light: '#FF6666',
      dark: '#CC0000',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colors.warning,
      light: '#FFFF66',
      dark: '#CCCC00',
      contrastText: colors.secondary,
    },
    info: {
      main: colors.info,
      light: '#33CC66',
      dark: '#006600',
      contrastText: '#FFFFFF',
    },
    background: colors.background,
    text: colors.text,
    grey: colors.grey,
};
