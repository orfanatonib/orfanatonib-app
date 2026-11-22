import { describe, expect, it } from "vitest";

import { ContentAudience, ContentStageType, VisualOrientation } from "./types";
import { FUN_IMAGES_TITLE } from "./workspace.constants";
import { funImagesLayout } from "./workspace.utils";

describe("funImagesLayout", () => {
  it("fixação: sempre paisagem", () => {
    expect(funImagesLayout(ContentStageType.VERSE_FIXATION, ContentAudience.TEEN, null)).toEqual({
      orientation: VisualOrientation.LANDSCAPE,
      title: FUN_IMAGES_TITLE.FIXATION,
    });
  });

  it("brincadeira com kit de peças: paisagem, com o título por faixa etária nas crianças", () => {
    const content = { pieces: [{ id: "peca-01", text: "Pule", figure: "Sapo" }] };
    expect(funImagesLayout(ContentStageType.STANDARD_GAME, ContentAudience.ADULT, content)).toEqual({
      orientation: VisualOrientation.LANDSCAPE,
      title: FUN_IMAGES_TITLE.GAME_KIT,
    });
    expect(funImagesLayout(ContentStageType.STANDARD_GAME, ContentAudience.CHILD, content).title).toBe(FUN_IMAGES_TITLE.GAME_KIT_BY_AGE);
  });

  it("brincadeira antiga, sem peças: continua em retrato", () => {
    expect(funImagesLayout(ContentStageType.STANDARD_GAME, ContentAudience.CHILD, { name: "Gincana" })).toEqual({
      orientation: VisualOrientation.PORTRAIT,
      title: FUN_IMAGES_TITLE.GAME_BY_AGE,
    });
    expect(funImagesLayout(ContentStageType.STANDARD_GAME, ContentAudience.BABY, undefined).orientation).toBe(VisualOrientation.PORTRAIT);
  });
});
