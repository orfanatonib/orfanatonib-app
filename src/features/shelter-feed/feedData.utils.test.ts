import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';
import {
  buildFeedSectionsQuery,
  buildMonogram,
  filterFeedSections,
  flattenFeedPhotos,
  formatRelativeFeedDate,
  groupSectionsByMonth,
  hasNextFeedPage,
  mergeFeedPages,
  resolveFeedMediaPreviewUrl,
  toFeedSectionViewModel,
} from './feedData.utils';
import type { FeedMediaItemDto, FeedPageDto, FeedSectionData } from './types';

const media = (over: Partial<FeedMediaItemDto> = {}): FeedMediaItemDto => ({
  title: '',
  description: '',
  mediaType: MediaType.IMAGE,
  uploadType: MediaUploadType.UPLOAD,
  url: 'https://x.test/a.png',
  ...over,
});
const section = (id: string, over: Partial<FeedSectionData> = {}): FeedSectionData => ({
  id,
  public: true,
  caption: `Visita ${id}`,
  description: 'Conversa com as crianças',
  mediaItems: [media()],
  createdAt: '2026-03-10T12:00:00.000Z',
  ...over,
});
const page = (n: number, ids: string[], total = 10): FeedPageDto => ({
  id: 'g', title: 't', description: 'd', public: true, createdAt: '', updatedAt: '',
  sections: ids.map((id) => section(id)), page: n, limit: 2, total,
});

describe('buildFeedSectionsQuery', () => {
  it('limita o lote a 50 e corrige valores inválidos', () => {
    expect(buildFeedSectionsQuery(0, 1000)).toEqual({ page: 1, limit: 50 });
    expect(buildFeedSectionsQuery(Number.NaN, -3)).toEqual({ page: 1, limit: 6 });
    expect(buildFeedSectionsQuery(3, 6)).toEqual({ page: 3, limit: 6 });
  });
});

describe('hasNextFeedPage / mergeFeedPages', () => {
  it('detecta próxima página pelo total', () => {
    expect(hasNextFeedPage({ page: 1, limit: 6, total: 7 })).toBe(true);
    expect(hasNextFeedPage({ page: 2, limit: 6, total: 12 })).toBe(false);
  });
  it('mescla páginas sem duplicar seções e guarda o total da última', () => {
    const merged = mergeFeedPages([page(1, ['a', 'b']), page(2, ['b', 'c'], 11)]);
    expect(merged.sections.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(merged.total).toBe(11);
    expect(merged.pageMeta?.page).toBe(2);
  });
  it('sem páginas devolve vazio', () => {
    expect(mergeFeedPages(undefined)).toEqual({ pageMeta: null, sections: [], total: 0 });
  });
});

describe('resolveFeedMediaPreviewUrl', () => {
  it('Google Drive vira miniatura; upload e vídeo ficam como estão', () => {
    const drive = media({ uploadType: MediaUploadType.LINK, platformType: MediaPlatform.GOOGLE_DRIVE, url: 'https://drive.google.com/file/d/ABC/view' });
    expect(resolveFeedMediaPreviewUrl(drive)).toContain('thumbnail?id=ABC');
    expect(resolveFeedMediaPreviewUrl(media())).toBe('https://x.test/a.png');
    expect(resolveFeedMediaPreviewUrl(media({ mediaType: MediaType.VIDEO, url: ' https://v.test/a.mp4 ' }))).toBe('https://v.test/a.mp4');
    expect(resolveFeedMediaPreviewUrl(media({ url: '  ' }))).toBe('');
  });
});

describe('toFeedSectionViewModel', () => {
  it('normaliza título, mídia, autoria e contadores', () => {
    const vm = toFeedSectionViewModel(
      section('s1', { caption: '  ', author: { displayName: 'Maria L.' }, celebrationCount: 2, commentCount: 1, mediaItems: [media(), media({ url: '' })] }),
    );
    expect(vm.caption).toBe('Momento no abrigo');
    expect(vm.mediaCount).toBe(1);
    expect(vm.monogram).toBe('ML');
    expect(vm.anchorId).toBe('publicacao-feed-s1');
    expect(vm.celebrationCount).toBe(2);
    expect(vm.commentCount).toBe(1);
  });
  it('capa é a primeira FOTO, mesmo com o vídeo vindo antes; só vídeo => sem capa', () => {
    const photo = media({ mediaType: MediaType.IMAGE, url: 'https://x.test/foto.png' });
    const video = media({ mediaType: MediaType.VIDEO, url: 'https://x.test/visita.mp4' });
    expect(toFeedSectionViewModel(section('m', { mediaItems: [video, photo] })).coverUrl).toBe('https://x.test/foto.png');
    expect(toFeedSectionViewModel(section('v', { mediaItems: [video] })).coverUrl).toBe('');
  });
  it('detecta vídeo e data inválida', () => {
    const vm = toFeedSectionViewModel(section('v', { createdAt: 'x', mediaItems: [media({ mediaType: MediaType.VIDEO })] }));
    expect(vm.isVideo).toBe(true);
    expect(vm.createdAtIso).toBeNull();
    expect(vm.formattedDate).toBe('—');
  });
});

describe('filterFeedSections / flattenFeedPhotos', () => {
  const vms = [
    toFeedSectionViewModel(section('a', { caption: 'Visita ao Lar Esperança' })),
    toFeedSectionViewModel(section('b', { caption: 'Festa', mediaItems: [media(), media({ url: 'https://x.test/b.png' })] })),
  ];
  it('busca sem acento e sem diferenciar caixa', () => {
    expect(filterFeedSections(vms, 'esperanca').map((s) => s.id)).toEqual(['a']);
    expect(filterFeedSections(vms, '   ')).toHaveLength(2);
    expect(filterFeedSections(vms, 'zzz')).toHaveLength(0);
  });
  it('achata as mídias com o índice dentro da publicação', () => {
    const photos = flattenFeedPhotos(vms);
    expect(photos).toHaveLength(3);
    expect(photos[2]).toMatchObject({ sectionId: 'b', mediaIndex: 1, totalInSection: 2 });
  });
});

describe('groupSectionsByMonth', () => {
  it('agrupa por mês preservando a ordem e isola datas inválidas', () => {
    const groups = groupSectionsByMonth([
      toFeedSectionViewModel(section('a', { createdAt: '2026-03-20T12:00:00.000Z' })),
      toFeedSectionViewModel(section('b', { createdAt: '2026-03-05T12:00:00.000Z' })),
      toFeedSectionViewModel(section('c', { createdAt: '2026-02-10T12:00:00.000Z' })),
      toFeedSectionViewModel(section('d', { createdAt: 'lixo' })),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['2026-03', '2026-02', 'sem-data']);
    expect(groups[0].sections.map((s) => s.id)).toEqual(['a', 'b']);
    expect(groups[0].label).toBe('março de 2026');
  });
});

describe('datas e iniciais', () => {
  const ref = new Date(2026, 2, 10, 15);
  it('rótulo relativo', () => {
    expect(formatRelativeFeedDate(new Date(2026, 2, 10, 8).toISOString(), ref)).toBe('Hoje');
    expect(formatRelativeFeedDate(new Date(2026, 2, 9).toISOString(), ref)).toBe('Ontem');
    expect(formatRelativeFeedDate(new Date(2026, 2, 5).toISOString(), ref)).toBe('Há 5 dias');
    expect(formatRelativeFeedDate(new Date(2025, 0, 2).toISOString(), ref)).toBe('2 jan 2025');
    expect(formatRelativeFeedDate(null, ref)).toBe('Recente');
  });
  it('monograma', () => {
    expect(buildMonogram('')).toBe('NIB');
    expect(buildMonogram('Maria Lima')).toBe('ML');
    expect(buildMonogram('visita')).toBe('VI');
  });
});
