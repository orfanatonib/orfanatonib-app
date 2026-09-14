import {
  VISIT_MATERIAL_DESCRIPTION_MAX_LENGTH,
  VISIT_MATERIAL_MEDIA_CONFIG,
} from './constants';
import {
  ListVisitMaterialsQueryDto,
  TestamentType,
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
): ListVisitMaterialsQueryDto => ({
  ...(testament ? { testament } : {}),
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
