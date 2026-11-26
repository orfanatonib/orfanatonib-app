import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentStageEditor } from "./ContentStageEditor";
import {
  ContentStageStatus,
  ContentStageType,
  type ContentStageResponse,
} from "../types";

const stage: ContentStageResponse = {
  id: "stage-lesson",
  stageType: ContentStageType.LESSON,
  position: 2,
  required: true,
  dependencies: [],
  status: ContentStageStatus.DRAFT,
  currentVersionId: null,
  lockVersion: 0,
  currentVersion: null,
  reviewComments: [],
  reviewDecisions: [],
  createdAt: "",
  updatedAt: "",
};
describe("ContentStageEditor", () => {
  it("edits a field preserving the structured content (no tabs without a package)", () => {
    const change = vi.fn();
    render(
      <ContentStageEditor
        stage={stage}
        value={JSON.stringify({
          title: "Fé",
          memoryVerse: { text: "Texto conferido", reference: "Salmos 23" },
          songs: [],
        })}
        disabled={false}
        onChange={change}
      />,
    );
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Confiança" },
    });
    expect(JSON.parse(change.mock.calls[0][0] as string)).toEqual({
      title: "Confiança",
      memoryVerse: { text: "Texto conferido", reference: "Salmos 23" },
      songs: [],
    });
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
  it("keeps review content read-only", () => {
    render(
      <ContentStageEditor
        stage={stage}
        value={JSON.stringify({ title: "Revisão" })}
        disabled
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Título")).toBeDisabled();
  });
});
