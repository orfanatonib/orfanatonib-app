import type { SxProps, Theme } from '@mui/material';

export const VISIT_EDITOR_TEST_ID = 'visit-material-page-editor';

export const VISIT_EDITOR_HEADINGS = {
  CREATE: '➕ Adicionar Material de Visita',
  EDIT: '✏️ Editar Material de Visita',
} as const;

export const VISIT_TABS_SX: SxProps<Theme> = {
  mb: 3,
  borderBottom: 1,
  borderColor: 'divider',
  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    minHeight: 56,
    fontSize: '0.95rem',
    '&.Mui-selected': { color: 'primary.main' },
  },
};
