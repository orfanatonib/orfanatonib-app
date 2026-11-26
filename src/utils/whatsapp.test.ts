import { describe, expect, it } from "vitest";

import { buildIdeasWhatsappLink, buildTeamLinkingWhatsappLink, buildWhatsappLink, phoneDigits, SUPPORT_CONTACTS } from "./whatsapp";

describe("phoneDigits", () => {
  it.each([["(61) 98254-9780", "61982549780"], [null, ""], [undefined, ""], ["", ""], [0, ""], [5592, "5592"]])(
    "%s → %s",
    (input, expected) => expect(phoneDigits(input as never)).toBe(expected),
  );
});

describe("links do WhatsApp", () => {
  it("buildWhatsappLink usa os dígitos e codifica a mensagem", () => {
    const link = buildWhatsappLink("Ana", "Rodolfo", "(92) 98155-3139")!;
    expect(link.startsWith("https://wa.me/92981553139?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toContain("Olá Ana!");
    expect(decodeURIComponent(link.split("text=")[1])).toContain("Sou Rodolfo");
  });

  it("sem telefone não há link", () => {
    expect(buildWhatsappLink("Ana", "Rodolfo", "")).toBeNull();
    expect(buildIdeasWhatsappLink("Ana", "Ideia", undefined)).toBeNull();
  });

  it("nomes vazios usam os padrões", () => {
    const text = decodeURIComponent(buildWhatsappLink(undefined, undefined, "11999999999")!.split("text=")[1]);
    expect(text).toContain("Olá usuário!");
    expect(text).toContain("Sou administrador");
  });

  it("ideias usa só o primeiro nome e o título", () => {
    const text = decodeURIComponent(buildIdeasWhatsappLink("Ana Maria", "Jogo da memória", "11999999999")!.split("text=")[1]);
    expect(text).toContain("Olá Ana!");
    expect(text).toContain('"Jogo da memória"');
  });

  it("ideias sem nome nem título usam os padrões", () => {
    const text = decodeURIComponent(buildIdeasWhatsappLink(undefined, undefined, "11999999999")!.split("text=")[1]);
    expect(text).toContain("Olá usuário!");
    expect(text).toContain("sua ideia");
  });

  it("vínculo de equipe usa o telefone como veio", () => {
    expect(buildTeamLinkingWhatsappLink(SUPPORT_CONTACTS.PHONE_1).startsWith(`https://wa.me/${SUPPORT_CONTACTS.PHONE_1}?text=`)).toBe(true);
  });
});
