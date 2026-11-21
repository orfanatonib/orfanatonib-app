import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@/store/slices/types';
import { MediaType, MediaUploadType } from '@/store/slices/types';
import { IDEA_DRAFT_ISSUE_MESSAGES } from './constants';
import { IdeaDraftIssue } from './types';
import {
  buildEditSectionPath,
  filterSections,
  formatFileSize,
  getMediaTypeIcon,
  getMediaTypeLabel,
  getSendableMedias,
  isDraftDirty,
  readEditSectionId,
  toDraftSection,
  truncate,
  validateIdeaDraft,
} from './utils';
import type { IdeasSection } from './types';

const media = (overrides: Partial<MediaItem>): MediaItem => ({
  title: 'Vídeo 1',
  description: '',
  mediaType: MediaType.VIDEO,
  uploadType: MediaUploadType.LINK,
  url: 'https://youtu.be/xyz',
  ...overrides,
});

describe('getSendableMedias', () => {
  it('aceita link com url e upload com arquivo, ambos com título', () => {
    const file = new File(['x'], 'a.pdf');
    const result = getSendableMedias([
      media({}),
      media({ uploadType: MediaUploadType.UPLOAD, file, url: '' }),
    ]);
    expect(result).toHaveLength(2);
  });

  it('descarta mídia sem título, link sem url e upload sem arquivo', () => {
    const result = getSendableMedias([
      media({ title: '  ' }),
      media({ url: '' }),
      media({ uploadType: MediaUploadType.UPLOAD, url: '' }),
    ]);
    expect(result).toHaveLength(0);
  });
});

describe('validateIdeaDraft', () => {
  const ready = { title: 'Ideia', description: 'Descrição', medias: [media({})] };

  it('devolve a primeira pendência na ordem do formulário', () => {
    expect(validateIdeaDraft({ ...ready, title: ' ', description: '' })).toBe(IdeaDraftIssue.MissingTitle);
    expect(validateIdeaDraft({ ...ready, description: ' ' })).toBe(IdeaDraftIssue.MissingDescription);
    expect(validateIdeaDraft({ ...ready, medias: [] })).toBe(IdeaDraftIssue.MissingMedia);
  });

  it('devolve null quando a ideia está pronta', () => {
    expect(validateIdeaDraft(ready)).toBeNull();
  });

  it('toda pendência tem mensagem', () => {
    for (const issue of Object.values(IdeaDraftIssue)) {
      expect(IDEA_DRAFT_ISSUE_MESSAGES[issue]).toBeTruthy();
    }
  });
});

const apiSection = (overrides: Partial<IdeasSection> = {}): IdeasSection => ({
  id: 's1', title: 'Gincana', description: 'Corrida', public: false,
  createdAt: '2026-01-01', updatedAt: '2026-01-02',
  medias: [{
    id: 'm1', title: 'Foto', description: '', uploadType: 'upload', mediaType: 'image',
    isLocalFile: true, url: 'https://b/x.png', platformType: null, originalName: null, size: null,
  }],
  ...overrides,
});

describe('rota de edição', () => {
  it('põe o id na query e o lê de volta', () => {
    const path = buildEditSectionPath('a b');
    expect(path).toBe('/adm/editar-ideias-compartilhadas?id=a%20b');
    expect(readEditSectionId(path.slice(path.indexOf('?')))).toBe('a b');
  });

  it('id ausente ou vazio vira null', () => {
    expect(readEditSectionId('')).toBeNull();
    expect(readEditSectionId('?id=')).toBeNull();
    expect(readEditSectionId('?id=%20')).toBeNull();
  });
});

describe('toDraftSection', () => {
  it('converte nulos da API em indefinidos e mantém o id das mídias', () => {
    const draft = toDraftSection(apiSection());
    expect(draft.medias[0]).toMatchObject({ id: 'm1', platformType: undefined, originalName: undefined, size: undefined });
    expect(draft.public).toBe(false);
  });

  it('aceita ideia sem lista de mídias', () => {
    expect(toDraftSection(apiSection({ medias: undefined as never })).medias).toEqual([]);
  });
});

describe('isDraftDirty', () => {
  const base = toDraftSection(apiSection());

  it('rascunho idêntico ao ponto de partida não está sujo', () => {
    expect(isDraftDirty(toDraftSection(apiSection()), base)).toBe(false);
  });

  it.each([
    ['título', { title: 'Outro' }],
    ['descrição', { description: 'Outra' }],
    ['visibilidade', { public: true }],
  ])('mudar %s suja o rascunho', (_nome, patch) => {
    expect(isDraftDirty({ ...base, ...patch }, base)).toBe(true);
  });

  it('adicionar, remover ou trocar mídia suja o rascunho', () => {
    expect(isDraftDirty({ ...base, medias: [] }, base)).toBe(true);
    expect(isDraftDirty({ ...base, medias: [...base.medias, ...base.medias] }, base)).toBe(true);
    expect(isDraftDirty({ ...base, medias: [{ ...base.medias[0], file: new File(['x'], 'n.png') }] }, base)).toBe(true);
    expect(isDraftDirty({ ...base, medias: [{ ...base.medias[0], title: 'Nova' }] }, base)).toBe(true);
  });

  it('formulário vazio de envio não está sujo até alguém digitar', () => {
    const empty = { title: '', description: '', public: true, medias: [] };
    expect(isDraftDirty(empty, empty)).toBe(false);
    expect(isDraftDirty({ ...empty, title: 'x' }, empty)).toBe(true);
  });
});

describe('filterSections', () => {
  const list = [apiSection({ id: 'a', title: 'Gincana' }), apiSection({ id: 'b', title: 'Teatro', description: 'com GINCANA' })];

  it('filtra por título ou descrição sem diferenciar maiúsculas', () => {
    expect(filterSections(list, ' ginc ').map((s) => s.id)).toEqual(['a', 'b']);
    expect(filterSections(list, 'teatro').map((s) => s.id)).toEqual(['b']);
  });

  it('termo vazio devolve cópia de tudo', () => {
    const result = filterSections(list, '  ');
    expect(result).toEqual(list);
    expect(result).not.toBe(list);
  });
});

describe('formatadores', () => {
  it('trunca só o que passa do limite', () => {
    expect(truncate('abcdef', 3)).toBe('abc...');
    expect(truncate('abc', 3)).toBe('abc');
    expect(truncate()).toBe('');
  });

  it('tamanho legível e desconhecido', () => {
    expect(formatFileSize(null)).toBe('Tamanho desconhecido');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('ícone e rótulo têm recuo para tipo desconhecido', () => {
    expect(getMediaTypeIcon('image')).toBe('🖼️');
    expect(getMediaTypeIcon('zzz')).toBe('📁');
    expect(getMediaTypeLabel('video')).toBe('Vídeo');
    expect(getMediaTypeLabel('zzz')).toBe('Arquivo');
  });
});
