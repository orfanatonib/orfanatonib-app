import { describe, expect, it } from 'vitest';
import { MediaType } from '@/store/slices/types';
import {
  IDEAS_SECTION_ADMIN_EDIT_PATH,
  IDEAS_SECTION_MEDIA_TYPES,
  IDEA_DRAFT_ISSUE_MESSAGES,
  MEDIA_TYPE_ICONS,
  MEDIA_TYPE_LABELS,
} from './constants';
import { IdeaDraftIssue } from './types';

describe('constantes de ideias compartilhadas', () => {
  it('ideia aceita vídeo, documento e imagem, e nunca áudio', () => {
    expect(IDEAS_SECTION_MEDIA_TYPES).toEqual([MediaType.VIDEO, MediaType.DOCUMENT, MediaType.IMAGE]);
    expect(IDEAS_SECTION_MEDIA_TYPES).not.toContain(MediaType.AUDIO);
  });

  it('todo tipo de mídia tem rótulo e ícone', () => {
    for (const type of Object.values(MediaType)) {
      expect(MEDIA_TYPE_LABELS[type]).toBeTruthy();
      expect(MEDIA_TYPE_ICONS[type]).toBeTruthy();
    }
  });

  it('toda pendência do rascunho tem mensagem própria', () => {
    const messages = Object.values(IdeaDraftIssue).map((issue) => IDEA_DRAFT_ISSUE_MESSAGES[issue]);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it('a rota de edição do admin é a mesma registrada no menu', () => {
    expect(IDEAS_SECTION_ADMIN_EDIT_PATH).toBe('/adm/editar-ideias-compartilhadas');
  });
});
