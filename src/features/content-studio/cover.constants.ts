/** Textos do card da imagem de apresentação (capa) do material. */
export const PACKAGE_COVER_TEXTS = {
  title: "Imagem de apresentação",
  description:
    "É a imagem do card deste material em Materiais de Visita. Nasce junto com o material, não passa por revisão e pode ser refeita quando quiser, inclusive depois de publicado.",
  generating: "Desenhando a imagem… isso leva cerca de um minuto.",
  openButton: "Imagem de apresentação",
  close: "Fechar",
  newCoverAria: "Há uma imagem de apresentação nova para ver",
  generate: "Gerar imagem",
  regenerate: "Gerar de novo",
  instructionsLabel: "Orientação para o desenho (opcional)",
  instructionsPlaceholder: "Ex.: o personagem segurando o cajado, com um campo de ovelhas ao fundo",
  missing: "Ainda não há imagem de apresentação. Gere uma para o card do material.",
  error: "Não foi possível pedir a imagem agora. Tente novamente em instantes.",
  imageAlt: (theme: string) => `Imagem de apresentação do material ${theme}`,
} as const;
