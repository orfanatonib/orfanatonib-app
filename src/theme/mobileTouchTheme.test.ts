import { describe, expect, it } from 'vitest';

import { appTheme, MOBILE_MEDIA_QUERY, TOUCH_TARGET_PX } from './mobileTouchTheme';

describe('tema de alvos de toque', () => {
  it('mantém a paleta padrão do MUI (a aparência não muda)', () => {
    expect(appTheme.palette.primary.main).toBe('#1976d2');
  });
  it('botões, ícones, chips clicáveis e seletores têm piso de 44 px no celular', () => {
    const overrides = appTheme.components;
    const root = (name: 'MuiButton' | 'MuiIconButton' | 'MuiToggleButton') =>
      (overrides?.[name]?.styleOverrides as { root: Record<string, Record<string, unknown>> }).root[MOBILE_MEDIA_QUERY];
    expect(root('MuiButton').minHeight).toBe(TOUCH_TARGET_PX);
    expect(root('MuiToggleButton').minHeight).toBe(TOUCH_TARGET_PX);
    expect(root('MuiIconButton')).toMatchObject({ minWidth: TOUCH_TARGET_PX, minHeight: TOUCH_TARGET_PX });
    const select = (overrides?.MuiSelect?.styleOverrides as { select: Record<string, Record<string, unknown>> }).select[MOBILE_MEDIA_QUERY];
    expect(select.minHeight).toBe(TOUCH_TARGET_PX);
  });
  it('textos dos componentes do MUI em português', () => {
    expect(appTheme.components?.MuiTablePagination?.defaultProps?.labelRowsPerPage).toMatch(/página/i);
  });
});
