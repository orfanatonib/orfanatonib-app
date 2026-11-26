import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaType, MediaUploadType, type MediaItem } from '@/store/slices/types';
import { buildIdeasSectionFormData } from './payload';

const media = (overrides: Partial<MediaItem>): MediaItem => ({
  title: 'Mídia',
  description: 'd',
  mediaType: MediaType.IMAGE,
  uploadType: MediaUploadType.UPLOAD,
  url: '',
  ...overrides,
});

const parse = (form: FormData) => JSON.parse(form.get('sectionData') as string) as {
  title: string;
  public: boolean;
  medias: Array<Record<string, unknown>>;
};

describe('buildIdeasSectionFormData', () => {
  it('manda título, descrição e visibilidade no campo sectionData', () => {
    const form = buildIdeasSectionFormData({ title: 'T', description: 'D', public: true, medias: [] });
    expect(parse(form)).toMatchObject({ title: 'T', description: 'D', public: true, medias: [] });
  });

  it('upload novo viaja com fieldKey e o arquivo no multipart', () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const form = buildIdeasSectionFormData({
      title: 'T', description: 'D', public: false, medias: [media({ file })],
    });
    const [item] = parse(form).medias;
    expect(item).toMatchObject({ fieldKey: 'image_upload', originalName: 'foto.png', isLocalFile: true });
    expect((form.get('image_upload') as File).name).toBe('foto.png');
  });

  it('numera o campo do segundo arquivo do mesmo tipo e separa por tipo', () => {
    const png = new File(['x'], 'a.png');
    const jpg = new File(['y'], 'b.jpg');
    const mp4 = new File(['z'], 'c.mp4');
    const form = buildIdeasSectionFormData({
      title: 'T', description: 'D', public: true,
      medias: [
        media({ file: png }),
        media({ file: jpg }),
        media({ file: mp4, mediaType: MediaType.VIDEO }),
      ],
    });
    expect(parse(form).medias.map((m) => m.fieldKey)).toEqual(['image_upload', 'image2_upload', 'video_upload']);
  });

  it('link leva url e plataforma e nenhum arquivo', () => {
    const form = buildIdeasSectionFormData({
      title: 'T', description: 'D', public: true,
      medias: [media({ uploadType: MediaUploadType.LINK, mediaType: MediaType.VIDEO, url: 'https://youtu.be/x', platformType: MediaPlatform.YOUTUBE })],
    });
    const [item] = parse(form).medias;
    expect(item).toMatchObject({ url: 'https://youtu.be/x', platformType: 'youtube', isLocalFile: false });
    expect(item).not.toHaveProperty('fieldKey');
  });

  it('só preserva o id das mídias quando keepMediaIds é true', () => {
    const base = { title: 'T', description: 'D', public: true, medias: [media({ id: 'm1', uploadType: MediaUploadType.UPLOAD })] };
    expect(parse(buildIdeasSectionFormData(base)).medias[0]).not.toHaveProperty('id');
    expect(parse(buildIdeasSectionFormData({ ...base, keepMediaIds: true })).medias[0]).toMatchObject({ id: 'm1' });
  });

  it('upload já gravado, sem arquivo novo, não manda fieldKey (a API mantém o objeto)', () => {
    const form = buildIdeasSectionFormData({
      title: 'T', description: 'D', public: true, keepMediaIds: true,
      medias: [media({ id: 'm1' })],
    });
    expect(parse(form).medias[0]).not.toHaveProperty('fieldKey');
  });

  it('descarta tipo que a ideia não aceita (áudio)', () => {
    const form = buildIdeasSectionFormData({
      title: 'T', description: 'D', public: true,
      medias: [media({ mediaType: MediaType.AUDIO, uploadType: MediaUploadType.LINK, url: 'u' })],
    });
    expect(parse(form).medias).toEqual([]);
  });
});
