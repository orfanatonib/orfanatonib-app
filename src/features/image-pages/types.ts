import type { RouteData } from '@/store/slices/route/routeSlice';
import type { SectionData } from '@/store/slices/image-section/imageSectionSlice';

export type { SectionData };

/** Galeria como a API devolve (`ImagePageResponseDto`). */
export interface ImagePageData {
  id?: string;
  public: boolean;
  title?: string | '';
  description: string;
  createdAt?: string;
  updatedAt?: string;
  sections: SectionData[];
  route?: RouteData;
}

/** Estado navegado do gerenciador para o editor: a galeria que será editada. */
export interface ImagePageEditState {
  imagePage: ImagePageData;
}
