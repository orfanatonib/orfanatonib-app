import { describe, expect, it } from 'vitest';

import { DEFAULT_FEATURE_FLAGS_MAP } from '@/features/feature-flags/constants';

import reducer, { fetchFeatureFlags, resetFeatureFlags } from './featureFlagsSlice';

type State = ReturnType<typeof reducer>;

const start = (state: State, requestId: string) =>
  reducer(state, fetchFeatureFlags.pending(requestId));
const ok = (state: State, requestId: string, map: Record<string, boolean>) =>
  reducer(state, fetchFeatureFlags.fulfilled(map as never, requestId));
const fail = (state: State, requestId: string) =>
  reducer(state, fetchFeatureFlags.rejected(null, requestId, undefined, 'rede'));

const initial = (): State => reducer(undefined, { type: 'init' });

describe('featureFlagsSlice', () => {
  it('começa com o padrão do catálogo e sem resposta do servidor', () => {
    const state = initial();
    expect(state.flags).toEqual(DEFAULT_FEATURE_FLAGS_MAP);
    expect(state.loadedFromServer).toBe(false);
    expect(state.lastFetched).toBeNull();
  });

  it('resposta do servidor substitui o mapa e marca como carregado', () => {
    let state = start(initial(), 'r1');
    expect(state.loading).toBe(true);
    state = ok(state, 'r1', { ...DEFAULT_FEATURE_FLAGS_MAP, about_page: false });
    expect(state.flags.about_page).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.loadedFromServer).toBe(true);
    expect(state.lastFetched).not.toBeNull();
  });

  it('resposta de uma requisição ANTIGA (outro perfil) é ignorada', () => {
    let state = start(initial(), 'r1');
    state = start(state, 'r2');
    state = ok(state, 'r1', { ...DEFAULT_FEATURE_FLAGS_MAP, about_page: false });
    expect(state.flags.about_page).toBe(DEFAULT_FEATURE_FLAGS_MAP.about_page);
    expect(state.loading).toBe(true);
    state = ok(state, 'r2', { ...DEFAULT_FEATURE_FLAGS_MAP, about_page: false });
    expect(state.flags.about_page).toBe(false);
  });

  it('falha de rede DEPOIS de uma resposta real mantém o que o servidor disse (não religa o que o admin desligou)', () => {
    let state = ok(start(initial(), 'r1'), 'r1', { ...DEFAULT_FEATURE_FLAGS_MAP, about_page: false });
    state = fail(start(state, 'r2'), 'r2');
    expect(state.flags.about_page).toBe(false);
    expect(state.error).toBe('rede');
    expect(state.loading).toBe(false);
  });

  it('falha de rede SEM resposta anterior usa o padrão do catálogo (a API segue mandando)', () => {
    const state = fail(start(initial(), 'r1'), 'r1');
    expect(state.flags).toEqual(DEFAULT_FEATURE_FLAGS_MAP);
    expect(state.error).toBe('rede');
  });

  it('resetFeatureFlags (logout/troca de sessão) volta ao padrão e esquece a resposta anterior', () => {
    let state = ok(start(initial(), 'r1'), 'r1', { ...DEFAULT_FEATURE_FLAGS_MAP, about_page: false });
    state = reducer(state, resetFeatureFlags());
    expect(state.flags).toEqual(DEFAULT_FEATURE_FLAGS_MAP);
    expect(state.loadedFromServer).toBe(false);
    expect(state.lastFetched).toBeNull();
  });
});
