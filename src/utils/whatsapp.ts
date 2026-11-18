import { digitsOnly } from "./masks";

/** Telefone só com dígitos; vazio/zero vira "" (diferente de `digitsOnly(0)`, que devolve "0"). */
export function justDigits(phone?: string | number | null): string {
  return phone ? digitsOnly(phone) : "";
}

export const SUPPORT_CONTACTS = {
  PHONE_1: '5561982549780',
  PHONE_2: '5592981553139',
  FORMATTED_1: '(61) 98254-9780',
  FORMATTED_2: '(92) 98155-3139',
} as const;

function buildWaMessage(userName?: string, adminName?: string) {
  const name = userName?.trim() || "usuário";
  const admin = adminName?.trim() || "administrador";

  return `Olá ${name}!

Sou ${admin}. Sou administrador do sistema do Ministério de Orfanatos.

Gostaria de falar com você sobre uma coisa:

`;
}

function buildIdeasWaMessage(userName?: string, ideaTitle?: string) {
  const name = userName?.trim().split(" ")[0] || "usuário";
  const idea = ideaTitle?.trim() || "sua ideia";

  return `Olá ${name}! 👋

Vi que você compartilhou "${idea}" no Ministério de Orfanatos e achei muito interessante!

Gostaria de conversar mais sobre isso com você.

`;
}

function buildTeamLinkingMessage() {
  return `Olá! Sou líder no Orfanatos NIB e preciso ser vinculado a um abrigo para acessar as funcionalidades. Pode me ajudar?`;
}

export function buildWhatsappLink(userName?: string, adminName?: string, phone?: string) {
  const digits = justDigits(phone);
  if (!digits) return null;
  const text = encodeURIComponent(buildWaMessage(userName, adminName));
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildIdeasWhatsappLink(userName?: string, ideaTitle?: string, phone?: string) {
  const digits = justDigits(phone);
  if (!digits) return null;
  const text = encodeURIComponent(buildIdeasWaMessage(userName, ideaTitle));
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildTeamLinkingWhatsappLink(phone: string) {
  const text = encodeURIComponent(buildTeamLinkingMessage());
  return `https://wa.me/${phone}?text=${text}`;
}

