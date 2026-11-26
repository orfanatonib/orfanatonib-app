import { ptBR } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';

/**
 * Mobile first: no celular (abaixo de `md`) todo alvo de toque tem pelo menos 44 px.
 *
 * O app usa o tema padrão do MUI (o `theme/index.ts` com a paleta amarela não é aplicado). Este tema parte do padrão
 * e só acrescenta esse piso e os textos em português dos componentes do MUI (paginação, seletor de data…): a aparência
 * não muda. Telas que precisam de mais definem o próprio `minHeight`.
 */
export const MOBILE_MEDIA_QUERY = '@media (max-width:899.95px)';
export const TOUCH_TARGET_PX = 44;

const mobile = { [MOBILE_MEDIA_QUERY]: { minHeight: TOUCH_TARGET_PX } };

export const appTheme = createTheme(
  {
    components: {
      MuiButton: { styleOverrides: { root: mobile } },
      MuiToggleButton: { styleOverrides: { root: mobile } },
      MuiIconButton: {
        styleOverrides: {
          root: { [MOBILE_MEDIA_QUERY]: { minWidth: TOUCH_TARGET_PX, minHeight: TOUCH_TARGET_PX } },
        },
      },
      MuiChip: {
        styleOverrides: { root: { [MOBILE_MEDIA_QUERY]: { '&.MuiChip-clickable': { minHeight: TOUCH_TARGET_PX } } } },
      },
      MuiFab: {
        styleOverrides: {
          root: { [MOBILE_MEDIA_QUERY]: { '&.MuiFab-sizeSmall': { width: TOUCH_TARGET_PX, height: TOUCH_TARGET_PX, minHeight: TOUCH_TARGET_PX } } },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: { [MOBILE_MEDIA_QUERY]: { minWidth: TOUCH_TARGET_PX, height: TOUCH_TARGET_PX, borderRadius: TOUCH_TARGET_PX } },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            [MOBILE_MEDIA_QUERY]: { minHeight: TOUCH_TARGET_PX, boxSizing: 'border-box', display: 'flex', alignItems: 'center' },
          },
        },
      },
    },
  },
  ptBR
);
