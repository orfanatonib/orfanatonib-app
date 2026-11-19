import { ContentStageType } from "../types";

export const PROMPT_PREFERENCES_ENDPOINT = "/content-studio/prompt-preferences/me";
export const PROMPT_STALE_TIME_MS = 30_000;
export const PROMPT_MIN_LENGTH = 10;
export const PROMPT_MAX_LENGTH = 6_000;
export const PROMPT_COPY_FEEDBACK_MS = 1_800;
export const PROMPT_STORAGE_PREFIX = "orfanato:studio:v1";
export const PROMPT_STORAGE_SCOPE = "prompts";

/** Espelha o cabeçalho usado pela API na prévia (`effectivePrompt`). */
export const PROMPT_COMPLEMENTARY_HEADER = "PERSONALIZAÇÃO DO ADMINISTRADOR:";

export const PROMPT_STAGE_CONFIG: Record<ContentStageType, { icon: string; description: string }> = {
  [ContentStageType.CANONICAL_BASE]: {
    icon: "📖",
    description: "A base fiel à Bíblia (texto, ideia central e objetivo) de que as outras etapas dependem.",
  },
  [ContentStageType.LESSON]: {
    icon: "🗣️",
    description: "O texto que o facilitador conta ou lê na visita, no tom e no tamanho certos para a faixa etária.",
  },
  [ContentStageType.DISCUSSION]: {
    icon: "💬",
    description: "As perguntas de conversa depois da história, para ouvir e acolher cada um.",
  },
  [ContentStageType.ACTIVITY]: {
    icon: "🎲",
    description: "A dinâmica ou atividade prática, pensada para o espaço e os materiais de uma visita.",
  },
  [ContentStageType.VISUAL]: {
    icon: "🎨",
    description: "Os apoios visuais da visita: cenas, cartazes e imagens genéricas, sem identificar pessoas.",
  },
  [ContentStageType.FACILITATOR_GUIDANCE]: {
    icon: "🧭",
    description: "O roteiro de cuidado para quem conduz: como acolher, o que evitar e como encerrar.",
  },
};

export const PROMPT_PRESETS = [
  { label: "Linguagem simples", text: "\n• Use vocabulário simples e direto, que qualquer pessoa da faixa etária entenda." },
  { label: "Aplicação prática", text: "\n• Conecte cada ensinamento a situações reais do dia a dia de quem está sendo visitado." },
  { label: "Acolhimento", text: "\n• Priorize um tom acolhedor, que valorize cada pessoa e nunca exponha ou compare ninguém." },
  { label: "Perguntas abertas", text: "\n• Inclua perguntas abertas que estimulem a conversa, sem respostas certas ou erradas." },
];

/** Exemplo do que cabe na orientação de cada etapa, mostrado no campo vazio (não é gravado). */
export const PROMPT_STAGE_EXAMPLES: Record<ContentStageType, string> = {
  [ContentStageType.CANONICAL_BASE]: "Ex.: Destaque uma única ideia central e use sempre a mesma tradução da Bíblia nas referências.",
  [ContentStageType.LESSON]: "Ex.: Conte em frases curtas, com uma pergunta a cada parte. Termine com uma aplicação simples para a semana.",
  [ContentStageType.DISCUSSION]: "Ex.: Faça poucas perguntas, todas abertas, e uma delas sobre gratidão. Evite perguntas sobre a família de quem participa.",
  [ContentStageType.ACTIVITY]: "Ex.: Dinâmicas que funcionem em sala pequena, só com papel e caneta, e em que todos participem ao mesmo tempo.",
  [ContentStageType.VISUAL]: "Ex.: Cenas com personagens de expressão clara e cores vivas, sem rostos reais e sem texto dentro da imagem.",
  [ContentStageType.FACILITATOR_GUIDANCE]:
    "Ex.: Lembre o facilitador de nunca fotografar nem pedir dados pessoais e de encerrar com uma oração curta e opcional.",
};

export const PROMPT_TEXTS = {
  title: "Orientações de criação",
  subtitle: "Diga à inteligência artificial como você quer cada etapa do material para visita. Ela soma o que você escrever às regras oficiais.",
  personalTitle: "Estas orientações são só suas",
  personalBody: "Valem para tudo o que você gerar daqui em diante. Cada administrador tem as próprias, e os materiais já gerados não mudam.",
  protectedNote:
    "As regras oficiais de cada etapa — estrutura, fidelidade bíblica, cuidado com o público e proteção de dados pessoais — continuam valendo e não podem ser desligadas por aqui.",
  editorLabel: "Sua orientação para esta etapa",
  presetsLabel: "Sugestões prontas — toque para acrescentar:",
  baseTitle: "Regras oficiais desta etapa (não editáveis)",
  baseHelper: "É o que a IA sempre recebe. A sua orientação é somada a este texto.",
  previewTitle: "Como a IA vai receber (regras oficiais + a sua orientação)",
  previewHelper: "Prévia do texto desta etapa enviado à IA, somado ao contrato geral do Estúdio.",
  official: "Padrão oficial",
  custom: "Personalizada",
  pending: "Alterações não salvas",
  save: "Salvar orientação",
  saving: "Salvando…",
  remove: "Remover minha orientação",
  restore: "Voltar ao padrão oficial",
  discard: "Descartar alterações",
  saved: "Orientação salva. Ela vale para as suas próximas gerações.",
  restored: "Orientação removida. Esta etapa voltou ao padrão oficial.",
  saveShortcut: "Ctrl+S salva",
  loadError: "Não foi possível carregar as orientações de criação.",
  conflict:
    "Você alterou esta orientação em outra aba ou aparelho. O texto daqui foi preservado; escolha abaixo entre aplicá-lo sobre a versão atual ou descartá-lo.",
  saveError: "Não foi possível salvar. O texto que você digitou foi preservado.",
  resetConflict: "Você alterou esta orientação em outra aba ou aparelho antes de voltar ao padrão. O texto daqui foi preservado.",
  resetError: "Não foi possível voltar ao padrão oficial.",
} as const;
