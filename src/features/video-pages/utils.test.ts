import { describe, expect, it, vi } from "vitest";
import {
  VIDEO_PAGES_LIST_PATH,
  copyToClipboard,
  formatDate,
  truncate,
  videoPageEditPath,
} from "./utils";

describe("video-pages utils", () => {
  it("truncate corta só o que passa do limite", () => {
    expect(truncate("abc", 5)).toBe("abc");
    expect(truncate("abcdef", 3)).toBe("abc...");
    expect(truncate()).toBe("");
  });

  it("formatDate trata data ausente", () => {
    expect(formatDate()).toBe("Não disponível");
    expect(formatDate("2026-01-02T10:00:00.000Z")).not.toBe("Não disponível");
  });

  it("videoPageEditPath codifica o id e a lista fica em /adm/paginas-videos", () => {
    expect(videoPageEditPath("a b")).toBe("/adm/editar-pagina-videos?id=a%20b");
    expect(VIDEO_PAGES_LIST_PATH).toBe("/adm/paginas-videos");
  });

  it("copyToClipboard devolve true/false conforme o navegador permite", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyToClipboard("x")).toBe(true);
    writeText.mockRejectedValueOnce(new Error("negado"));
    expect(await copyToClipboard("x")).toBe(false);
    vi.unstubAllGlobals();
  });
});
