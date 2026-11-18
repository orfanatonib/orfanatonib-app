import { describe, expect, it } from 'vitest';

import reducer, {
  appendSections,
  PaginatedSectionResponse,
  setSectionData,
  updatePagination,
} from './imageSectionPaginationSlice';

const section = (id: string) => ({ id }) as never;
const base: PaginatedSectionResponse = {
  id: 'p1',
  title: 't',
  description: 'd',
  public: true,
  createdAt: '',
  updatedAt: '',
  sections: [section('a'), section('b')],
  page: 1,
  limit: 2,
  total: 6,
};

const start = () => reducer(undefined, setSectionData(base));

describe('imageSectionPaginationSlice', () => {
  it('appendSections acrescenta só o que ainda não está no feed (dedupe por id)', () => {
    const state = reducer(start(), appendSections([section('b'), section('c')]));
    expect(state.section?.sections.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('a mesma página repetida não duplica nada', () => {
    let state = reducer(start(), appendSections([section('c'), section('d')]));
    state = reducer(state, appendSections([section('c'), section('d')]));
    expect(state.section?.sections.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sem seção carregada, appendSections e updatePagination são no-op', () => {
    const empty = reducer(undefined, appendSections([section('x')]));
    expect(empty.section).toBeNull();
    expect(reducer(empty, updatePagination({ page: 2, total: 3 })).section).toBeNull();
  });

  it('updatePagination atualiza página e total', () => {
    const state = reducer(start(), updatePagination({ page: 2, total: 7 }));
    expect(state.section).toMatchObject({ page: 2, total: 7 });
  });
});
