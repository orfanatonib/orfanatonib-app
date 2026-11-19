import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaUpload } from './useMediaUpload';
import { MediaFileKind } from './types';

const makeFile = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });

describe('useMediaUpload', () => {
  let counter = 0;
  const createUrl = vi.fn(() => `blob:preview-${counter++}`);
  const revokeUrl = vi.fn();

  beforeEach(() => {
    counter = 0;
    createUrl.mockClear();
    revokeUrl.mockClear();
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
  });
  afterEach(() => vi.restoreAllMocks());

  it('acumula arquivos no modo múltiplo e cria uma pré-visualização para cada', () => {
    const { result } = renderHook(() => useMediaUpload({ kind: MediaFileKind.IMAGE, multiple: true }));
    act(() => {
      result.current.selectFiles([makeFile('a.png', 'image/png')]);
    });
    act(() => {
      result.current.selectFiles([makeFile('b.png', 'image/png')]);
    });
    expect(result.current.selections.map((s) => s.file.name)).toEqual(['a.png', 'b.png']);
    expect(result.current.accept).toBe('image/*');
  });

  it('substitui o arquivo no modo simples e libera a pré-visualização antiga', () => {
    const { result } = renderHook(() => useMediaUpload({ kind: MediaFileKind.VIDEO }));
    act(() => {
      result.current.selectFiles([makeFile('a.mp4', 'video/mp4')]);
    });
    act(() => {
      result.current.selectFiles([makeFile('b.mp4', 'video/mp4')]);
    });
    expect(result.current.selections).toHaveLength(1);
    expect(result.current.selections[0].file.name).toBe('b.mp4');
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview-0');
  });

  it('recusa arquivo grande demais e expõe o erro', () => {
    const { result } = renderHook(() =>
      useMediaUpload({ kind: MediaFileKind.VIDEO, maxFileSizeBytes: 5 }),
    );
    act(() => {
      result.current.selectFiles([makeFile('a.mp4', 'video/mp4', 50)]);
    });
    expect(result.current.selections).toHaveLength(0);
    expect(result.current.error).toMatch(/tamanho máximo/);
  });

  it('remove por índice e limpa tudo liberando as URLs', () => {
    const { result } = renderHook(() => useMediaUpload({ kind: MediaFileKind.IMAGE, multiple: true }));
    act(() => {
      result.current.selectFiles([makeFile('a.png', 'image/png'), makeFile('b.png', 'image/png')]);
    });
    act(() => result.current.removeAt(0));
    expect(result.current.selections.map((s) => s.file.name)).toEqual(['b.png']);
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview-0');
    act(() => result.current.clear());
    expect(result.current.selections).toEqual([]);
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview-1');
  });

  it('libera as URLs restantes ao desmontar', () => {
    const { result, unmount } = renderHook(() => useMediaUpload({ kind: MediaFileKind.IMAGE }));
    act(() => {
      result.current.selectFiles([makeFile('a.png', 'image/png')]);
    });
    unmount();
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview-0');
  });

  it('ignora seleção vazia sem erro', () => {
    const { result } = renderHook(() => useMediaUpload({ kind: MediaFileKind.IMAGE }));
    act(() => {
      result.current.selectFiles(null);
    });
    expect(result.current.selections).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
