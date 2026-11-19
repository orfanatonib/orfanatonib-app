import { beforeEach, describe, expect, it } from "vitest";
import { readStudioDrafts, writeStudioDrafts } from "./draftStorage";

describe("studio draft recovery", () => {
  beforeEach(() => sessionStorage.clear());
  it("isolates packages and retains version provenance", () => {
    const drafts = {
      lesson: { value: '{"title":"Esperança"}', baseVersionId: "version-1" },
    };
    expect(writeStudioDrafts("package-1", drafts)).toBe(true);
    expect(readStudioDrafts("package-1")).toEqual(drafts);
    expect(readStudioDrafts("package-2")).toEqual({});
    writeStudioDrafts("package-1", {});
    expect(readStudioDrafts("package-1")).toEqual({});
  });
  it("recovers safely from invalid browser storage", () => {
    sessionStorage.setItem("orfanato-studio:broken", "{");
    expect(readStudioDrafts("broken")).toEqual({});
  });
});
