export type VisitMaterialTestament = 'OLD_TESTAMENT' | 'NEW_TESTAMENT';

export interface VisitMaterialFixture {
  id: string;
  title: string;
  subtitle: string;
  testament: VisitMaterialTestament;
  currentWeek: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  videos: Array<{
    id: string;
    title: string;
    description: string;
    uploadType: 'link';
    mediaType: 'video';
    platformType: 'youtube';
    url: string;
    isLocalFile: false;
  }>;
  documents: [];
  images: [];
  audios: [];
  route: {
    id: string;
    path: string;
    title: string;
    subtitle: string;
    description: string;
    type: 'page';
    public: boolean;
  };
}

export const buildVisitMaterialFixture = (
  overrides: Partial<VisitMaterialFixture> = {},
): VisitMaterialFixture => ({
  id: '6f1c3c62-0f6a-4f4b-9a3f-0b5f7f2a1d11',
  title: 'Gênesis — A criação',
  subtitle: 'O começo de todas as coisas',
  testament: 'OLD_TESTAMENT',
  currentWeek: false,
  description: 'Material para a visita desta semana.',
  createdAt: '2026-09-13T12:00:00.000Z',
  updatedAt: '2026-09-13T12:00:00.000Z',
  videos: [
    {
      id: 'video-1',
      title: 'Vídeo de Gênesis',
      description: 'Introdução',
      uploadType: 'link',
      mediaType: 'video',
      platformType: 'youtube',
      url: 'https://www.youtube.com/watch?v=abcdefghijk',
      isLocalFile: false,
    },
  ],
  documents: [],
  images: [],
  audios: [],
  route: {
    id: 'route-1',
    path: 'materiais_visita_genesis',
    title: 'Gênesis — A criação',
    subtitle: 'O começo de todas as coisas',
    description: 'Material para a visita desta semana.',
    type: 'page',
    public: true,
  },
  ...overrides,
});

export const VISIT_MATERIALS: VisitMaterialFixture[] = [
  buildVisitMaterialFixture(),
  buildVisitMaterialFixture({
    id: 'a1e5cc5d-9a82-4fb0-a4d6-f66dc9424f69',
    title: 'Evangelho de João',
    subtitle: 'O Verbo se fez carne',
    testament: 'NEW_TESTAMENT',
    createdAt: '2026-09-12T12:00:00.000Z',
    route: {
      id: 'route-2',
      path: 'materiais_visita_joao',
      title: 'Evangelho de João',
      subtitle: 'O Verbo se fez carne',
      description: 'Material sobre o Evangelho de João.',
      type: 'page',
      public: true,
    },
  }),
];
