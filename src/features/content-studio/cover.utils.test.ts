import { describe, expect, it } from "vitest";

import { hasUnseenCover, markCoverSeen, readSeenCover } from "./cover.utils";

describe("aviso da imagem de apresentação", () => {
  it("avisa só quando há capa pronta que ainda não foi vista", () => {
    expect(hasUnseenCover(null, false, null)).toBe(false);
    expect(hasUnseenCover("a.png", true, null)).toBe(false);
    expect(hasUnseenCover("a.png", false, null)).toBe(true);
    expect(hasUnseenCover("a.png", false, "a.png")).toBe(false);
    expect(hasUnseenCover("b.png", false, "a.png")).toBe(true);
  });

  it("lembra a capa vista por pacote", () => {
    markCoverSeen("pkg-1", "a.png");
    expect(readSeenCover("pkg-1")).toBe("a.png");
    expect(readSeenCover("pkg-2")).toBeNull();
  });
});
