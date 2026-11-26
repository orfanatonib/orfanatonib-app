import { describe, expect, it } from 'vitest';

import { FeatureFlagKeys } from './types';
import { ROUTE_TYPE_FLAG, filterVisibleRoutes, isRouteTypeEnabled } from './routeTypeFlags';

const on = (...enabled: FeatureFlagKeys[]) => (flag: FeatureFlagKeys) => enabled.includes(flag);

describe('ROUTE_TYPE_FLAG', () => {
  it('toda chave do mapa existe no catálogo de flags', () => {
    const known = new Set<string>(Object.values(FeatureFlagKeys));
    for (const flags of Object.values(ROUTE_TYPE_FLAG)) for (const flag of flags) expect(known.has(flag)).toBe(true);
  });

  it('tipo sem flag mapeada nunca é escondido', () => {
    expect(isRouteTypeEnabled('TipoNovo', on())).toBe(true);
  });

  it('com mais de uma flag basta UMA ligada (vídeo público ou de formação)', () => {
    expect(isRouteTypeEnabled('VideosPage', on(FeatureFlagKeys.TRAINING_VIDEOS))).toBe(true);
    expect(isRouteTypeEnabled('VideosPage', on(FeatureFlagKeys.PUBLIC_VIDEOS))).toBe(true);
    expect(isRouteTypeEnabled('VideosPage', on())).toBe(false);
  });

  it('filterVisibleRoutes tira só as rotas de tipo desligado, mantendo a ordem', () => {
    const routes = [
      { path: 'a', entityType: 'ImagesPage' },
      { path: 'b', entityType: 'shelterPage' },
      { path: 'c', entityType: 'ImagesPage' },
    ];
    expect(filterVisibleRoutes(routes, on(FeatureFlagKeys.PUBLIC_GALLERIES)).map((r) => r.path)).toEqual(['a', 'c']);
    expect(filterVisibleRoutes(routes, on())).toEqual([]);
  });
});
