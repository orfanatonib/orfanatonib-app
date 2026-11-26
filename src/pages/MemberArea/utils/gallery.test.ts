import { describe, expect, it } from 'vitest';
import type { MemberGalleryItem } from '../types/gallery';
import { filterGalleryItems, sliceGalleryItems } from './gallery';

const item = (id: string, title: string, description = ''): MemberGalleryItem => ({
  id,
  title,
  description,
  imageUrl: null,
});

describe('filterGalleryItems', () => {
  const items = [item('1', 'Brincadeira da Fé', 'Atividade em grupo'), item('2', 'Versículo', 'Salmo 23')];

  it('ignora acentos e maiúsculas, em título e descrição', () => {
    expect(filterGalleryItems(items, 'FE').map((i) => i.id)).toEqual(['1']);
    expect(filterGalleryItems(items, 'salmo').map((i) => i.id)).toEqual(['2']);
  });

  it('termo vazio devolve tudo', () => {
    expect(filterGalleryItems(items, '  ')).toHaveLength(2);
  });
});

describe('sliceGalleryItems', () => {
  const items = Array.from({ length: 5 }, (_, i) => item(String(i), `Item ${i}`));

  it('limita a quantidade e informa se há mais', () => {
    expect(sliceGalleryItems(items, 3)).toMatchObject({ hasMore: true });
    expect(sliceGalleryItems(items, 3).visible).toHaveLength(3);
    expect(sliceGalleryItems(items, 5).hasMore).toBe(false);
  });
});
