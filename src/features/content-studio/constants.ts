import AutoAwesome from "@mui/icons-material/AutoAwesome";
import FactCheck from "@mui/icons-material/FactCheck";
import Publish from "@mui/icons-material/Publish";

import {
  ContentPackageStatus,
  ContentStageStatus,
  ContentStageType,
} from "./types";

export const CONTENT_STUDIO_WORKFLOW = [
  {
    title: "Produção editorial",
    description: "Cada material nasce com Baby, Crianças, Adolescentes e Adultos, cada um com as cinco etapas.",
    icon: AutoAwesome,
    path: "/adm/estudio/producao",
    action: "Abrir produção",
    available: true,
  },
  {
    title: "Revisão editorial",
    description:
      "Validação humana obrigatória antes de qualquer conteúdo seguir adiante.",
    icon: FactCheck,
    path: "/adm/estudio/revisao",
    action: "Abrir fila",
    available: true,
  },
  {
    title: "Publicação controlada",
    description:
      "A exportação será liberada depois da aprovação do fluxo e dos destinos editoriais.",
    icon: Publish,
    path: null,
    action: "Ainda indisponível",
    available: false,
  },
] as const;

export const CONTENT_STUDIO_SAFETY_GUIDELINES = [
  "Nunca incluir nomes, documentos, diagnósticos, histórias familiares ou localização de acolhidos.",
  "Usar somente referências bíblicas e notas canônicas conferidas por uma pessoa responsável.",
  "Não representar nem imitar o rosto de uma pessoa real ou de um acolhido identificável.",
  "Evitar atividades que exponham trauma, constranjam participantes ou induzam diagnóstico.",
  "Manter revisão humana obrigatória antes de exportar ou publicar qualquer material.",
] as const;

export const CONTENT_STUDIO_REVIEW_CHECKLIST = [
  "A linguagem é adequada à faixa e respeita a autonomia dos participantes.",
  "A referência bíblica e as notas canônicas foram conferidas.",
  "Materiais, duração e instruções estão completos e são seguros.",
  "Não há dados pessoais, inferências ou representação de acolhidos reais.",
  "A versão revisada é exatamente a versão que seguirá para aprovação.",
] as const;

export const CONTENT_PACKAGE_STATUS_LABELS: Record<
  ContentPackageStatus,
  string
> = {
  [ContentPackageStatus.DRAFT]: "Rascunho",
  [ContentPackageStatus.IN_PROGRESS]: "Em produção",
  [ContentPackageStatus.PACKAGE_READY]: "Pacote pronto",
  [ContentPackageStatus.IN_REVIEW]: "Em revisão",
  [ContentPackageStatus.CHANGES_REQUESTED]: "Ajustes solicitados",
  [ContentPackageStatus.READY_FOR_PUBLICATION]: "Pronto para publicação",
  [ContentPackageStatus.PUBLISHING]: "Publicando",
  [ContentPackageStatus.PUBLISHED]: "Publicado",
  [ContentPackageStatus.ARCHIVED]: "Arquivado",
};

export const CONTENT_STAGE_STATUS_LABELS: Record<ContentStageStatus, string> = {
  [ContentStageStatus.NOT_STARTED]: "Não iniciada",
  [ContentStageStatus.GENERATING]: "Gerando",
  [ContentStageStatus.DRAFT]: "Rascunho",
  [ContentStageStatus.PRODUCER_APPROVED]: "Produção aprovada",
  [ContentStageStatus.IN_REVIEW]: "Em revisão",
  [ContentStageStatus.APPROVED]: "Aprovada",
  [ContentStageStatus.FAILED]: "Falhou",
  [ContentStageStatus.STALE]: "Desatualizada",
  [ContentStageStatus.CHANGES_REQUESTED]: "Ajustes solicitados",
  [ContentStageStatus.NOT_REQUIRED]: "Não obrigatória",
};

export const CONTENT_STAGE_TYPE_LABELS: Record<ContentStageType, string> = {
  [ContentStageType.LESSON]: "Lição",
  [ContentStageType.LESSON_VISUALS]: "Visuais da lição",
  [ContentStageType.VERSE_VISUALS]: "Visual do versículo",
  [ContentStageType.VERSE_FIXATION]: "Fixação divertida do versículo",
  [ContentStageType.STANDARD_GAME]: "Brincadeira divertida",
};
