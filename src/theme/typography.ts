import type { ThemeOptions } from '@mui/material/styles';

import { colors } from './colors';

export const typography: ThemeOptions['typography'] = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    color: colors.secondary,
    fontWeight: 700,
  },
  h2: {
    color: colors.secondary,
    fontWeight: 600,
  },
  h3: {
    color: colors.secondary,
    fontWeight: 600,
  },
  h4: {
    color: colors.secondary,
    fontWeight: 600,
  },
  h5: {
    color: colors.secondary,
    fontWeight: 600,
  },
  h6: {
    color: colors.secondary,
    fontWeight: 600,
  },
  body1: {
    color: colors.text.primary,
  },
  body2: {
    color: colors.text.secondary,
  },
};
