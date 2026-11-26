import { describe, expect, it } from 'vitest';
import { MediaItem, MediaType, MediaUploadType } from 'store/slices/types';
import { buildImageFormData, validateImageDraft } from './utils';

const media = (file?: File): MediaItem => ({
  isLocalFile: Boolean(file),
  url: '',
  uploadType: MediaUploadType.UPLOAD,
  mediaType: MediaType.IMAGE,
  file,
  title: '',
  description: '',
  originalName: file?.name,
});
const section = (mediaItems = [media()]) => ({ caption: 'c', description: 'd', public: true, mediaItems });

describe('validateImageDraft', () => {
  it('segue a ordem das regras e numera a seção', () => {
    expect(validateImageDraft({ title: '', description: 'd', sections: [] })).toMatch(/título da galeria/);
    expect(validateImageDraft({ title: 't', description: '', sections: [] })).toMatch(/descrição da galeria/);
    expect(validateImageDraft({ title: 't', description: 'd', sections: [] })).toMatch(/pelo menos uma seção/);
    expect(
      validateImageDraft({ title: 't', description: 'd', sections: [section(), { ...section(), caption: ' ' }] }),
    ).toBe('A seção 2 precisa de um título.');
    expect(validateImageDraft({ title: 't', description: 'd', sections: [section([])] })).toBe(
      'A seção 1 precisa conter pelo menos uma mídia.',
    );
    expect(validateImageDraft({ title: 't', description: 'd', sections: [section()] })).toBeNull();
  });
});

describe('buildImageFormData', () => {
  it('nomeia os arquivos file_sec<i>_mid<j> e omite id na criação', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const form = buildImageFormData({
      draft: { title: 'T', description: 'D', sections: [section([media(file)])] },
      isPublic: true,
      fromTemplatePage: true,
      existingId: 'abc',
    });
    expect(form.get('file_sec0_mid0')).toBeInstanceOf(File);
    const payload = JSON.parse(form.get('imageData') as string);
    expect(payload.id).toBeUndefined();
    expect(payload.sections[0].mediaItems[0]).toMatchObject({ fieldKey: 'file_sec0_mid0', mediaType: 'image' });
  });

  it('inclui o id na edição', () => {
    const form = buildImageFormData({
      draft: { title: 'T', description: 'D', sections: [] },
      isPublic: false,
      fromTemplatePage: false,
      existingId: 'abc',
    });
    expect(JSON.parse(form.get('imageData') as string)).toMatchObject({ id: 'abc', public: false });
  });
});
