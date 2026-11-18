/** Mídia como a API devolve. Ideia não aceita áudio. */
export interface MediaItem {
  id: string;
  title: string;
  description: string;
  uploadType: 'upload' | 'link';
  mediaType: 'image' | 'video' | 'document';
  isLocalFile: boolean;
  url: string;
  platformType: string | null;
  originalName: string | null;
  size: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IdeasSection {
  id: string;
  title: string;
  description: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  medias: MediaItem[];
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface IdeasPage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  route: {
    id: string;
    title: string;
    public: boolean;
    subtitle: string;
    image: string;
    idToFetch: string;
    path: string;
    entityType: string;
    description: string;
    entityId: string;
    type: string;
  };
  sections: IdeasSection[];
}

export interface SectionData {
  title: string;
  description: string;
  public: boolean;
  medias: MediaItem[];
}


/** Pendência que impede o envio de uma ideia nova pelo membro. */
export enum IdeaDraftIssue {
  MissingTitle = 'missing-title',
  MissingDescription = 'missing-description',
  MissingMedia = 'missing-media',
}
