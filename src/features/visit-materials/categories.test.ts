import { describe, expect, it } from 'vitest';
import { MediaType, MediaUploadType } from '@/store/slices/types';
import { VISIT_MATERIAL_PAYLOAD_FIELD } from './constants';
import { buildVisitMaterialFormData } from './payload';
import {
  TestamentType,
  UpdateVisitMaterialPageRequestDto,
  VisitMaterialCategory,
  VisitMaterialCategoryDraft,
  VisitMaterialMediaResponseDto,
  VisitMaterialPageResponseDto,
  VisitMaterialSectionResponseDto,
} from './types';
import {
  buildVisitMaterialCategoryViews,
  buildVisitMaterialQuery,
  draftsFromMaterial,
  emptyCategoryDraft,
  isCategoryDraftFilled,
  materialCategoryLabels,
} from './utils';

const media = (id: string, mediaType = MediaType.DOCUMENT): VisitMaterialMediaResponseDto => ({
  id,
  title: id,
  description: '',
  uploadType: MediaUploadType.LINK,
  mediaType,
  url: `https://example.test/${id}`,
});

const section = (
  category: VisitMaterialSectionResponseDto['category'],
  over: Partial<VisitMaterialSectionResponseDto> = {},
): VisitMaterialSectionResponseDto => ({
  id: `s-${category}`,
  category,
  title: null,
  description: null,
  position: 0,
  videos: [],
  documents: [],
  images: [],
  audios: [],
  ...over,
});

const material = (over: Partial<VisitMaterialPageResponseDto> = {}): VisitMaterialPageResponseDto => ({
  id: 'page',
  title: 'Sansão',
  subtitle: 'Juízes 13',
  description: 'Descrição',
  testament: TestamentType.OLD_TESTAMENT,
  currentWeek: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  route: { id: 'r', path: 'materiais_visita_sansao', title: '', subtitle: '', description: '', type: 'page', public: true },
  videos: [],
  documents: [],
  images: [],
  audios: [],
  sections: [],
  ...over,
});

describe('buildVisitMaterialCategoryViews', () => {
  it('uma página antiga (sem seções) mostra só o Geral, como antes', () => {
    const views = buildVisitMaterialCategoryViews(material({ documents: [media('d1')] }));
    expect(views.map((view) => view.category)).toEqual([VisitMaterialCategory.GENERAL]);
    expect(views[0].mediaSections.map((item) => item.kind)).toEqual(['documents']);
  });

  it('põe o Geral primeiro e as faixas na ordem, ignorando as vazias', () => {
    const views = buildVisitMaterialCategoryViews(
      material({
        documents: [media('geral')],
        sections: [
          section(VisitMaterialCategory.TEEN, { documents: [media('t1')] }),
          section(VisitMaterialCategory.BABY, { documents: [media('b1')], title: 'Para os pequenos' }),
          section(VisitMaterialCategory.ADULT),
        ],
      }),
    );
    expect(views.map((view) => view.category)).toEqual([
      VisitMaterialCategory.GENERAL,
      VisitMaterialCategory.BABY,
      VisitMaterialCategory.TEEN,
    ]);
    expect(views[1].title).toBe('Para os pequenos');
    expect(views[1].totalMedia).toBe(1);
  });

  it('uma seção só com descrição continua aparecendo', () => {
    const views = buildVisitMaterialCategoryViews(
      material({ sections: [section(VisitMaterialCategory.CHILD, { description: 'Só um texto' })] }),
    );
    expect(views.map((view) => view.category)).toEqual([VisitMaterialCategory.CHILD]);
  });
});

describe('draftsFromMaterial / isCategoryDraftFilled', () => {
  it('o Geral recebe as mídias da página e cada faixa recebe a sua seção', () => {
    const drafts = draftsFromMaterial(
      material({
        videos: [media('v1', MediaType.VIDEO)],
        sections: [section(VisitMaterialCategory.CHILD, { title: 'Crianças', documents: [media('d1')] })],
      }),
    );
    expect(drafts[VisitMaterialCategory.GENERAL].videos).toHaveLength(1);
    expect(drafts[VisitMaterialCategory.CHILD].title).toBe('Crianças');
    expect(drafts[VisitMaterialCategory.CHILD].documents).toHaveLength(1);
    expect(drafts[VisitMaterialCategory.BABY]).toEqual(emptyCategoryDraft());
  });

  it('uma categoria vazia não vira seção; texto ou mídia, sim', () => {
    expect(isCategoryDraftFilled(emptyCategoryDraft())).toBe(false);
    expect(isCategoryDraftFilled({ ...emptyCategoryDraft(), title: '  ' })).toBe(false);
    expect(isCategoryDraftFilled({ ...emptyCategoryDraft(), description: 'x' })).toBe(true);
    expect(isCategoryDraftFilled({ ...emptyCategoryDraft(), documents: [media('d1')] })).toBe(true);
  });

  it('lista as faixas cobertas para as etiquetas do cartão', () => {
    expect(
      materialCategoryLabels(material({ sections: [section(VisitMaterialCategory.TEEN), section(VisitMaterialCategory.BABY)] })),
    ).toEqual(['Baby', 'Adolescentes']);
  });
});

describe('buildVisitMaterialFormData com categorias', () => {
  const base = {
    id: 'page-id',
    pageTitle: 'Sansão',
    pageSubtitle: 'Juízes',
    pageDescription: 'Descrição',
    testament: TestamentType.NEW_TESTAMENT,
    currentWeek: false,
    videos: [],
    documents: [],
    images: [],
    audios: [],
  };
  const payloadOf = (formData: FormData) =>
    JSON.parse(String(formData.get(VISIT_MATERIAL_PAYLOAD_FIELD))) as UpdateVisitMaterialPageRequestDto;
  const draft = (over: Partial<VisitMaterialCategoryDraft>): VisitMaterialCategoryDraft => ({ ...emptyCategoryDraft(), ...over });

  it('sem `sections` o payload não traz a chave (a API não mexe nas seções)', () => {
    expect(payloadOf(buildVisitMaterialFormData(base, 'update'))).not.toHaveProperty('sections');
  });

  it('manda só as categorias preenchidas e mantém o testamento', () => {
    const file = new File(['x'], 'baby.pdf', { type: 'application/pdf' });
    const formData = buildVisitMaterialFormData(
      {
        ...base,
        sections: {
          [VisitMaterialCategory.BABY]: draft({
            title: ' Baby ',
            documents: [{ title: 'PDF', description: '', mediaType: MediaType.DOCUMENT, uploadType: MediaUploadType.UPLOAD, url: '', file }],
          }),
          [VisitMaterialCategory.CHILD]: draft({}),
        },
      },
      'update',
    );
    const payload = payloadOf(formData);

    expect(payload.testament).toBe(TestamentType.NEW_TESTAMENT);
    expect(payload.sections?.map((item) => item.category)).toEqual([VisitMaterialCategory.BABY]);
    expect(payload.sections?.[0].title).toBe('Baby');
    // o campo do arquivo leva o prefixo da categoria e existe no multipart
    const fieldKey = payload.sections?.[0].documents[0].fieldKey ?? '';
    expect(fieldKey.startsWith('baby_')).toBe(true);
    expect(formData.get(fieldKey)).toBeInstanceOf(File);
  });

  it('lista vazia de seções é enviada (remove as seções que existiam)', () => {
    expect(payloadOf(buildVisitMaterialFormData({ ...base, sections: {} }, 'update')).sections).toEqual([]);
  });

  it('o mesmo arquivo no Geral e na faixa não colide', () => {
    const file = new File(['x'], 'a.pdf');
    const item = { title: 'a', description: '', mediaType: MediaType.DOCUMENT, uploadType: MediaUploadType.UPLOAD, url: '', file };
    const payload = payloadOf(
      buildVisitMaterialFormData(
        { ...base, documents: [item], sections: { [VisitMaterialCategory.TEEN]: draft({ documents: [item] }) } },
        'update',
      ),
    );
    expect(payload.documents[0].fieldKey).not.toBe(payload.sections?.[0].documents[0].fieldKey);
  });
});

describe('buildVisitMaterialQuery', () => {
  it('inclui a categoria só quando escolhida, junto com testamento e busca', () => {
    expect(buildVisitMaterialQuery('  ', undefined, undefined)).toEqual({});
    expect(buildVisitMaterialQuery(' sansão ', TestamentType.NEW_TESTAMENT, VisitMaterialCategory.TEEN)).toEqual({
      testament: TestamentType.NEW_TESTAMENT,
      category: VisitMaterialCategory.TEEN,
      searchString: 'sansão',
    });
  });
});
