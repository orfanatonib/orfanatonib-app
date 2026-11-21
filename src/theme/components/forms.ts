import type { Components, Theme } from '@mui/material/styles';

import { colors } from '../colors';

export const formsComponents: Components<Theme> = {
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: colors.primary,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.primary,
          },
        },
      },
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: {
        '&.Mui-focused': {
          color: colors.primary,
        },
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        '&.Mui-checked': {
          color: colors.primary,
        },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        '&.Mui-checked': {
          color: colors.primary,
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: colors.primary,
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: colors.primary,
        },
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        '& .MuiSlider-thumb': {
          '&:hover': {
            boxShadow: `0 0 0 8px rgba(255, 255, 0, 0.16)`,
          },
        },
        '& .MuiSlider-track': {
          backgroundColor: colors.primary,
        },
        '& .MuiSlider-rail': {
          backgroundColor: colors.grey[300],
        },
      },
    },
  },
};
