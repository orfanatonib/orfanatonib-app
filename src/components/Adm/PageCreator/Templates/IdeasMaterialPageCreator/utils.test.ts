import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import { buildIdeasFormData, buildMediaFieldKey, hasIdeasErrors } from './utils';

const link = { title: 'L', description: 'd', mediaType: MediaType.VIDEO, uploadType: MediaUploadType.LINK, platformType: MediaPlatform.YOUTUBE, url: 'https://youtu.be/1' };

describe('ideas utils', () => {
  it('exige título, descrição e ao menos uma seção', () => {
    expect(hasIdeasErrors({ title: ' ', description: 'd', sectionCount: 1 })).toBe(true);
    expect(hasIdeasErrors({ title: 't', description: '', sectionCount: 1 })).toBe(true);
    expect(hasIdeasErrors({ title: 't', description: 'd', sectionCount: 0 })).toBe(true);
    expect(hasIdeasErrors({ title: 't', description: 'd', sectionCount: 1 })).toBe(false);
  });

  it('nomeia o campo do arquivo com tipo, índices e extensão', () => {
    const file = new File(['x'], 'doc.final.pdf');
    expect(buildMediaFieldKey({ ...link, mediaType: MediaType.DOCUMENT, uploadType: MediaUploadType.UPLOAD, url: '', file }, 2, 1)).toBe(
      'document_2_1.pdf',
    );
  });

  it('monta o payload: link com url, upload com fieldKey e ids só na edição', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const sections = [
      {
        id: 's1',
        title: 'S',
        description: 'D',
        medias: [
          { ...link, id: 'm1' },
          { ...link, mediaType: MediaType.IMAGE, uploadType: MediaUploadType.UPLOAD, platformType: undefined, url: '', file },
        ],
      },
    ];
    const create = buildIdeasFormData({ title: 'T', description: 'D', sections, fromTemplatePage: true, existingId: 'p1' });
    const created = JSON.parse(create.get('ideasMaterialsPageData') as string);
    expect(created.id).toBeUndefined();
    expect(created.sections[0].id).toBeUndefined();
    expect(created.sections[0].medias[0]).toMatchObject({ url: 'https://youtu.be/1', isLocalFile: false });
    expect(created.sections[0].medias[1]).toMatchObject({ fieldKey: 'image_0_1.png', isLocalFile: true });
    expect(create.get('image_0_1.png')).toBeInstanceOf(File);

    const update = buildIdeasFormData({ title: 'T', description: 'D', sections, fromTemplatePage: false, existingId: 'p1' });
    const updated = JSON.parse(update.get('ideasMaterialsPageData') as string);
    expect(updated).toMatchObject({ id: 'p1' });
    expect(updated.sections[0]).toMatchObject({ id: 's1' });
    expect(updated.sections[0].medias[0].id).toBe('m1');
  });
});
