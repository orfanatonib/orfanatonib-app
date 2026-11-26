export enum PageTemplateType {
  VISIT_MATERIALS = 'VISIT_MATERIALS',
  MEDITATION = 'MEDITATION',
  GALLERY = 'GALLERY',
  VIDEOS = 'VIDEOS',
  IDEAS = 'IDEAS',
}

export type IconType = 'visit' | 'meditation' | 'gallery' | 'videos' | 'ideas';

export interface PageTemplateOption {
  key: PageTemplateType;
  title: string;
  subtitle: string;
  description: string;
  iconName: IconType;
  /** Segmento da subrota: /adm/criar-pagina/<path> */
  path: string;
  testId: string;
}
