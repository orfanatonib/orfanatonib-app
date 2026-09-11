import { describe, expect, it } from 'vitest';

import type { RootState } from '../slices';

import {
  selectAllFeatureFlags,
  selectFeatureFlagsError,
  selectFeatureFlagsLastFetched,
  selectFeatureFlagsLoading,
  selectIsFeatureEnabled,
} from './featureFlagsSelectors';

const stateWith = (
  overrides: Partial<RootState['featureFlags']> = {},
): RootState =>
  ({
    featureFlags: {
      flags: { 'shelter-address': true, 'shelter-pagelas': false },
      loading: false,
      error: null,
      lastFetched: 1_700_000_000_000,
      ...overrides,
    },
  }) as RootState;

describe('featureFlagsSelectors', () => {
  it('lê o mapa, o carregamento, o erro e a última busca', () => {
    const state = stateWith({ loading: true, error: 'falha' });

    expect(selectAllFeatureFlags(state)).toHaveProperty('shelter-address');
    expect(selectFeatureFlagsLoading(state)).toBe(true);
    expect(selectFeatureFlagsError(state)).toBe('falha');
    expect(selectFeatureFlagsLastFetched(state)).toBe(1_700_000_000_000);
  });

  it('selectIsFeatureEnabled responde pela flag pedida', () => {
    const state = stateWith();

    expect(selectIsFeatureEnabled('shelter-address')(state)).toBe(true);
    expect(selectIsFeatureEnabled('shelter-pagelas')(state)).toBe(false);
  });

  it('flag desconhecida é falsa, não indefinida', () => {
    // Quem consome usa o retorno direto num `if`: `undefined` vazaria como
    // falso por acidente, e um `?? false` explícito deixa a regra visível.
    expect(selectIsFeatureEnabled('nao-existe')(stateWith())).toBe(false);
  });
});
