import { describe, expect, it } from 'vitest';

import { colors } from './colors';
import { themeComponents } from './components';
import theme from './index';

describe('tema (paleta amarela do projeto)', () => {
  it('compõe paleta, tipografia e as 29 famílias de componente sem perder nenhuma', () => {
    expect(Object.keys(themeComponents)).toHaveLength(29);
    expect(theme.palette.primary.main).toBe(colors.primary);
    expect(theme.palette.secondary.main).toBe(colors.secondary);
    expect(theme.typography.fontFamily).toContain('Roboto');
  });

  it('cada grupo de componentes usa só chaves Mui* únicas (nenhum sobrescreve o outro)', () => {
    const keys = Object.keys(themeComponents);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key.startsWith('Mui')).toBe(true);
  });
});
