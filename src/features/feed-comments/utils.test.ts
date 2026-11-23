import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';
import { FeedCommentStatus } from './types';
import {
  toModerationQuery,
  clampBadgeCount,
  getCoverPreviewUrl,
  isAwaitingOrRejected,
  isVideoCover,
  toStatusFilter,
  validateRejectionReason,
} from './utils';

describe('feed-comments utils', () => {
  it('monta a consulta da fila só com o que foi preenchido', () => {
    expect(toModerationQuery({ page: 2, limit: 10, search: '  ', filters: { status: '' } })).toEqual({ page: 2, limit: 10 });
    expect(
      toModerationQuery({
        page: 1,
        limit: 20,
        search: ' maria ',
        filters: { status: 'pending', createdFrom: '2026-01-01', createdTo: '', sort: 'reviewedAt:ASC' },
      }),
    ).toEqual({
      page: 1,
      limit: 20,
      search: 'maria',
      status: FeedCommentStatus.PENDING,
      createdFrom: '2026-01-01',
      sortBy: 'reviewedAt',
      order: 'ASC',
    });
  });

  it('só aceita status conhecidos no filtro', () => {
    expect(toStatusFilter('approved')).toBe(FeedCommentStatus.APPROVED);
    expect(toStatusFilter('all')).toBe('');
    expect(toStatusFilter('')).toBe('');
  });

  it('o autor vê os pendentes e reprovados, nunca duplica os aprovados', () => {
    expect(isAwaitingOrRejected(FeedCommentStatus.PENDING)).toBe(true);
    expect(isAwaitingOrRejected(FeedCommentStatus.REJECTED)).toBe(true);
    expect(isAwaitingOrRejected(FeedCommentStatus.APPROVED)).toBe(false);
  });

  it('o motivo da reprovação é obrigatório', () => {
    expect(validateRejectionReason('   ')).toBe('required');
    expect(validateRejectionReason('Fora do tema')).toBeNull();
  });

  it('limita o selo de pendentes', () => {
    expect(clampBadgeCount(7, 99)).toBe('7');
    expect(clampBadgeCount(120, 99)).toBe('99+');
  });

  it('capa: imagem vira miniatura; vídeo e ausência ficam sem imagem', () => {
    const image = {
      uploadType: MediaUploadType.UPLOAD,
      mediaType: MediaType.IMAGE,
      isLocalFile: true,
      url: 'https://cdn/x.png',
    };
    expect(getCoverPreviewUrl(image)).toBe('https://cdn/x.png');
    const drive = {
      uploadType: MediaUploadType.LINK,
      mediaType: MediaType.IMAGE,
      isLocalFile: false,
      platformType: MediaPlatform.GOOGLE_DRIVE,
      url: 'https://drive.google.com/file/d/abc123/view',
    };
    expect(getCoverPreviewUrl(drive)).toBe('https://drive.google.com/thumbnail?id=abc123');
    const video = { ...image, mediaType: MediaType.VIDEO };
    expect(getCoverPreviewUrl(video)).toBeNull();
    expect(isVideoCover(video)).toBe(true);
    expect(getCoverPreviewUrl(null)).toBeNull();
  });
});
