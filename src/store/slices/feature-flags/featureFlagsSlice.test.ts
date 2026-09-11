import { describe, expect, it } from 'vitest';

import { DEFAULT_FEATURE_FLAGS_MAP } from '@/features/feature-flags/constants';
import type { FeatureFlagsMap } from '@/features/feature-flags/types';

import reducer, {
  clearError,
  fetchFeatureFlags,
  resetFeatureFlags,
} from './featureFlagsSlice';

/**
 * O estado das flags decide rota e menu, então cada transição importa: um
 * `loading` que não termina esconde a tela; um erro que zera o mapa some com
 * áreas inteiras.
 */
const initial = reducer(undefined, { type: '@@INIT' });

const fulfilled = (flags: FeatureFlagsMap) => ({
  type: fetchFeatureFlags.fulfilled.type,
  payload: flags,
});

describe('featureFlagsSlice', () => {
  it('parte dos padrões locais, sem nunca ter buscado', () => {
    expect(initial.flags).toEqual(DEFAULT_FEATURE_FLAGS_MAP);
    expect(initial.loading).toBe(false);
    expect(initial.error).toBeNull();
    // `null` é o que distingue "ainda não buscou" de "buscou e veio vazio".
    expect(initial.lastFetched).toBeNull();
  });

  it('marca carregamento e limpa o erro anterior ao buscar', () => {
    const withError = { ...initial, error: 'falha anterior' };

    const state = reducer(withError, { type: fetchFeatureFlags.pending.type });

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('guarda o mapa recebido e registra quando buscou', () => {
    const state = reducer(
      initial,
      fulfilled({ 'shelter-address': false, 'nova-flag': true }),
    );

    expect(state.flags).toEqual({
      'shelter-address': false,
      'nova-flag': true,
    });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  it('em falha, cai nos padrões locais em vez de esvaziar o mapa', () => {
    const state = reducer(initial, {
      type: fetchFeatureFlags.rejected.type,
      payload: 'rede indisponível',
    });

    expect(state.flags).toEqual(DEFAULT_FEATURE_FLAGS_MAP);
    expect(state.error).toBe('rede indisponível');
    expect(state.loading).toBe(false);
    // Também marca a tentativa: sem isso, as rotas ficariam presas no spinner.
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  it('usa a mensagem padrão quando a falha não traz uma', () => {
    const state = reducer(initial, {
      type: fetchFeatureFlags.rejected.type,
      payload: undefined,
    });

    expect(state.error).toBeTruthy();
  });

  it('clearError apaga só o erro', () => {
    const withError = { ...initial, error: 'falha', flags: { a: true } };

    const state = reducer(withError, clearError());

    expect(state.error).toBeNull();
    expect(state.flags).toEqual({ a: true });
  });

  it('reset volta aos padrões e esquece que já buscou', () => {
    const loaded = reducer(initial, fulfilled({ a: true }));

    const state = reducer(loaded, resetFeatureFlags());

    expect(state.flags).toEqual(DEFAULT_FEATURE_FLAGS_MAP);
    expect(state.lastFetched).toBeNull();
    expect(state.error).toBeNull();
  });
});
