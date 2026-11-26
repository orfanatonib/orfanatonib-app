import { describe, expect, it } from 'vitest';
import { MediaType, MediaUploadType, type MediaItem } from '@/store/slices/types';
import { AdminSaveIssue, IdeaMediaStatus } from './types';
import {
  buildAdminSectionFormData,
  buildMemberIdeaFormData,
  findPageOption,
  getIdeaMediaStatus,
  getIdeaMediaStatusMessage,
  isPublicValue,
  publicToValue,
  validateAdminSave,
} from './utils';

const linkVideo = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: 'media-1',
  title: 'Vídeo',
  description: 'Descrição',
  mediaType: MediaType.VIDEO,
  uploadType: MediaUploadType.LINK,
  url: 'https://youtu.be/abc',
  ...overrides,
});

const payloadOf = (form: FormData) => JSON.parse(String(form.get('sectionData')));

describe('getIdeaMediaStatus', () => {
  it('pronto quando há mídia enviável', () => {
    expect(getIdeaMediaStatus(2, 3)).toBe(IdeaMediaStatus.READY);
  });
  it('incompleto quando há mídia mas nenhuma enviável', () => {
    expect(getIdeaMediaStatus(0, 1)).toBe(IdeaMediaStatus.INCOMPLETE);
  });
  it('vazio quando não há mídia', () => {
    expect(getIdeaMediaStatus(0, 0)).toBe(IdeaMediaStatus.EMPTY);
  });
});

describe('getIdeaMediaStatusMessage', () => {
  it('mantém os textos mostrados ao membro', () => {
    expect(getIdeaMediaStatusMessage(IdeaMediaStatus.READY, 2)).toBe('2 mídia(s) pronta(s) para envio');
    expect(getIdeaMediaStatusMessage(IdeaMediaStatus.INCOMPLETE, 0)).toBe('Complete os dados das mídias adicionadas');
    expect(getIdeaMediaStatusMessage(IdeaMediaStatus.EMPTY, 0)).toBe(
      'Adicione pelo menos uma mídia (vídeo, imagem ou documento)',
    );
  });
});

describe('validateAdminSave', () => {
  it('exige a página antes do id da seção', () => {
    expect(validateAdminSave({ pageId: null, sectionId: undefined })).toBe(AdminSaveIssue.MISSING_PAGE);
  });
  it('exige o id da seção', () => {
    expect(validateAdminSave({ pageId: 'p1', sectionId: undefined })).toBe(AdminSaveIssue.MISSING_SECTION_ID);
  });
  it('libera quando tudo existe', () => {
    expect(validateAdminSave({ pageId: 'p1', sectionId: 's1' })).toBeNull();
  });
});

describe('findPageOption', () => {
  const pages = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
  it('acha pelo id ou devolve null', () => {
    expect(findPageOption(pages, 'b')).toEqual({ id: 'b', title: 'B' });
    expect(findPageOption(pages, 'x')).toBeNull();
  });
});

describe('visibilidade', () => {
  it('converte entre booleano e valor do select', () => {
    expect(isPublicValue('true')).toBe(true);
    expect(isPublicValue('false')).toBe(false);
    expect(publicToValue(true)).toBe('true');
    expect(publicToValue(false)).toBe('false');
    expect(publicToValue(undefined)).toBe('false');
  });
});

describe('buildAdminSectionFormData', () => {
  it('mantém o id das mídias e respeita a visibilidade', () => {
    const payload = payloadOf(
      buildAdminSectionFormData({ title: 'T', description: 'D', public: false, medias: [linkVideo()] }),
    );
    expect(payload.public).toBe(false);
    expect(payload.medias[0]).toMatchObject({ id: 'media-1', url: 'https://youtu.be/abc' });
  });
  it('público ausente vira false', () => {
    const payload = payloadOf(buildAdminSectionFormData({ title: 'T', description: 'D', medias: [] }));
    expect(payload.public).toBe(false);
  });
});

describe('buildMemberIdeaFormData', () => {
  it('é sempre pública e sem id de mídia', () => {
    const payload = payloadOf(
      buildMemberIdeaFormData({ title: 'T', description: 'D', public: false, medias: [linkVideo()] }),
    );
    expect(payload.public).toBe(true);
    expect(payload.medias[0].id).toBeUndefined();
  });
});
