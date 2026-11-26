import {
  VISIT_MATERIAL_CATEGORY_LABELS,
  VISIT_MATERIAL_CATEGORY_ORDER,
  VISIT_MATERIAL_DESCRIPTION_MAX_LENGTH,
  VISIT_MATERIAL_MEDIA_CONFIG,
  VISIT_MATERIAL_SECTION_CATEGORIES,
} from './constants';
import {
  ListVisitMaterialsQueryDto,
  TestamentType,
  VisitMaterialCategory,
  VisitMaterialCategoryDraft,
  VisitMaterialCategoryDrafts,
  VisitMaterialSectionCategory,
  VisitMaterialSectionResponseDto,
  VisitMaterialListTab,
  VisitMaterialMediaSection,
  VisitMaterialMediaSectionView,
  VisitMaterialPageResponseDto,
} from './types';

export const truncate = (
  text: string,
  max = VISIT_MATERIAL_DESCRIPTION_MAX_LENGTH,
): string => (text.length > max ? `${text.slice(0, max)}...` : text);

export const formatDate = (date?: string): string =>
  date ? new Date(date).toLocaleString('pt-BR') : 'Não disponível';

export const buildVisitMaterialQuery = (
  search: string,
  testament?: TestamentType,
  category?: VisitMaterialSectionCategory,
): ListVisitMaterialsQueryDto => ({
  ...(testament ? { testament } : {}),
  ...(category ? { category } : {}),
  ...(search.trim() ? { searchString: search.trim() } : {}),
});

export const testamentFromTab = (
  tab: VisitMaterialListTab,
): TestamentType | undefined => {
  switch (tab) {
    case VisitMaterialListTab.OLD_TESTAMENT:
      return TestamentType.OLD_TESTAMENT;
    case VisitMaterialListTab.NEW_TESTAMENT:
      return TestamentType.NEW_TESTAMENT;
    case VisitMaterialListTab.ALL:
      return undefined;
  }
};

export const tabFromTestament = (
  testament?: TestamentType,
): VisitMaterialListTab => {
  switch (testament) {
    case TestamentType.OLD_TESTAMENT:
      return VisitMaterialListTab.OLD_TESTAMENT;
    case TestamentType.NEW_TESTAMENT:
      return VisitMaterialListTab.NEW_TESTAMENT;
    default:
      return VisitMaterialListTab.ALL;
  }
};

export const buildVisitMaterialMediaSections = (
  material: VisitMaterialPageResponseDto,
): VisitMaterialMediaSectionView[] =>
  Object.values(VisitMaterialMediaSection)
    .map((kind) => ({
      kind,
      label: VISIT_MATERIAL_MEDIA_CONFIG[kind].label,
      items: material[kind],
      icon: VISIT_MATERIAL_MEDIA_CONFIG[kind].icon,
      color: VISIT_MATERIAL_MEDIA_CONFIG[kind].color,
    }))
    .filter((section) => section.items.length > 0);

type MediaBuckets = Pick<
  VisitMaterialPageResponseDto,
  'videos' | 'documents' | 'images' | 'audios'
>;

const bucketsOf = (source: MediaBuckets): MediaBuckets => ({
  videos: source.videos,
  documents: source.documents,
  images: source.images,
  audios: source.audios,
});

type MediaCounts = Record<
  'videos' | 'documents' | 'images' | 'audios',
  readonly unknown[]
>;

const countMedia = (source: MediaCounts): number =>
  source.videos.length +
  source.documents.length +
  source.images.length +
  source.audios.length;

export const emptyCategoryDraft = (): VisitMaterialCategoryDraft => ({
  title: '',
  description: '',
  videos: [],
  documents: [],
  images: [],
  audios: [],
});

export const emptyCategoryDrafts = (): VisitMaterialCategoryDrafts => ({
  [VisitMaterialCategory.GENERAL]: emptyCategoryDraft(),
  [VisitMaterialCategory.BABY]: emptyCategoryDraft(),
  [VisitMaterialCategory.CHILD]: emptyCategoryDraft(),
  [VisitMaterialCategory.TEEN]: emptyCategoryDraft(),
  [VisitMaterialCategory.ADULT]: emptyCategoryDraft(),
});

/** Quantas mídias o rascunho de uma categoria tem. */
export const categoryDraftMediaCount = (
  draft: VisitMaterialCategoryDraft,
): number => countMedia(draft);

/** Uma categoria só vira seção se tiver mídia ou algum texto próprio. */
export const isCategoryDraftFilled = (
  draft: VisitMaterialCategoryDraft,
): boolean =>
  categoryDraftMediaCount(draft) > 0 ||
  draft.title.trim() !== '' ||
  draft.description.trim() !== '';

/** Monta os rascunhos do editor a partir da página: Geral = mídias da página; as demais, as seções. */
export const draftsFromMaterial = (
  material: VisitMaterialPageResponseDto,
): VisitMaterialCategoryDrafts => {
  const drafts = emptyCategoryDrafts();
  drafts[VisitMaterialCategory.GENERAL] = {
    ...emptyCategoryDraft(),
    videos: material.videos,
    documents: material.documents,
    images: material.images,
    audios: material.audios,
  };
  for (const section of material.sections ?? []) {
    drafts[section.category] = {
      title: section.title ?? '',
      description: section.description ?? '',
      videos: section.videos,
      documents: section.documents,
      images: section.images,
      audios: section.audios,
    };
  }
  return drafts;
};

/** Uma categoria como a página pública e o detalhe a exibem. */
export interface VisitMaterialCategoryView {
  category: VisitMaterialCategory;
  label: string;
  title: string | null;
  description: string | null;
  mediaSections: VisitMaterialMediaSectionView[];
  totalMedia: number;
}

const toMediaSectionViews = (
  source: MediaBuckets,
): VisitMaterialMediaSectionView[] =>
  Object.values(VisitMaterialMediaSection)
    .map((kind) => ({
      kind,
      label: VISIT_MATERIAL_MEDIA_CONFIG[kind].label,
      items: source[kind],
      icon: VISIT_MATERIAL_MEDIA_CONFIG[kind].icon,
      color: VISIT_MATERIAL_MEDIA_CONFIG[kind].color,
    }))
    .filter((section) => section.items.length > 0);

const sectionOf = (
  sections: readonly VisitMaterialSectionResponseDto[],
  category: VisitMaterialSectionCategory,
): VisitMaterialSectionResponseDto | undefined =>
  sections.find((section) => section.category === category);

/**
 * Categorias com conteúdo, na ordem fixa (Geral primeiro). Página antiga, sem seções, devolve só o Geral, então a tela
 * não muda para o que já existe.
 */
export const buildVisitMaterialCategoryViews = (
  material: VisitMaterialPageResponseDto,
): VisitMaterialCategoryView[] =>
  VISIT_MATERIAL_CATEGORY_ORDER.flatMap((category): VisitMaterialCategoryView[] => {
    if (category === VisitMaterialCategory.GENERAL) {
      const total = countMedia(material);
      return total === 0
        ? []
        : [
            {
              category,
              label: VISIT_MATERIAL_CATEGORY_LABELS[category],
              title: null,
              description: null,
              mediaSections: toMediaSectionViews(bucketsOf(material)),
              totalMedia: total,
            },
          ];
    }
    const section = sectionOf(material.sections ?? [], category);
    if (!section) return [];
    const total = countMedia(section);
    return total === 0 && !section.description
      ? []
      : [
          {
            category,
            label: VISIT_MATERIAL_CATEGORY_LABELS[category],
            title: section.title,
            description: section.description,
            mediaSections: toMediaSectionViews(bucketsOf(section)),
            totalMedia: total,
          },
        ];
  });

/** Categorias que a página cobre (para as etiquetas do cartão); o Geral só conta se for a única. */
export const materialCategoryLabels = (
  material: VisitMaterialPageResponseDto,
): string[] =>
  VISIT_MATERIAL_SECTION_CATEGORIES.filter((category) =>
    (material.sections ?? []).some((section) => section.category === category),
  ).map((category) => VISIT_MATERIAL_CATEGORY_LABELS[category]);
