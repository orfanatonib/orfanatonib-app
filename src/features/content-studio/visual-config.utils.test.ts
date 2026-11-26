import { describe, expect, it } from "vitest";

import { ContentAudience, VisualFormat, VisualOrientation, VisualStyle } from "./types";
import {
  cutoutKitSummary,
  emptyVisualConfigForm,
  isValidVisualQuantity,
  isVisualConfigComplete,
  toVisualConfig,
  visualConfigFormFrom,
  visualConfigSummary,
} from "./visual-config.utils";
import { CUTOUT_KIT_SHEETS, VISUAL_STYLES_BY_AUDIENCE } from "./visual.constants";

describe("perguntas dos visuais da lição", () => {
  it("cada categoria começa com o desenho e o tipo sugeridos para ela", () => {
    expect(emptyVisualConfigForm(ContentAudience.BABY)).toMatchObject({ style: VisualStyle.CUTE_CARTOON, format: VisualFormat.CUTOUT_KIT });
    expect(emptyVisualConfigForm(ContentAudience.TEEN)).toMatchObject({
      style: VisualStyle.MODERN_ILLUSTRATION,
      format: VisualFormat.STORY_SCENES,
    });
    expect(emptyVisualConfigForm(ContentAudience.ADULT)).toMatchObject({
      style: VisualStyle.EDITORIAL_PAINTING,
      format: VisualFormat.STORY_SCENES,
    });
  });

  it("cada categoria oferece 3 desenhos e nenhum é o de outra categoria (adulto não vê cartoon fofo)", () => {
    for (const audience of Object.values(ContentAudience)) expect(VISUAL_STYLES_BY_AUDIENCE[audience]).toHaveLength(3);
    expect(VISUAL_STYLES_BY_AUDIENCE[ContentAudience.ADULT]).not.toContain(VisualStyle.CUTE_CARTOON);
    expect(VISUAL_STYLES_BY_AUDIENCE[ContentAudience.TEEN]).not.toContain(VisualStyle.CUTE_CARTOON);
  });

  it("a quantidade vai de 4 a 10, inteira", () => {
    for (const ok of [4, 7, 10]) expect(isValidVisualQuantity(ok)).toBe(true);
    for (const bad of [3, 11, 4.5, "" as const]) expect(isValidVisualQuantity(bad as number | "")).toBe(false);
  });

  it("só gera com as três respostas; o corpo do pedido leva a orientação extra aparada", () => {
    const form = emptyVisualConfigForm(ContentAudience.CHILD);
    expect(isVisualConfigComplete(form)).toBe(false);
    expect(toVisualConfig(form)).toBeNull();
    const done = { ...form, quantity: 6, orientation: VisualOrientation.PORTRAIT, instructions: "  cores suaves  " };
    expect(isVisualConfigComplete(done)).toBe(true);
    expect(toVisualConfig(done)).toEqual({
      quantity: 6,
      format: VisualFormat.CUTOUT_KIT,
      style: VisualStyle.CUTE_CARTOON,
      orientation: VisualOrientation.PORTRAIT,
      instructions: "cores suaves",
    });
    expect(toVisualConfig({ ...done, instructions: "   " })).not.toHaveProperty("instructions");
  });

  it("'alterar escolhas' reabre com o que foi gravado, mas ignora desenho que a categoria não oferece", () => {
    const saved = {
      quantity: 5,
      format: VisualFormat.STORY_SCENES,
      style: VisualStyle.CUTE_CARTOON,
      orientation: VisualOrientation.LANDSCAPE,
    };
    const form = visualConfigFormFrom(saved, ContentAudience.ADULT);
    expect(form).toMatchObject({ quantity: 5, format: VisualFormat.STORY_SCENES, orientation: VisualOrientation.LANDSCAPE });
    expect(form.style).toBe(VisualStyle.EDITORIAL_PAINTING);
    expect(visualConfigFormFrom(null, ContentAudience.BABY)).toEqual(emptyVisualConfigForm(ContentAudience.BABY));
  });

  it("resumo legível e divisão do kit por quantidade", () => {
    expect(
      visualConfigSummary({
        quantity: 6,
        format: VisualFormat.CUTOUT_KIT,
        style: VisualStyle.CUTE_CARTOON,
        orientation: VisualOrientation.LANDSCAPE,
      }),
    ).toBe("6 pranchas · Kit de recortes · Cartoon fofo (padrão) · Horizontal");
    expect(
      visualConfigSummary({
        quantity: 4,
        format: VisualFormat.STORY_SCENES,
        style: VisualStyle.GRAPHIC_NOVEL,
        orientation: VisualOrientation.PORTRAIT,
      }),
    ).toBe("4 imagens · Cenas completas · Graphic novel · Vertical");
    for (let quantity = 4; quantity <= 10; quantity += 1) expect(CUTOUT_KIT_SHEETS[quantity]).toHaveLength(quantity);
    expect(cutoutKitSummary(5)).toContain("Personagens");
    expect(cutoutKitSummary(99)).toBe(CUTOUT_KIT_SHEETS[10].join(" · "));
  });
});
