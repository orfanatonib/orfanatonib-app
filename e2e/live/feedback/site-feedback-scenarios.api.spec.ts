import type { APIRequestContext } from "@playwright/test";

import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import {
  BAD_ID,
  allFeedbacks,
  create,
  createRaw,
  deleteRaw,
  feedbackRow,
  feedbacksWithTag,
  get,
  label,
  outboxByStatus,
  payload,
  putRaw,
  readRaw,
  unreadInDb,
  type FeedbackBody,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários do plano 39 (`site-feedback`): qualquer usuário autenticado ENVIA a avaliação; caixa, detalhe, edição,
 * "lido" e exclusão são só do admin. Cada cenário cria os próprios dados pela API e prova o efeito por SELECT. O aviso
 * por e-mail aos admins (`feedback-received`) fica `skipped` no outbox porque a rodada de E2E desliga as flags de
 * e-mail; religar mandaria SMTP de verdade. Autorização por perfil está em `site-feedback-authorization.api.spec.ts`.
 */
test.describe.serial("Avaliações do site — cenários de contrato", () => {
  let admin: string;
  let member: Actor;
  let leader: Actor;
  const created: string[] = [];
  let counter = 0;
  const next = (): string => label(`sf-${(counter += 1)}`);

  const outboxTotal = async (): Promise<number> => Object.values(await outboxByStatus()).reduce((sum, n) => sum + n, 0);

  const make = async (request: APIRequestContext, overrides: Parameters<typeof create>[2] extends infer T ? Partial<T> : never = {}): Promise<FeedbackBody> => {
    const before = await outboxTotal();
    const body = await create(request, admin, { name: next(), ...overrides });
    created.push(body.id);
    // O aviso aos admins sai em segundo plano (`void notifyAdmins`): espera ele assentar para não contaminar a medição.
    await expect.poll(outboxTotal, { message: "aviso aos admins registrado no outbox" }).toBeGreaterThan(before);
    return body;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = await createActor(request, admin, "member", "sf-member");
    leader = await createActor(request, admin, "leader", "sf-leader");
  });

  test.afterEach(async ({ request }) => {
    for (const id of created.splice(0)) await deleteRaw(request, admin, id);
  });

  test.afterAll(async ({ request }) => {
    await removeActors(request, admin, [member.id, leader.id]);
    if (CLEANUP_ENABLED) expect(await feedbacksWithTag(RUN_TAG), "a limpeza deixou avaliações do E2E").toBe(0);
    await closeDb();
  });

  // ───────────────────────── POST ─────────────────────────
  test("[site-feedback.post.site-feedbacks#validacao] nome, nota, comentário, categoria e e-mail inválidos: 400 e nada gravado", async ({ request }) => {
    const before = await allFeedbacks();
    const base = payload({ name: next() });
    const bad: Array<[string, Record<string, unknown>]> = [
      ["sem nome", { ...base, name: undefined }],
      ["nome em branco", { ...base, name: "   " }],
      ["nome acima de 100", { ...base, name: "n".repeat(101) }],
      ["nota 0", { ...base, rating: 0 }],
      ["nota 6", { ...base, rating: 6 }],
      ["nota fracionada", { ...base, rating: 4.5 }],
      ["nota texto", { ...base, rating: "cinco" }],
      ["sem comentário", { ...base, comment: undefined }],
      ["comentário em branco", { ...base, comment: "   " }],
      ["comentário acima de 5000", { ...base, comment: "c".repeat(5001) }],
      ["categoria fora do enum", { ...base, category: "alien" }],
      ["e-mail inválido", { ...base, email: "nao-e-email" }],
      ["campo desconhecido", { ...base, read: true }],
    ];
    for (const [title, body] of bad) {
      expect((await createRaw(request, member.token, body)).status(), title).toBe(400);
    }
    expect(await allFeedbacks()).toBe(before);
  });

  test("[site-feedback.post.site-feedbacks#falha-do-colaborador-sem-efeito-parcial] corpo recusado não grava avaliação nem aviso por e-mail", async ({ request }) => {
    const before = { rows: await allFeedbacks(), outbox: await outboxByStatus() };
    const res = await createRaw(request, member.token, payload({ name: next(), comment: "c".repeat(5001) }));
    expect(res.status()).toBe(400);
    expect({ rows: await allFeedbacks(), outbox: await outboxByStatus() }).toEqual(before);
  });

  test("[site-feedback.post.site-feedbacks#escopo-proprio-x-outro] membro e líder enviam; o conteúdo só o admin lê (quem enviou não consegue reler)", async ({ request }) => {
    const fromMember = await create(request, member.token, { name: next(), email: member.email });
    const fromLeader = await create(request, leader.token, { name: next() });
    created.push(fromMember.id, fromLeader.id);
    expect((await feedbackRow(fromMember.id))?.email).toBe(member.email);
    for (const token of [member.token, leader.token]) {
      expect((await get(request, token, `/site-feedbacks/${fromMember.id}`)).status(), "autor não lê o detalhe").toBe(403);
      expect((await get(request, token, "/site-feedbacks")).status(), "autor não lê a caixa").toBe(403);
    }
    const list = (await (await get(request, admin, "/site-feedbacks")).json()) as FeedbackBody[];
    expect(list.map((item) => item.id)).toEqual(expect.arrayContaining([fromMember.id, fromLeader.id]));
  });

  test("[site-feedback.post.site-feedbacks#conflito-ou-duplicidade] o mesmo texto enviado duas vezes vira duas avaliações independentes (não há unicidade)", async ({ request }) => {
    const name = next();
    const first = await create(request, member.token, { name });
    const second = await create(request, member.token, { name });
    created.push(first.id, second.id);
    expect(first.id).not.toBe(second.id);
    expect(await feedbacksWithTag(name)).toBe(2);
  });

  test("[site-feedback.post.site-feedbacks#email-enviado-ou-bloqueado-por-flag] enviar avaliação registra o aviso aos admins no outbox, e com o e-mail desligado no E2E ele fica só `skipped`", async ({ request }) => {
    const before = await outboxByStatus();
    const body = await make(request, { name: next() });
    const after = await outboxByStatus();
    expect((after.skipped ?? 0) - (before.skipped ?? 0), "um aviso `skipped` por admin").toBeGreaterThan(0);
    expect(after.pending ?? 0, "nada fica pendente (SMTP não é acionado)").toBe(before.pending ?? 0);
    expect(after.sent ?? 0).toBe(before.sent ?? 0);
    expect(body.read).toBe(false);
  });

  test("sessão obrigatória: visitante recebe 401 e nada é gravado", async ({ request }) => {
    const before = await allFeedbacks();
    expect((await createRaw(request, undefined, payload({ name: next() }))).status()).toBe(401);
    expect(await allFeedbacks()).toBe(before);
  });

  // ───────────────────────── GET ─────────────────────────
  test("[site-feedback.get.site-feedbacks#feliz] a caixa lista o que entrou, mais recente primeiro, e o selo conta os não lidos", async ({ request }) => {
    const pendingBefore = ((await (await get(request, admin, "/site-feedbacks/pending-count")).json()) as { pending: number }).pending;
    const first = await make(request);
    const second = await make(request);
    const list = (await (await get(request, admin, "/site-feedbacks")).json()) as FeedbackBody[];
    const ids = list.map((item) => item.id);
    expect(ids.indexOf(second.id), "o mais recente vem antes").toBeLessThan(ids.indexOf(first.id));
    const pending = ((await (await get(request, admin, "/site-feedbacks/pending-count")).json()) as { pending: number }).pending;
    expect(pending).toBe(pendingBefore + 2);
    expect(pending).toBe(await unreadInDb());
  });

  test("[site-feedback.get.site-feedbacks-id#feliz] ler por id traz exatamente o que foi enviado", async ({ request }) => {
    const sent = await make(request, { name: next(), rating: 3, comment: "Texto exato", category: "usability", email: "pessoa@example.com" });
    const res = await get(request, admin, `/site-feedbacks/${sent.id}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: sent.id, rating: 3, comment: "Texto exato", category: "usability", email: "pessoa@example.com", read: false });
  });

  test("[site-feedback.get.site-feedbacks-id#nao-encontrado] id que não existe: 404; id malformado: 400", async ({ request }) => {
    expect((await get(request, admin, `/site-feedbacks/${BAD_ID}`)).status()).toBe(404);
    expect((await get(request, admin, "/site-feedbacks/nao-e-uuid")).status()).toBe(400);
  });

  test("[site-feedback.get.site-feedbacks-id#flag-desligada] com feedback_management desligada, ler por id: 403 FEATURE_DISABLED; religada, volta", async ({ request }) => {
    const sent = await make(request);
    await withFlagsOff(request, admin, ["feedback_management"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/site-feedbacks/${sent.id}`));
    });
    expect((await get(request, admin, `/site-feedbacks/${sent.id}`)).status()).toBe(200);
  });

  // ───────────────────────── PUT ─────────────────────────
  test("[site-feedback.put.site-feedbacks-id#feliz] edita só o que foi enviado (parcial) e mantém o resto", async ({ request }) => {
    const sent = await make(request, { name: next(), rating: 2, comment: "Antes", category: "content" });
    const res = await putRaw(request, admin, sent.id, { comment: "Depois", rating: 4 });
    expect(res.status(), await res.text()).toBe(200);
    expect(await feedbackRow(sent.id)).toMatchObject({ name: sent.name, comment: "Depois", rating: 4, category: "content", read: 0 });
  });

  test("[site-feedback.put.site-feedbacks-id#validacao] nota fora da faixa, comentário em branco, categoria inválida, campo desconhecido: 400 e a avaliação não muda", async ({ request }) => {
    const sent = await make(request);
    const snapshot = await feedbackRow(sent.id);
    for (const body of [{ rating: 9 }, { rating: 2.5 }, { comment: "   " }, { category: "alien" }, { name: "" }, { read: true }, { id: BAD_ID }]) {
      expect((await putRaw(request, admin, sent.id, body)).status(), JSON.stringify(body)).toBe(400);
    }
    expect(await feedbackRow(sent.id)).toEqual(snapshot);
  });

  test("[site-feedback.put.site-feedbacks-id#falha-do-colaborador-sem-efeito-parcial] uma mudança válida junto de outra recusada: nenhuma é aplicada", async ({ request }) => {
    const sent = await make(request);
    const snapshot = await feedbackRow(sent.id);
    const res = await putRaw(request, admin, sent.id, { comment: "Mudança válida", rating: 99 });
    expect(res.status()).toBe(400);
    expect(await feedbackRow(sent.id), "o comentário válido não foi gravado").toEqual(snapshot);
  });

  test("[site-feedback.put.site-feedbacks-id#nao-encontrado] id que não existe: 404; id malformado: 400; nada é criado", async ({ request }) => {
    const before = await allFeedbacks();
    expect((await putRaw(request, admin, BAD_ID, { comment: "x" })).status()).toBe(404);
    expect((await putRaw(request, admin, "nao-e-uuid", { comment: "x" })).status()).toBe(400);
    expect(await allFeedbacks()).toBe(before);
  });

  test("[site-feedback.put.site-feedbacks-id#conflito-ou-duplicidade] repetir a mesma edição é idempotente (mesmo resultado, sem duplicar)", async ({ request }) => {
    const sent = await make(request);
    const before = await allFeedbacks();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      expect((await putRaw(request, admin, sent.id, { comment: "Igual", rating: 1 })).status()).toBe(200);
    }
    expect(await feedbackRow(sent.id)).toMatchObject({ comment: "Igual", rating: 1 });
    expect(await allFeedbacks()).toBe(before);
  });

  test("[site-feedback.put.site-feedbacks-id#email-enviado-ou-bloqueado-por-flag] editar não avisa ninguém: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxByStatus();
    expect((await putRaw(request, admin, sent.id, { comment: "Sem e-mail" })).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
  });

  // ───────────────────────── PATCH :id/read ─────────────────────────
  test("[site-feedback.patch.site-feedbacks-id-read#feliz] marcar como lido troca `read` e baixa o selo em um", async ({ request }) => {
    const sent = await make(request);
    const before = await unreadInDb();
    const res = await readRaw(request, admin, sent.id);
    expect(res.status(), await res.text()).toBe(200);
    expect((await res.json()) as FeedbackBody).toMatchObject({ id: sent.id, read: true });
    expect((await feedbackRow(sent.id))?.read).toBe(1);
    expect(await unreadInDb()).toBe(before - 1);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#conflito-ou-duplicidade] marcar duas vezes: 200 nas duas e o selo baixa só uma vez", async ({ request }) => {
    const sent = await make(request);
    const before = await unreadInDb();
    expect((await readRaw(request, admin, sent.id)).status()).toBe(200);
    expect((await readRaw(request, admin, sent.id)).status()).toBe(200);
    expect(await unreadInDb()).toBe(before - 1);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#nao-encontrado] id que não existe: 404 e nada muda", async ({ request }) => {
    const before = await unreadInDb();
    expect((await readRaw(request, admin, BAD_ID)).status()).toBe(404);
    expect(await unreadInDb()).toBe(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#validacao] id malformado: 400 e nenhuma avaliação é marcada", async ({ request }) => {
    await make(request);
    const before = await unreadInDb();
    expect((await readRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await unreadInDb()).toBe(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#falha-do-colaborador-sem-efeito-parcial] pedido recusado deixa as avaliações como estavam (lidas e não lidas)", async ({ request }) => {
    const unread = await make(request);
    const already = await make(request);
    await readRaw(request, admin, already.id);
    const before = { unread: await feedbackRow(unread.id), already: await feedbackRow(already.id) };
    expect((await readRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect({ unread: await feedbackRow(unread.id), already: await feedbackRow(already.id) }).toEqual(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#email-enviado-ou-bloqueado-por-flag] marcar como lido não avisa ninguém: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxByStatus();
    expect((await readRaw(request, admin, sent.id)).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
  });

  // ───────────────────────── DELETE ─────────────────────────
  test("[site-feedback.delete.site-feedbacks-id#feliz] apagar remove só a avaliação pedida", async ({ request }) => {
    const target = await make(request);
    const other = await make(request);
    const res = await deleteRaw(request, admin, target.id);
    expect(res.status()).toBe(200);
    expect(await feedbackRow(target.id)).toBeNull();
    expect((await feedbackRow(other.id))?.id, "a outra continua").toBe(other.id);
    created.splice(created.indexOf(target.id), 1);
  });

  test("[site-feedback.delete.site-feedbacks-id#nao-encontrado] apagar o que não existe (ou já foi apagado): 404", async ({ request }) => {
    const sent = await make(request);
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(200);
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(404);
    expect((await deleteRaw(request, admin, BAD_ID)).status()).toBe(404);
    created.splice(created.indexOf(sent.id), 1);
  });

  test("[site-feedback.delete.site-feedbacks-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhuma avaliação some", async ({ request }) => {
    await make(request);
    const before = await allFeedbacks();
    expect((await deleteRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await allFeedbacks()).toBe(before);
  });

  test("[site-feedback.delete.site-feedbacks-id#email-enviado-ou-bloqueado-por-flag] apagar não avisa ninguém: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxByStatus();
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
    created.splice(created.indexOf(sent.id), 1);
    expect(await queryOne("SELECT id FROM site_feedbacks WHERE id = ?", [sent.id])).toBeNull();
  });
});
