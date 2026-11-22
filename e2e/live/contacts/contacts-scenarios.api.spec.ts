import type { APIRequestContext } from "@playwright/test";

import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import {
  BAD_ID,
  allContacts,
  contactRow,
  contactsWithTag,
  create,
  createRaw,
  deleteRaw,
  get,
  label,
  outboxByStatus,
  payload,
  readRaw,
  unreadInDb,
  type ContactBody,
  type ContactInput,
} from "./support";

/**
 * Cenários do plano 38 (`contact`): o formulário de contato é PÚBLICO (sem sessão) e devolve só um recibo; a caixa,
 * o "lido" e a exclusão são só do admin. Cada cenário cria os próprios dados pela API e prova o efeito por SELECT. O
 * aviso aos admins (`contact-received`) fica `skipped` no outbox porque a rodada de E2E desliga as flags de e-mail.
 * Autorização por perfil está em `contacts-authorization.api.spec.ts`; a isca anti-robô em `contacts-honeypot`.
 */
test.describe.serial("Contato — cenários de contrato e caixa do admin", () => {
  let admin: string;
  let member: Actor;
  let leader: Actor;
  const created: string[] = [];
  let counter = 0;
  const next = (): string => label(`ct-${(counter += 1)}`);

  const outboxTotal = async (): Promise<number> => Object.values(await outboxByStatus()).reduce((sum, n) => sum + n, 0);

  const make = async (request: APIRequestContext, overrides: Partial<ContactInput> = {}): Promise<string> => {
    const before = await outboxTotal();
    const receipt = await create(request, { name: next(), ...overrides });
    created.push(receipt.id);
    // O aviso aos admins sai em segundo plano: espera ele assentar para não contaminar a medição.
    await expect.poll(outboxTotal, { message: "aviso aos admins registrado no outbox" }).toBeGreaterThan(before);
    return receipt.id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = await createActor(request, admin, "member", "ct-member");
    leader = await createActor(request, admin, "leader", "ct-leader");
  });

  test.afterEach(async ({ request }) => {
    for (const id of created.splice(0)) await deleteRaw(request, admin, id);
  });

  test.afterAll(async ({ request }) => {
    await removeActors(request, admin, [member.id, leader.id]);
    expect(await contactsWithTag(RUN_TAG), "a limpeza deixou contatos do E2E").toBe(0);
    await closeDb();
  });

  // ───────────────────────── POST (público) ─────────────────────────
  test("[contact.post.contact#validacao] campos ausentes, em branco, longos demais, e-mail inválido ou campo interno (`read`, `id`): 400 e nada gravado", async ({ request }) => {
    const before = await allContacts();
    const base = payload({ name: next() });
    const bad: Array<[string, Record<string, unknown>]> = [
      ["sem nome", { ...base, name: undefined }],
      ["nome em branco", { ...base, name: "   " }],
      ["nome acima de 255", { ...base, name: "n".repeat(256) }],
      ["sem e-mail", { ...base, email: undefined }],
      ["e-mail inválido", { ...base, email: "nao-e-email" }],
      ["sem telefone", { ...base, phone: undefined }],
      ["telefone em branco", { ...base, phone: "  " }],
      ["telefone acima de 30", { ...base, phone: "1".repeat(31) }],
      ["sem mensagem", { ...base, message: undefined }],
      ["mensagem em branco", { ...base, message: "   " }],
      ["mensagem acima de 5000", { ...base, message: "m".repeat(5001) }],
      ["cliente tentando já marcar como lido", { ...base, read: true }],
      ["cliente tentando escolher o id", { ...base, id: BAD_ID }],
    ];
    for (const [title, body] of bad) {
      expect((await createRaw(request, undefined, body)).status(), title).toBe(400);
    }
    expect(await allContacts()).toBe(before);
  });

  test("[contact.post.contact#falha-do-colaborador-sem-efeito-parcial] corpo recusado não grava contato nem aviso por e-mail", async ({ request }) => {
    const before = { rows: await allContacts(), outbox: await outboxByStatus() };
    const res = await createRaw(request, undefined, payload({ name: next(), message: "m".repeat(5001) }));
    expect(res.status()).toBe(400);
    expect({ rows: await allContacts(), outbox: await outboxByStatus() }).toEqual(before);
  });

  test("[contact.post.contact#escopo-proprio-x-outro] visitante, membro e líder enviam; o recibo só traz id e data, e o conteúdo só o admin lê", async ({ request }) => {
    const anonymous = await create(request, { name: next() });
    const fromMember = await createRaw(request, member.token, payload({ name: next() }));
    const fromLeader = await createRaw(request, leader.token, payload({ name: next() }));
    expect([fromMember.status(), fromLeader.status()]).toEqual([201, 201]);
    const receipts = [anonymous, (await fromMember.json()) as { id: string }, (await fromLeader.json()) as { id: string }];
    created.push(...receipts.map((receipt) => receipt.id));
    for (const receipt of receipts) {
      expect(Object.keys(receipt).sort(), "o recibo não devolve nome, e-mail, mensagem nem `read`").toEqual(["createdAt", "id"]);
    }
    for (const token of [undefined, member.token, leader.token]) {
      const expected = token ? 403 : 401;
      expect((await get(request, token, "/contact")).status(), "caixa").toBe(expected);
      expect((await get(request, token, "/contact/pending-count")).status(), "selo").toBe(expected);
      expect((await readRaw(request, token ?? "", anonymous.id)).status(), "marcar como lido").toBe(expected);
      expect((await deleteRaw(request, token ?? "", anonymous.id)).status(), "apagar").toBe(expected);
    }
    expect((await contactRow(anonymous.id))?.read, "nada disso marcou nem apagou").toBe(0);
  });

  test("[contact.post.contact#conflito-ou-duplicidade] a mesma mensagem enviada duas vezes vira duas mensagens independentes (não há unicidade)", async ({ request }) => {
    const name = next();
    const first = await create(request, { name });
    const second = await create(request, { name });
    created.push(first.id, second.id);
    expect(first.id).not.toBe(second.id);
    expect(await contactsWithTag(name)).toBe(2);
  });

  test("[contact.post.contact#email-enviado-ou-bloqueado-por-flag] enviar registra o aviso aos admins no outbox, e com o e-mail desligado no E2E ele fica só `skipped`", async ({ request }) => {
    const before = await outboxByStatus();
    await make(request);
    const after = await outboxByStatus();
    expect((after.skipped ?? 0) - (before.skipped ?? 0), "um aviso `skipped` por admin").toBeGreaterThan(0);
    expect(after.pending ?? 0, "nada fica pendente (SMTP não é acionado)").toBe(before.pending ?? 0);
    expect(after.sent ?? 0).toBe(before.sent ?? 0);
  });

  test("com contact_form desligada o formulário público responde 403 FEATURE_DISABLED e nada é gravado", async ({ request }) => {
    const before = await allContacts();
    await withFlagsOff(request, admin, ["contact_form"], async () => {
      await expectFeatureDisabled(await createRaw(request, undefined, payload({ name: next() })));
    });
    expect(await allContacts()).toBe(before);
  });

  test("o texto é gravado aparado: espaços nas pontas do nome, e-mail, telefone e mensagem não entram", async ({ request }) => {
    const name = next();
    const receipt = await create(request, { name: `  ${name}  `, email: "  pessoa.e2e@orfanatonib.test ", phone: " 11999999999 ", message: "  Olá  " });
    created.push(receipt.id);
    expect(await contactRow(receipt.id)).toMatchObject({ name, email: "pessoa.e2e@orfanatonib.test", phone: "11999999999", message: "Olá" });
  });

  // ───────────────────────── GET ─────────────────────────
  test("[contact.get.contact#feliz] a caixa lista o que entrou (conteúdo completo e `read` falso) e o selo conta os não lidos", async ({ request }) => {
    const pendingBefore = ((await (await get(request, admin, "/contact/pending-count")).json()) as { pending: number }).pending;
    const firstId = await make(request, { message: "Primeira" });
    const secondId = await make(request, { message: "Segunda", phone: "92988887777" });
    const list = (await (await get(request, admin, "/contact")).json()) as ContactBody[];
    const first = list.find((item) => item.id === firstId);
    const second = list.find((item) => item.id === secondId);
    expect(first).toMatchObject({ message: "Primeira", read: false });
    expect(second).toMatchObject({ message: "Segunda", phone: "92988887777", read: false });
    const pending = ((await (await get(request, admin, "/contact/pending-count")).json()) as { pending: number }).pending;
    expect(pending).toBe(pendingBefore + 2);
    expect(pending).toBe(await unreadInDb());
  });

  // ───────────────────────── PATCH :id/read ─────────────────────────
  test("[contact.patch.contact-id-read#feliz] marcar como lido troca `read` e baixa o selo em um", async ({ request }) => {
    const id = await make(request);
    const before = await unreadInDb();
    const res = await readRaw(request, admin, id);
    expect(res.status(), await res.text()).toBe(200);
    expect((await res.json()) as ContactBody).toMatchObject({ id, read: true });
    expect((await contactRow(id))?.read).toBe(1);
    expect(await unreadInDb()).toBe(before - 1);
  });

  test("[contact.patch.contact-id-read#conflito-ou-duplicidade] marcar duas vezes: 200 nas duas e o selo baixa só uma vez", async ({ request }) => {
    const id = await make(request);
    const before = await unreadInDb();
    expect((await readRaw(request, admin, id)).status()).toBe(200);
    expect((await readRaw(request, admin, id)).status()).toBe(200);
    expect(await unreadInDb()).toBe(before - 1);
  });

  test("[contact.patch.contact-id-read#nao-encontrado] id que não existe: 404 e nada muda", async ({ request }) => {
    const before = await unreadInDb();
    expect((await readRaw(request, admin, BAD_ID)).status()).toBe(404);
    expect(await unreadInDb()).toBe(before);
  });

  test("[contact.patch.contact-id-read#validacao] id malformado: 400 e nenhuma mensagem é marcada", async ({ request }) => {
    await make(request);
    const before = await unreadInDb();
    expect((await readRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await unreadInDb()).toBe(before);
  });

  test("[contact.patch.contact-id-read#falha-do-colaborador-sem-efeito-parcial] pedido recusado deixa as mensagens como estavam (lidas e não lidas)", async ({ request }) => {
    const unread = await make(request);
    const already = await make(request);
    await readRaw(request, admin, already);
    const before = { unread: await contactRow(unread), already: await contactRow(already) };
    expect((await readRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect({ unread: await contactRow(unread), already: await contactRow(already) }).toEqual(before);
  });

  test("[contact.patch.contact-id-read#email-enviado-ou-bloqueado-por-flag] marcar como lido não avisa ninguém: o outbox não muda", async ({ request }) => {
    const id = await make(request);
    const before = await outboxByStatus();
    expect((await readRaw(request, admin, id)).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
  });

  // ───────────────────────── DELETE ─────────────────────────
  test("[contact.delete.contact-id#feliz] apagar remove só a mensagem pedida", async ({ request }) => {
    const target = await make(request);
    const other = await make(request);
    expect((await deleteRaw(request, admin, target)).status()).toBe(200);
    expect(await contactRow(target)).toBeNull();
    expect((await contactRow(other))?.id, "a outra continua").toBe(other);
    created.splice(created.indexOf(target), 1);
  });

  test("[contact.delete.contact-id#nao-encontrado] apagar o que não existe (ou já foi apagado): 404", async ({ request }) => {
    const id = await make(request);
    expect((await deleteRaw(request, admin, id)).status()).toBe(200);
    expect((await deleteRaw(request, admin, id)).status()).toBe(404);
    expect((await deleteRaw(request, admin, BAD_ID)).status()).toBe(404);
    created.splice(created.indexOf(id), 1);
  });

  test("[contact.delete.contact-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhuma mensagem some", async ({ request }) => {
    await make(request);
    const before = await allContacts();
    expect((await deleteRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await allContacts()).toBe(before);
  });

  test("[contact.delete.contact-id#email-enviado-ou-bloqueado-por-flag] apagar não avisa ninguém: o outbox não muda", async ({ request }) => {
    const id = await make(request);
    const before = await outboxByStatus();
    expect((await deleteRaw(request, admin, id)).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
    created.splice(created.indexOf(id), 1);
  });
});
