import { describe, expect, it } from 'vitest';
import { MediaType } from '@/store/slices/types';
import {
  SHELTER_MAX_IMAGE_BYTES,
  SHELTER_MAX_VIDEO_BYTES,
  SHELTER_UPLOAD_MESSAGES as MESSAGES,
} from './constants';
import {
  countByType,
  toShelterUploadMedia,
  validateShelterDraft,
  validateShelterPublication,
  validateShelterSelection,
} from './media-utils';
import { buildSectionFormData, buildSectionUpload, mediaSummary } from './utils';

const file = (name: string, type: string, size = 10): File => {
  const f = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const select = (files: File[], mediaType: MediaType, currentPhotos = 0, currentVideos = 0) =>
  validateShelterSelection({ files, mediaType, currentPhotos, currentVideos });

describe('validateShelterSelection', () => {
  it('aceita fotos e vídeo válidos (mp4, webm, mov)', () => {
    expect(select([file('a.jpg', 'image/jpeg'), file('b.PNG', 'image/png')], MediaType.IMAGE)).toBeNull();
    for (const [name, type] of [['v.mp4', 'video/mp4'], ['v.webm', 'video/webm'], ['v.mov', 'video/quicktime']]) {
      expect(select([file(name, type)], MediaType.VIDEO)).toBeNull();
    }
    expect(select([], MediaType.IMAGE)).toBeNull();
  });

  it('um vídeo por post e até 10 fotos', () => {
    expect(select([file('v.mp4', 'video/mp4')], MediaType.VIDEO, 2, 1)).toBe(MESSAGES.ONE_VIDEO);
    expect(select([file('a.png', 'image/png')], MediaType.IMAGE, 10, 0)).toBe(MESSAGES.MAX_PHOTOS);
    expect(select([file('a.png', 'image/png')], MediaType.IMAGE, 9, 1)).toBeNull();
  });

  it('recusa formato, extensão e tamanho inválidos', () => {
    expect(select([file('a.pdf', 'application/pdf')], MediaType.IMAGE)).toBe(MESSAGES.PHOTO_FORMAT);
    expect(select([file('a.exe', 'image/png')], MediaType.IMAGE)).toBe(MESSAGES.PHOTO_FORMAT);
    expect(select([file('a.png', 'image/png', 0)], MediaType.IMAGE)).toBe(MESSAGES.PHOTO_SIZE);
    expect(select([file('a.png', 'image/png', SHELTER_MAX_IMAGE_BYTES + 1)], MediaType.IMAGE)).toBe(MESSAGES.PHOTO_SIZE);
    expect(select([file('v.avi', 'video/x-msvideo')], MediaType.VIDEO)).toBe(MESSAGES.VIDEO_FORMAT);
    expect(select([file('v.mp4', 'video/mp4', SHELTER_MAX_VIDEO_BYTES + 1)], MediaType.VIDEO)).toBe(MESSAGES.VIDEO_SIZE);
    expect(select([file('v.mp4', 'video/mp4', SHELTER_MAX_VIDEO_BYTES)], MediaType.VIDEO)).toBeNull();
  });
});

describe('validateShelterPublication / Draft', () => {
  const img = { mediaType: MediaType.IMAGE };
  const vid = { mediaType: MediaType.VIDEO };

  it('fotos e vídeo juntos valem; vazio, 2 vídeos e >10 fotos não', () => {
    expect(validateShelterPublication([img, img, vid])).toBeNull();
    expect(validateShelterPublication([vid])).toBeNull();
    expect(validateShelterPublication([])).toBe(MESSAGES.MEDIA_REQUIRED);
    expect(validateShelterPublication([vid, vid])).toBe(MESSAGES.COMPOSITION);
    expect(validateShelterPublication(Array(11).fill(img))).toBe(MESSAGES.COMPOSITION);
    expect(validateShelterPublication(Array(11).fill(img), true)).toBeNull();
    expect(validateShelterPublication([{ mediaType: MediaType.DOCUMENT }])).toBe(MESSAGES.COMPOSITION);
  });

  it('exige título e descrição antes da mídia', () => {
    expect(validateShelterDraft({ caption: ' ', description: 'x', mediaItems: [img] })).toBe(MESSAGES.TITLE_REQUIRED);
    expect(validateShelterDraft({ caption: 'x', description: '', mediaItems: [img] })).toBe(MESSAGES.DESCRIPTION_REQUIRED);
    expect(validateShelterDraft({ caption: 'x', description: 'y', mediaItems: [] })).toBe(MESSAGES.MEDIA_REQUIRED);
    expect(validateShelterDraft({ caption: 'x', description: 'y', mediaItems: [img] })).toBeNull();
  });

  it('countByType e mediaSummary', () => {
    expect(countByType([img, img, vid])).toEqual({ photos: 2, videos: 1 });
    expect(mediaSummary([img, img, vid])).toBe('2 fotos + 1 vídeo');
    expect(mediaSummary([img])).toBe('1 foto');
    expect(mediaSummary([])).toBe('Sem arquivos');
  });
});

describe('buildSectionUpload / buildSectionFormData', () => {
  it('cada mídia mantém o próprio tipo e cada arquivo vai num campo próprio', () => {
    const items = [
      toShelterUploadMedia(file('a.png', 'image/png'), MediaType.IMAGE),
      toShelterUploadMedia(file('v.mp4', 'video/mp4'), MediaType.VIDEO),
    ];
    const { payload, uploads } = buildSectionUpload({ caption: 'c', description: 'd', mediaItems: items });
    expect(payload.mediaItems.map((m) => m.mediaType)).toEqual(['image', 'video']);
    expect(payload.mediaItems.map((m) => m.fieldKey)).toEqual(['file_0', 'file_1']);
    expect(payload.public).toBeUndefined();
    expect(uploads).toHaveLength(2);
    const form = buildSectionFormData(payload, uploads);
    expect(JSON.parse(form.get('sectionData') as string).caption).toBe('c');
    expect((form.get('file_1') as File).name).toBe('v.mp4');
  });

  it('mídia já gravada não gera upload e a aprovação leva public', () => {
    const { payload, uploads } = buildSectionUpload({
      caption: 'c',
      description: 'd',
      public: true,
      mediaItems: [{ ...toShelterUploadMedia(file('a.png', 'image/png'), MediaType.IMAGE), id: 'm1', file: undefined, isLocalFile: true, url: 'http://x/a.png' }],
    });
    expect(uploads).toHaveLength(0);
    expect(payload.public).toBe(true);
    expect(payload.mediaItems[0].id).toBe('m1');
  });
});
