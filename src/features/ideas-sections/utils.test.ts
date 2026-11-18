import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@/store/slices/types';
import { MediaType, MediaUploadType } from '@/store/slices/types';
import { IDEA_DRAFT_ISSUE_MESSAGES } from './constants';
import { IdeaDraftIssue } from './types';
import { getSendableMedias, validateIdeaDraft } from './utils';

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
