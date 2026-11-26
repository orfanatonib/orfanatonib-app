import type { StudioDrafts } from "./workspace.types";
import { isRecord } from "./workspace.utils";

export function readStudioDrafts(packageId: string): StudioDrafts {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(`orfanato-studio:${packageId}`) ?? "{}",
    );
    if (!isRecord(parsed)) return {};
    const result: StudioDrafts = {};
    for (const [key, draft] of Object.entries(parsed)) {
      if (
        isRecord(draft) &&
        typeof draft.value === "string" &&
        (draft.baseVersionId === null ||
          typeof draft.baseVersionId === "string")
      ) {
        result[key] = {
          value: draft.value,
          baseVersionId: draft.baseVersionId,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function writeStudioDrafts(
  packageId: string,
  drafts: StudioDrafts,
): boolean {
  try {
    const key = `orfanato-studio:${packageId}`;
    if (Object.keys(drafts).length)
      sessionStorage.setItem(key, JSON.stringify(drafts));
    else sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
