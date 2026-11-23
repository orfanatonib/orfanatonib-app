import { describe, expect, it } from 'vitest';

import type { RouteData } from '@/store/slices/route/routeSlice';

import { PublicMediaFilter, PublicMediaKind } from './constants';
import { countByKind, filterPublicMediaItems, selectPublicMediaItems } from './utils';

const route = (over: Partial<RouteData>): RouteData =>
  ({
    id: 'r', title: 'Título', description: '', public: true, entityType: 'ImagesPage',
    idToFetch: 'abc', path: 'x', image: null, ...over,
  }) as RouteData;

describe('selectPublicMediaItems', () => {
  it('só fotos e vídeos públicos, com o endereço próprio', () => {
    const items = selectPublicMediaItems([
      route({ id: '1', idToFetch: 'p1' }),
      route({ id: '2', idToFetch: 'v1', entityType: 'VideosPage' }),
      route({ id: '3', public: false }),
      route({ id: '4', entityType: 'IdeasPage' }),
    ]);
    expect(items.map((i) => i.path)).toEqual(['/fotos-e-videos/fotos/p1', '/fotos-e-videos/videos/v1']);
  });

  it('tira a galeria do feed', () => {
    expect(selectPublicMediaItems([route({ idToFetch: 'feed' })], ['feed'])).toEqual([]);
  });
});

describe('filtros', () => {
  const items = selectPublicMediaItems([
    route({ id: '1', idToFetch: 'p1', title: 'Natal' }),
    route({ id: '2', idToFetch: 'v1', entityType: 'VideosPage', title: 'Culto' }),
  ]);
  it('filtra por tipo e busca', () => {
    expect(filterPublicMediaItems(items, PublicMediaFilter.Videos, '')).toHaveLength(1);
    expect(filterPublicMediaItems(items, PublicMediaFilter.All, 'natal')).toHaveLength(1);
    expect(filterPublicMediaItems(items, PublicMediaFilter.All, 'zzz')).toHaveLength(0);
  });
  it('conta por tipo', () => {
    expect(countByKind(items, PublicMediaKind.Photos)).toBe(1);
  });
});
