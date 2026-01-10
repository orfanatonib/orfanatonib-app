export function justDigits(phone?: string | number | null) {
  return phone ? String(phone).replace(/\D/g, "") : "";
}

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

