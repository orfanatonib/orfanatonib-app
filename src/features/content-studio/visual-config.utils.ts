import {
  CUTOUT_KIT_SHEETS,
  DEFAULT_VISUAL_FORMAT_BY_AUDIENCE,
  VISUAL_FORMAT_OPTIONS,
  VISUAL_ORIENTATION_LABELS,
  VISUAL_QUANTITY_MAX,
  VISUAL_QUANTITY_MIN,
  VISUAL_STYLES_BY_AUDIENCE,
  VISUAL_STYLE_LABELS,
} from "./visual.constants";
import { ContentAudience, VisualFormat, VisualOrientation, type VisualConfig } from "./types";

export interface VisualConfigForm {
  quantity: number | "";
  format: VisualFormat | "";
  style: VisualConfig["style"];
  orientation: VisualOrientation | "";
  instructions: string;
}

/** Formulário inicial de uma categoria: o desenho padrão dela; o resto o admin escolhe. */
export function emptyVisualConfigForm(audience: ContentAudience): VisualConfigForm {
  return {
    quantity: "",
    format: DEFAULT_VISUAL_FORMAT_BY_AUDIENCE[audience],
    style: VISUAL_STYLES_BY_AUDIENCE[audience][0],
    orientation: "",
    instructions: "",
  };
}

/** Formulário preenchido com a configuração gravada na versão atual (para "alterar escolhas"). */
export function visualConfigFormFrom(config: unknown, audience: ContentAudience): VisualConfigForm {
  const base = emptyVisualConfigForm(audience);
  if (!config || typeof config !== "object") return base;
  const value = config as Partial<VisualConfig>;
  return {
    quantity: typeof value.quantity === "number" ? value.quantity : base.quantity,
    format: value.format ?? base.format,
    style: value.style && VISUAL_STYLES_BY_AUDIENCE[audience].includes(value.style) ? value.style : base.style,
    orientation: value.orientation ?? base.orientation,
    instructions: typeof value.instructions === "string" ? value.instructions : "",
  };
}

export const isValidVisualQuantity = (quantity: number | ""): quantity is number =>
  typeof quantity === "number" && Number.isInteger(quantity) && quantity >= VISUAL_QUANTITY_MIN && quantity <= VISUAL_QUANTITY_MAX;

export function isVisualConfigComplete(form: VisualConfigForm): boolean {
  return isValidVisualQuantity(form.quantity) && Boolean(form.format) && Boolean(form.orientation);
}

/** Corpo do pedido (só com o formulário completo). */
export function toVisualConfig(form: VisualConfigForm): VisualConfig | null {
  if (!isVisualConfigComplete(form) || !form.format || !form.orientation || typeof form.quantity !== "number") return null;
  const instructions = form.instructions.trim();
  return {
    quantity: form.quantity,
    format: form.format,
    style: form.style,
    orientation: form.orientation,
    ...(instructions ? { instructions } : {}),
  };
}

/** "6 pranchas · Kit de recortes · Cartoon fofo (padrão) · Horizontal" */
export function visualConfigSummary(config: VisualConfig): string {
  const kit = config.format === VisualFormat.CUTOUT_KIT;
  const format = VISUAL_FORMAT_OPTIONS.find((option) => option.value === config.format)?.title ?? "";
  return [
    `${config.quantity} ${kit ? "pranchas" : "imagens"}`,
    format,
    VISUAL_STYLE_LABELS[config.style].title,
    config.orientation === VisualOrientation.PORTRAIT ? "Vertical" : "Horizontal",
  ].join(" · ");
}

export const visualOrientationLabel = (orientation: VisualOrientation): string => VISUAL_ORIENTATION_LABELS[orientation];

/** Como o kit se divide para a quantidade escolhida (ex.: "Personagens · Animais · …"). */
export function cutoutKitSummary(quantity: number): string {
  const sheets = CUTOUT_KIT_SHEETS[Math.min(VISUAL_QUANTITY_MAX, Math.max(VISUAL_QUANTITY_MIN, Math.trunc(quantity) || VISUAL_QUANTITY_MIN))];
  return sheets.join(" · ");
}
