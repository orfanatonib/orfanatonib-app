import { ContentAudience, VisualFormat, VisualOrientation, VisualStyle } from "./types";

/** Perguntas dos visuais da lição (as mesmas do Clubinho): quantidade, tipo e desenho, formato da página. */
export const VISUAL_QUANTITY_MIN = 4;
export const VISUAL_QUANTITY_MAX = 10;
export const VISUAL_INSTRUCTIONS_MAX = 1000;

export const VISUAL_SETUP_STEPS = ["Quantidade", "Tipo e desenho", "Formato da página"] as const;

export interface VisualOption<T extends string> {
  value: T;
  title: string;
  description: string;
}

export const VISUAL_FORMAT_OPTIONS: ReadonlyArray<VisualOption<VisualFormat>> = [
  {
    value: VisualFormat.CUTOUT_KIT,
    title: "Kit de recortes",
    description: "Pranchas com personagens, animais, construções, cenário e objetos para recortar e montar.",
  },
  {
    value: VisualFormat.STORY_SCENES,
    title: "Cenas completas",
    description: "Uma ilustração inteira por trecho da história, com ambiente, personagens e a ação daquele momento.",
  },
];

export const VISUAL_STYLE_LABELS: Readonly<Record<VisualStyle, VisualOption<VisualStyle>>> = {
  [VisualStyle.CUTE_CARTOON]: {
    value: VisualStyle.CUTE_CARTOON,
    title: "Cartoon fofo (padrão)",
    description: "Personagens de cabeça grande, olhos brilhantes, cores vivas e contorno grosso.",
  },
  [VisualStyle.ILLUSTRATED]: {
    value: VisualStyle.ILLUSTRATED,
    title: "Livro ilustrado",
    description: "Pintura digital suave, cores claras e luminosas.",
  },
  [VisualStyle.CLASSIC_CARTOON]: {
    value: VisualStyle.CLASSIC_CARTOON,
    title: "Desenho bíblico clássico",
    description: "Contorno preto forte, cores chapadas e poucos detalhes.",
  },
  [VisualStyle.MODERN_ILLUSTRATION]: {
    value: VisualStyle.MODERN_ILLUSTRATION,
    title: "Ilustração moderna",
    description: "Estilo de série animada ou capa de livro jovem, traço limpo e luz dramática.",
  },
  [VisualStyle.GRAPHIC_NOVEL]: {
    value: VisualStyle.GRAPHIC_NOVEL,
    title: "Graphic novel",
    description: "Tinta marcada, contraste forte e enquadramento de quadrinhos.",
  },
  [VisualStyle.EDITORIAL_PAINTING]: {
    value: VisualStyle.EDITORIAL_PAINTING,
    title: "Pintura editorial",
    description: "Ilustração sóbria de livro de estudo, paleta terrosa e calma.",
  },
  [VisualStyle.SOFT_WATERCOLOR]: {
    value: VisualStyle.SOFT_WATERCOLOR,
    title: "Aquarela suave",
    description: "Aquarela digital delicada, cores diluídas e luz natural.",
  },
};

/** Desenhos oferecidos a cada categoria (o primeiro é o padrão): iguais aos da API. */
export const VISUAL_STYLES_BY_AUDIENCE: Readonly<Record<ContentAudience, readonly VisualStyle[]>> = {
  [ContentAudience.BABY]: [VisualStyle.CUTE_CARTOON, VisualStyle.ILLUSTRATED, VisualStyle.CLASSIC_CARTOON],
  [ContentAudience.CHILD]: [VisualStyle.CUTE_CARTOON, VisualStyle.ILLUSTRATED, VisualStyle.CLASSIC_CARTOON],
  [ContentAudience.TEEN]: [VisualStyle.MODERN_ILLUSTRATION, VisualStyle.GRAPHIC_NOVEL, VisualStyle.CLASSIC_CARTOON],
  [ContentAudience.ADULT]: [VisualStyle.EDITORIAL_PAINTING, VisualStyle.SOFT_WATERCOLOR, VisualStyle.GRAPHIC_NOVEL],
};

/** Tipo sugerido por categoria (o admin pode trocar): bebê e crianças recortam; jovens e adultos veem cenas. */
export const DEFAULT_VISUAL_FORMAT_BY_AUDIENCE: Readonly<Record<ContentAudience, VisualFormat>> = {
  [ContentAudience.BABY]: VisualFormat.CUTOUT_KIT,
  [ContentAudience.CHILD]: VisualFormat.CUTOUT_KIT,
  [ContentAudience.TEEN]: VisualFormat.STORY_SCENES,
  [ContentAudience.ADULT]: VisualFormat.STORY_SCENES,
};

export const VISUAL_ORIENTATION_LABELS: Readonly<Record<VisualOrientation, string>> = {
  [VisualOrientation.LANDSCAPE]: "Horizontal — paisagem",
  [VisualOrientation.PORTRAIT]: "Vertical — retrato",
};

/** Pranchas do kit por quantidade (resumo mostrado na pergunta da quantidade). */
export const CUTOUT_KIT_SHEETS: Readonly<Record<number, readonly string[]>> = {
  4: ["Personagens", "Animais + Objetos", "Construções + Cenário", "Céu e natureza"],
  5: ["Personagens", "Animais", "Objetos", "Construções + Cenário", "Céu e natureza"],
  6: ["Personagens", "Animais", "Objetos", "Construções", "Cenário", "Céu e natureza"],
  7: ["Personagens", "Animais", "Objetos", "Construções", "Cenário", "Céu e natureza", "Céu e natureza (mais)"],
  8: ["Personagens", "Animais", "Animais (mais)", "Objetos", "Construções", "Cenário", "Céu e natureza", "Céu e natureza (mais)"],
  9: ["Personagens", "Personagens (poses)", "Animais", "Animais (mais)", "Objetos", "Construções", "Cenário", "Céu e natureza", "Céu e natureza (mais)"],
  10: ["Personagens", "Personagens (poses)", "Animais", "Animais (mais)", "Objetos", "Objetos (mais)", "Construções", "Cenário", "Céu e natureza", "Céu e natureza (mais)"],
};
