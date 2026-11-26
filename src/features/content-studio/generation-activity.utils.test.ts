import { describe, expect, it } from "vitest";

import { GenerationJobStatus } from "./generation.utils";
import { describeJobProgress, easedProgress, formatDuration, formatElapsed, groupActivityByPackage } from "./generation-activity.utils";
import { AiGenerationCapability, ContentAudience, ContentStageType, type GenerationActivityItem } from "./types";

const NOW = new Date("2026-01-01T10:01:00.000Z").getTime();
const base = { attempts: 1, capability: AiGenerationCapability.TEXT_STRUCTURED, startedAt: "2026-01-01T10:00:00.000Z" };

describe("describeJobProgress", () => {
  it("na fila: começo da barra e primeira etapa", () => {
    const view = describeJobProgress({ ...base, status: GenerationJobStatus.PENDING, progress: null }, NOW);
    expect(view).toMatchObject({ stepIndex: 0, percent: 3, retrying: false });
  });

  it("escrevendo: a barra avança com o tempo, mas nunca passa de 80% nessa fase", () => {
    const early = describeJobProgress({ ...base, status: GenerationJobStatus.RUNNING, progress: { phase: "TEXT", step: "WRITING", startedAt: "2026-01-01T10:00:55.000Z" } }, NOW);
    const late = describeJobProgress({ ...base, status: GenerationJobStatus.RUNNING, progress: { phase: "TEXT", step: "WRITING", startedAt: "2026-01-01T09:00:00.000Z" } }, NOW);
    expect(early.stepIndex).toBe(2);
    expect(late.percent).toBeGreaterThan(early.percent);
    expect(late.percent).toBeLessThanOrEqual(80);
  });

  it("validando e salvando ficam no fim da linha do tempo", () => {
    const validating = describeJobProgress({ ...base, status: GenerationJobStatus.RUNNING, progress: { phase: "TEXT", step: "VALIDATING", startedAt: base.startedAt } }, NOW);
    const saving = describeJobProgress({ ...base, status: GenerationJobStatus.RUNNING, progress: { phase: "TEXT", step: "SAVING", startedAt: base.startedAt } }, NOW);
    expect(validating.percent).toBe(85);
    expect(saving.percent).toBe(94);
    expect(saving.stepIndex).toBe(4);
  });

  it("imagens: percentual real (feitas de total)", () => {
    const view = describeJobProgress(
      { ...base, capability: AiGenerationCapability.IMAGE_GENERATION, status: GenerationJobStatus.RUNNING, progress: { phase: "IMAGES", done: 2, total: 4, failed: [] } },
      NOW,
    );
    expect(view).toMatchObject({ percent: 50, exact: true, headline: "Desenhando a imagem 3 de 4" });
  });

  it("nova tentativa é avisada na frase", () => {
    const view = describeJobProgress({ ...base, attempts: 2, status: GenerationJobStatus.RUNNING, progress: null }, NOW);
    expect(view.headline).toContain("tentativa 2");
  });

  it("agendada para tentar de novo", () => {
    expect(describeJobProgress({ ...base, status: GenerationJobStatus.RETRY_SCHEDULED, progress: null }, NOW).retrying).toBe(true);
  });
});

describe("formatação", () => {
  it("tempo decorrido e duração", () => {
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatDuration(38_000)).toBe("38 s");
    expect(formatDuration(125_000)).toBe("2 min 05 s");
  });

  it("a estimativa só se aproxima do teto", () => {
    expect(easedProgress(0, 15, 80)).toBe(15);
    expect(easedProgress(10 * 60_000, 15, 80)).toBeLessThan(80.001);
  });
});

describe("groupActivityByPackage", () => {
  const item = (packageId: string, audience: ContentAudience): GenerationActivityItem => ({
    jobId: `${packageId}-${audience}`,
    stageId: "s",
    packageId,
    theme: packageId,
    biblicalReferences: "",
    trackId: audience,
    audience,
    stageType: ContentStageType.LESSON,
    capability: AiGenerationCapability.TEXT_STRUCTURED,
    status: GenerationJobStatus.RUNNING,
    attempts: 1,
    progress: null,
    errorCode: null,
    startedAt: base.startedAt,
    updatedAt: base.startedAt,
    heartbeatAt: null,
  });

  it("agrupa por material e ordena as faixas pela ordem do catálogo", () => {
    const groups = groupActivityByPackage(
      [item("p1", ContentAudience.TEEN), item("p2", ContentAudience.BABY), item("p1", ContentAudience.BABY)],
      [ContentAudience.BABY, ContentAudience.CHILD, ContentAudience.TEEN],
    );
    expect(groups.map((group) => group.packageId)).toEqual(["p1", "p2"]);
    expect(groups[0].items.map((entry) => entry.audience)).toEqual([ContentAudience.BABY, ContentAudience.TEEN]);
  });
});
