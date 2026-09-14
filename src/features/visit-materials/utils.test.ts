import { describe, expect, it } from 'vitest';
import { MediaType, MediaUploadType } from '@/store/slices/types';
import {
  buildVisitMaterialMediaSections,
  buildVisitMaterialQuery,
  tabFromTestament,
  testamentFromTab,
} from './utils';
import {
  TestamentType,
  VisitMaterialListTab,
  VisitMaterialMediaSection,
  VisitMaterialPageResponseDto,
} from './types';

describe('visit material utilities', () => {
  it('drops a blank search and trims a real query', () => {
    expect(buildVisitMaterialQuery('   ')).toEqual({});
    expect(
      buildVisitMaterialQuery('  gênesis  ', TestamentType.OLD_TESTAMENT),
    ).toEqual({
      searchString: 'gênesis',
      testament: TestamentType.OLD_TESTAMENT,
    });
  });

  it('maps list tabs without magic strings', () => {
    expect(testamentFromTab(VisitMaterialListTab.ALL)).toBeUndefined();
    expect(testamentFromTab(VisitMaterialListTab.NEW_TESTAMENT)).toBe(
      TestamentType.NEW_TESTAMENT,
    );
    expect(tabFromTestament(TestamentType.OLD_TESTAMENT)).toBe(
      VisitMaterialListTab.OLD_TESTAMENT,
    );
  });

  it('builds only non-empty media sections in their domain order', () => {
    const media = {
      id: 'video-id',
      title: 'Vídeo',
      description: 'Descrição',
      uploadType: MediaUploadType.LINK,
      mediaType: MediaType.VIDEO,
      url: 'https://youtube.test/watch',
    };
    const material: VisitMaterialPageResponseDto = {
      id: 'page-id',
      title: 'Gênesis',
      subtitle: 'A criação',
      description: 'Descrição',
      testament: TestamentType.OLD_TESTAMENT,
      currentWeek: false,
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
      route: {
        id: 'route-id',
        path: 'materiais_visita_genesis',
        title: 'Gênesis',
        subtitle: 'A criação',
        description: 'Descrição',
        type: 'page',
        public: true,
      },
      videos: [media],
      documents: [],
      images: [],
      audios: [],
    };

    expect(buildVisitMaterialMediaSections(material)).toMatchObject([
      { kind: VisitMaterialMediaSection.VIDEOS, items: [media] },
    ]);
  });
});
