import type { SxProps, Theme } from '@mui/material';

/** Estilo dos campos de texto dos criadores de página (idêntico ao anterior). */
export const PAGE_FIELD_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    transition: 'all 0.2s ease',
    '&:hover:not(.Mui-error)': {
      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
    },
  },
  '& .MuiFormHelperText-root': { marginLeft: 0, marginTop: 1, fontSize: '0.75rem' },
};

export const PAGE_PAPER_SX: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  mb: 4,
  borderRadius: 3,
  bgcolor: 'background.paper',
};

export const PAGE_ACTION_BUTTON_SX: SxProps<Theme> = {
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  px: 4,
  py: 1.5,
  transition: 'all 0.2s ease',
};
