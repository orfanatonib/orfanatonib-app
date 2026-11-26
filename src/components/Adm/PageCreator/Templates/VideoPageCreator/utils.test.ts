import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaUploadType } from 'store/slices/types';
import { VIDEO_PAGE_MESSAGES } from './constants';
import { buildVideoFormData, createEmptyVideo, validateNewVideo, validateVideoPage } from './utils';

const draft = {
  title: 'T',
  description: 'D',
  hasId: true,
  fromTemplatePage: true,
  videoCount: 1,
  uploadsComplete: true,
};

describe('validateVideoPage', () => {
  it('devolve a primeira regra violada, na ordem de antes', () => {
    expect(validateVideoPage({ ...draft, title: ' ' })).toBe(VIDEO_PAGE_MESSAGES.TITLE_REQUIRED);
    expect(validateVideoPage({ ...draft, description: '' })).toBe(VIDEO_PAGE_MESSAGES.DESCRIPTION_REQUIRED);
    expect(validateVideoPage({ ...draft, videoCount: 0 })).toBe(VIDEO_PAGE_MESSAGES.NO_VIDEO);
    expect(validateVideoPage({ ...draft, fromTemplatePage: false, hasId: false })).toBe(
      VIDEO_PAGE_MESSAGES.MISSING_ID,
    );
    expect(validateVideoPage({ ...draft, uploadsComplete: false })).toBe(VIDEO_PAGE_MESSAGES.UPLOAD_PENDING);
    expect(validateVideoPage(draft)).toBeNull();
  });
});

describe('validateNewVideo', () => {
  it('marca campos vazios e URL inválida para a plataforma', () => {
    const empty = validateNewVideo(createEmptyVideo(), false);
    expect(empty.hasError).toBe(true);
    expect(empty.errors.newVideoSrc).toBe(true);

    const bad = validateNewVideo({ ...createEmptyVideo(), title: 'a', description: 'b', url: 'https://x.com/v' }, false);
    expect(bad.hasError).toBe(false);
    expect(bad.isValidUrl).toBe(false);
    expect(bad.errors.newVideoURL).toBe(true);

    const ok = validateNewVideo({ ...createEmptyVideo(), title: 'a', description: 'b', url: 'https://youtu.be/1' }, false);
    expect(ok.isValidUrl).toBe(true);
  });

  it('upload sem arquivo só é erro fora da edição', () => {
    const video = { ...createEmptyVideo(), title: 'a', description: 'b', uploadType: MediaUploadType.UPLOAD, platformType: undefined };
    expect(validateNewVideo(video, false).hasError).toBe(true);
    expect(validateNewVideo(video, true).hasError).toBe(false);
  });
});

describe('buildVideoFormData', () => {
  it('envia link sem arquivo e upload novo com a chave video-N', () => {
    const file = new File(['x'], 'a.mp4', { type: 'video/mp4' });
    const form = buildVideoFormData({
      videos: [
        { ...createEmptyVideo(), title: 'L', description: 'd', url: 'https://youtu.be/1', platformType: MediaPlatform.YOUTUBE },
        { ...createEmptyVideo(), title: 'U', description: 'd', uploadType: MediaUploadType.UPLOAD, platformType: undefined, file },
      ],
      title: 'T',
      description: 'D',
      isPublic: false,
      fromTemplatePage: true,
    });
    expect(form.get('video-1')).toBeInstanceOf(File);
    expect(form.get('video-0')).toBeNull();
    const payload = JSON.parse(form.get('videosPageData') as string);
    expect(payload.public).toBe(false);
    expect(payload.id).toBeUndefined();
    expect(payload.videos[0]).toMatchObject({ uploadType: 'link', platformType: 'youtube', isLocalFile: false });
    expect(payload.videos[1]).toMatchObject({ isLocalFile: true, fieldKey: 'video-1', originalName: 'a.mp4' });
    expect(payload.videos[1].url).toBeUndefined();
  });
});
