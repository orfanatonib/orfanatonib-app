import { STAGE_CONTENT_TEMPLATES } from "./editor.constants";
import { AiGenerationCapability, type ContentStageResponse } from "./types";
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function capabilityForStage(): AiGenerationCapability {
  return AiGenerationCapability.TEXT_STRUCTURED;
}

export function stageDraftValue(stage: ContentStageResponse): string {
  const content =
    stage.currentVersion?.structuredContent ??
    STAGE_CONTENT_TEMPLATES[stage.stageType];

  return JSON.stringify(content, null, 2);
}

export function parseStageDraft(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
