import { describe, expect, it } from 'vitest';
import { MediaType, MediaUploadType } from '@/store/slices/types';
import type { MediaItem } from '@/store/slices/types';
import { buildSectionFormData, buildSectionUpload, clampBadgeCount, formatDatePtBr, mediaSummary, truncate } from './utils';

const photo = (extra: Partial<MediaItem> = {}): MediaItem =>
  ({ id: 'p1', title: 'foto', description: '', uploadType: MediaUploadType.UPLOAD, mediaType: MediaType.IMAGE, isLocalFile: true, url: '', ...extra }) as MediaItem;

describe('truncate', () => {
  it('corta acima do limite e acrescenta reticências', () => {
    expect(truncate('a'.repeat(120), 100)).toBe(`${'a'.repeat(100)}...`);
  });
  it('mantém o texto curto e tolera vazio', () => {
    expect(truncate('curto')).toBe('curto');
    expect(truncate()).toBe('');
  });
});

describe('formatDatePtBr', () => {
  it('sem data devolve o aviso padrão', () => {
    expect(formatDatePtBr()).toBe('Não disponível');
  });
  it('formata dia/mês/ano e hora', () => {
    expect(formatDatePtBr(new Date(2026, 10, 20, 9, 5))).toMatch(/20\/11\/2026.*09:05/);
  });
});

describe('clampBadgeCount', () => {
  it('mostra o número até o teto e "99+" acima dele', () => {
    expect(clampBadgeCount(0, 99)).toBe('0');
    expect(clampBadgeCount(99, 99)).toBe('99');
    expect(clampBadgeCount(100, 99)).toBe('99+');
  });
});

describe('mediaSummary (resumo do cartão)', () => {
  it('singular e plural', () => {
    expect(mediaSummary([{ mediaType: 'image' }])).toBe('1 foto');
    expect(mediaSummary([{ mediaType: 'image' }, { mediaType: 'image' }, { mediaType: 'video' }])).toBe('2 fotos + 1 vídeo');
    expect(mediaSummary([{ mediaType: 'video' }])).toBe('1 vídeo');
  });
  it('sem mídia', () => {
    expect(mediaSummary([])).toBe('Sem arquivos');
    expect(mediaSummary()).toBe('Sem arquivos');
  });
});

describe('buildSectionUpload', () => {
  it('cada arquivo novo ganha um campo próprio e mantém o PRÓPRIO tipo (vídeo não vira foto)', () => {
    const img = new File([new Uint8Array(1)], 'a.png', { type: 'image/png' });
    const vid = new File([new Uint8Array(1)], 'v.mp4', { type: 'video/mp4' });
    const { payload, uploads } = buildSectionUpload({
      caption: 'c',
      description: 'd',
      mediaItems: [
        photo({ id: undefined, file: img }),
        photo({ id: undefined, file: vid, mediaType: MediaType.VIDEO }),
      ],
    });
    expect(uploads.map((u) => u.fieldKey)).toEqual(['file_0', 'file_1']);
    expect(payload.mediaItems.map((m) => m.mediaType)).toEqual([MediaType.IMAGE, MediaType.VIDEO]);
    expect(payload.mediaItems[1].originalName).toBe('v.mp4');
  });

  it('mídia já gravada não gera upload; public e pageId só vão quando informados', () => {
    const base = buildSectionUpload({ caption: 'c', description: 'd', mediaItems: [photo({ url: 'https://b/x.png' })] });
    expect(base.uploads).toEqual([]);
    expect('public' in base.payload).toBe(false);
    expect('pageId' in base.payload).toBe(false);
    const approved = buildSectionUpload({ caption: 'c', description: 'd', public: true, pageId: 'g1', mediaItems: [] });
    expect(approved.payload.public).toBe(true);
    expect(approved.payload.pageId).toBe('g1');
  });
});

describe('buildSectionFormData', () => {
  it('põe o JSON em sectionData e cada arquivo no seu campo', () => {
    const file = new File([new Uint8Array(1)], 'a.png', { type: 'image/png' });
    const form = buildSectionFormData({ caption: 'c', description: 'd', mediaItems: [] }, [{ fieldKey: 'file_0', file }]);
    expect(JSON.parse(String(form.get('sectionData')))).toEqual({ caption: 'c', description: 'd', mediaItems: [] });
    expect((form.get('file_0') as File).name).toBe('a.png');
  });
  it('sem arquivos só leva o JSON', () => {
    const form = buildSectionFormData({ caption: 'c', description: 'd', mediaItems: [] });
    expect([...form.keys()]).toEqual(['sectionData']);
  });
});
