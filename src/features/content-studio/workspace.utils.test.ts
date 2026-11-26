import { describe, expect, it } from "vitest";
import { parseStageDraft, capabilityForStage } from "./workspace.utils";
import { AiGenerationCapability } from "./types";

describe("studio content contracts", () => {
  it("rejects malformed content and non-object roots", () => {
    for (const value of ["{", "null", "[]", "12"])
      expect(parseStageDraft(value)).toBeNull();
    expect(parseStageDraft('{"title":"Esperança"}')).toEqual({
      title: "Esperança",
    });
  });
  it("requests structured content supported by the worker", () => {
    expect(capabilityForStage()).toBe(AiGenerationCapability.TEXT_STRUCTURED);
  });
});
