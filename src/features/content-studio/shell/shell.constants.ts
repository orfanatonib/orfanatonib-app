/** Cabeçalho de cada tela do Estúdio: o mesmo lugar e o mesmo formato em todas, para a navegação não "dançar". */
export interface StudioRouteMeta {
  /** Prefixo da rota (`/adm/estudio/...`). A primeira que casa vence; ordem do mais específico ao mais geral. */
  path: string;
  /** `true` exige a rota exata (a visão geral). */
  exact?: boolean;
  title: string;
  description: string;
  /** Para onde volta o botão "Voltar"; ausente na visão geral. */
  backTo?: string;
  backLabel?: string;
  /**
   * Tela de detalhe de um material (`.../:id`): a própria tela já mostra o tema e o andamento, então o cabeçalho
   * deixa só UMA barra de "voltar" (sem título e descrição repetidos). Casa só com subcaminhos, nunca com a lista.
   */
  detail?: boolean;
}

export const STUDIO_ROOT = "/adm/estudio";

export const STUDIO_ROUTE_META: readonly StudioRouteMeta[] = [
  {
    path: `${STUDIO_ROOT}/pacotes`,
    title: "Material para visita",
    description: "Gere, escreva e revise cada etapa; veja o PDF e baixe em DOCX.",
    backTo: `${STUDIO_ROOT}/producao`,
    backLabel: "Voltar aos materiais",
    detail: true,
  },
  {
    path: `${STUDIO_ROOT}/revisao`,
    title: "Revisão editorial",
    description: "Confira segurança, fidelidade e adequação antes de aprovar uma versão.",
    backTo: `${STUDIO_ROOT}/revisao`,
    backLabel: "Voltar para a revisão",
    detail: true,
  },
  {
    path: `${STUDIO_ROOT}/producao`,
    title: "Materiais para visita",
    description: "Produza o material de cada visita: gere, revise e aprove etapa por etapa.",
    backTo: STUDIO_ROOT,
    backLabel: "Voltar à visão geral",
  },
  {
    path: `${STUDIO_ROOT}/revisao`,
    title: "Revisão editorial",
    description: "Confira segurança, fidelidade e adequação antes de aprovar uma versão.",
    backTo: STUDIO_ROOT,
    backLabel: "Voltar à visão geral",
  },
  {
    path: `${STUDIO_ROOT}/orientacoes`,
    title: "Orientações de criação",
    description: "Diga à IA como você quer cada etapa. Ela soma o que você escrever às regras oficiais.",
    backTo: STUDIO_ROOT,
    backLabel: "Voltar à visão geral",
  },
  {
    path: STUDIO_ROOT,
    exact: true,
    title: "Estúdio Orfanato",
    description: "Acompanhe o fluxo editorial, identifique pendências e acesse produção e revisão.",
  },
];
