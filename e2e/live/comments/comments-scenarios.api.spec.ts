import type { APIRequestContext } from "@playwright/test";

import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import {
  BAD_ID,
  allComments,
  commentRow,
  commentsWithTag,
  create,
  createRaw,
  deleteRaw,
  get,
  label,
  outboxByStatus,
  payload,
  pendingInDb,
  putRaw,
  type CommentBody,
  type CommentInput,
} from "./support";

/**
 * Cenários do plano 37 (`comment`): qualquer usuário autenticado ENVIA um comentário (nasce NÃO publicado); só o admin
 * modera (lista, lê, edita, publica, apaga); a vitrine `/comments/published` é pública e só mostra o publicado. Cada
 * cenário cria os próprios dados pela API e prova o efeito por SELECT. O aviso aos admins (`comment-received`) fica
 * `skipped` no outbox porque a rodada de E2E desliga as flags de e-mail. Autorização por perfil está em
 * `comments-authorization.api.spec.ts`.
 */
test.describe.serial("Comentários — cenários de contrato e moderação", () => {
  let admin: string;
  let member: Actor;
  let leader: Actor;
  const created: string[] = [];
  let counter = 0;
  const next = (): string => label(`cm-${(counter += 1)}`);

  const outboxTotal = async (): Promise<number> => Object.values(await outboxByStatus()).reduce((sum, n) => sum + n, 0);

  const make = async (request: APIRequestContext, overrides: Partial<CommentInput> = {}): Promise<CommentBody> => {
    const before = await outboxTotal();
    const body = await create(request, member.token, { name: next(), ...overrides });
    created.push(body.id);
    // O aviso aos admins sai em segundo plano (`void notifyAdmins`): espera ele assentar para não contaminar a medição.
    await expect.poll(outboxTotal, { message: "aviso aos admins registrado no outbox" }).toBeGreaterThan(before);
    return body;
  };

  const publish = (request: APIRequestContext, body: CommentBody, published: boolean, extra: Record<string, unknown> = {}) =>
    putRaw(request, admin, body.id, { ...payload({ name: body.name }), published, ...extra });

  const publishedIds = async (request: APIRequestContext): Promise<string[]> =>
    ((await (await get(request, undefined, "/comments/published")).json()) as CommentBody[]).map((item) => item.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = await createActor(request, admin, "member", "cm-member");
    leader = await createActor(request, admin, "leader", "cm-leader");
  });

  test.afterEach(async ({ request }) => {
    for (const id of created.splice(0)) await deleteRaw(request, admin, id);
  });

  test.afterAll(async ({ request }) => {
    await removeActors(request, admin, [member.id, leader.id]);
    expect(await commentsWithTag(RUN_TAG), "a limpeza deixou comentários do E2E").toBe(0);
    await closeDb();
  });

  // ───────────────────────── POST ─────────────────────────
  test("[comment.post.comments#feliz] enviar cria o comentário NÃO publicado e ele ainda não aparece na vitrine", async ({ request }) => {
    const sent = await make(request, { comment: "Texto exato", shelter: "Clubinho Sol", neighborhood: "Aleixo" });
    expect(sent.published).toBe(false);
    expect(await commentRow(sent.id)).toMatchObject({ comment: "Texto exato", shelter: "Clubinho Sol", neighborhood: "Aleixo", published: 0 });
    expect(await publishedIds(request)).not.toContain(sent.id);
  });

  test("[comment.post.comments#validacao] campos ausentes, em branco, longos demais ou desconhecidos (inclusive `published`): 400 e nada gravado", async ({ request }) => {
    const before = await allComments();
    const base = payload({ name: next() });
    const bad: Array<[string, Record<string, unknown>]> = [
      ["sem nome", { ...base, name: undefined }],
      ["nome em branco", { ...base, name: "   " }],
      ["nome acima de 100", { ...base, name: "n".repeat(101) }],
      ["sem comentário", { ...base, comment: undefined }],
      ["comentário em branco", { ...base, comment: "   " }],
      ["comentário acima de 2000", { ...base, comment: "c".repeat(2001) }],
      ["clubinho em branco", { ...base, shelter: "  " }],
      ["clubinho acima de 100", { ...base, shelter: "s".repeat(101) }],
      ["bairro em branco", { ...base, neighborhood: "  " }],
      ["bairro acima de 100", { ...base, neighborhood: "b".repeat(101) }],
      ["tentar já nascer publicado", { ...base, published: true }],
    ];
    for (const [title, body] of bad) {
      expect((await createRaw(request, member.token, body)).status(), title).toBe(400);
    }
    expect(await allComments()).toBe(before);
  });

  test("[comment.post.comments#falha-do-colaborador-sem-efeito-parcial] corpo recusado não grava comentário nem aviso por e-mail", async ({ request }) => {
    const before = { rows: await allComments(), outbox: await outboxByStatus() };
    const res = await createRaw(request, member.token, payload({ name: next(), comment: "c".repeat(2001) }));
    expect(res.status()).toBe(400);
    expect({ rows: await allComments(), outbox: await outboxByStatus() }).toEqual(before);
  });

  test("[comment.post.comments#escopo-proprio-x-outro] membro e líder enviam; nenhum dos dois lê a moderação nem a edita", async ({ request }) => {
    const fromMember = await make(request);
    const fromLeader = await create(request, leader.token, { name: next() });
    created.push(fromLeader.id);
    for (const token of [member.token, leader.token]) {
      expect((await get(request, token, "/comments")).status(), "caixa de moderação").toBe(403);
      expect((await get(request, token, `/comments/${fromMember.id}`)).status(), "detalhe").toBe(403);
      expect((await putRaw(request, token, fromMember.id, payload({ name: "x" }))).status(), "edição").toBe(403);
    }
    const list = (await (await get(request, admin, "/comments")).json()) as CommentBody[];
    expect(list.map((item) => item.id)).toEqual(expect.arrayContaining([fromMember.id, fromLeader.id]));
  });

  test("[comment.post.comments#conflito-ou-duplicidade] o mesmo texto enviado duas vezes vira dois comentários independentes (não há unicidade)", async ({ request }) => {
    const name = next();
    const first = await create(request, member.token, { name });
    const second = await create(request, member.token, { name });
    created.push(first.id, second.id);
    expect(first.id).not.toBe(second.id);
    expect(await commentsWithTag(name)).toBe(2);
  });

  test("[comment.post.comments#email-enviado-ou-bloqueado-por-flag] enviar registra o aviso aos admins no outbox, e com o e-mail desligado no E2E ele fica só `skipped`", async ({ request }) => {
    const before = await outboxByStatus();
    await make(request);
    const after = await outboxByStatus();
    expect((after.skipped ?? 0) - (before.skipped ?? 0), "um aviso `skipped` por admin").toBeGreaterThan(0);
    expect(after.pending ?? 0, "nada fica pendente (SMTP não é acionado)").toBe(before.pending ?? 0);
    expect(after.sent ?? 0).toBe(before.sent ?? 0);
  });

  test("[comment.post.comments] sessão obrigatória: visitante recebe 401 e nada é gravado", async ({ request }) => {
    const before = await allComments();
    expect((await createRaw(request, undefined, payload({ name: next() }))).status()).toBe(401);
    expect(await allComments()).toBe(before);
  });

  // ───────────────────────── GET ─────────────────────────
  test("[comment.get.comments#feliz] a caixa lista o que entrou, mais recente primeiro, e o selo conta os pendentes", async ({ request }) => {
    const pendingBefore = ((await (await get(request, admin, "/comments/pending-count")).json()) as { pending: number }).pending;
    const first = await make(request);
    const second = await make(request);
    const list = (await (await get(request, admin, "/comments")).json()) as CommentBody[];
    const ids = list.map((item) => item.id);
    expect(ids.indexOf(second.id), "o mais recente vem antes").toBeLessThan(ids.indexOf(first.id));
    const pending = ((await (await get(request, admin, "/comments/pending-count")).json()) as { pending: number }).pending;
    expect(pending).toBe(pendingBefore + 2);
    expect(pending).toBe(await pendingInDb());
  });

  test("[comment.get.comments-id#feliz] ler por id traz exatamente o que foi enviado", async ({ request }) => {
    const sent = await make(request, { comment: "Texto exato", neighborhood: "Cidade Nova" });
    const res = await get(request, admin, `/comments/${sent.id}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: sent.id, comment: "Texto exato", neighborhood: "Cidade Nova", published: false });
  });

  test("[comment.get.comments-id#nao-encontrado] id que não existe: 404; id malformado: 400", async ({ request }) => {
    expect((await get(request, admin, `/comments/${BAD_ID}`)).status()).toBe(404);
    expect((await get(request, admin, "/comments/nao-e-uuid")).status()).toBe(400);
  });

  test("[comment.get.comments-id#flag-desligada] com comment_moderation desligada, ler por id: 403 FEATURE_DISABLED; religada, volta", async ({ request }) => {
    const sent = await make(request);
    await withFlagsOff(request, admin, ["comment_moderation"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/comments/${sent.id}`));
    });
    expect((await get(request, admin, `/comments/${sent.id}`)).status()).toBe(200);
  });

  test("[comment.get.comments-published#feliz] a vitrine pública mostra só o publicado, sem sessão, e some quando despublica", async ({ request }) => {
    const sent = await make(request, { comment: "Para a vitrine" });
    expect((await publish(request, sent, true, { comment: "Para a vitrine" })).status()).toBe(200);
    const res = await get(request, undefined, "/comments/published");
    expect(res.status()).toBe(200);
    const shown = ((await res.json()) as CommentBody[]).find((item) => item.id === sent.id);
    expect(shown).toMatchObject({ comment: "Para a vitrine", published: true });
    expect((await publish(request, sent, false)).status()).toBe(200);
    expect(await publishedIds(request)).not.toContain(sent.id);
  });

  test("[comment.get.comments-published#escopo-proprio-x-outro] o não publicado de outra pessoa nunca aparece na vitrine; todo item dela é publicado", async ({ request }) => {
    const hidden = await make(request);
    const shown = await make(request);
    expect((await publish(request, shown, true)).status()).toBe(200);
    const list = (await (await get(request, undefined, "/comments/published")).json()) as CommentBody[];
    expect(list.map((item) => item.id)).toContain(shown.id);
    expect(list.map((item) => item.id)).not.toContain(hidden.id);
    expect(list.every((item) => item.published === true)).toBe(true);
  });

  // ───────────────────────── PUT ─────────────────────────
  test("[comment.put.comments-id#feliz] edita o texto e publica numa só chamada; o selo de pendentes baixa", async ({ request }) => {
    const sent = await make(request);
    const before = await pendingInDb();
    const res = await putRaw(request, admin, sent.id, { ...payload({ name: sent.name }), comment: "Revisado", published: true });
    expect(res.status(), await res.text()).toBe(200);
    expect(await commentRow(sent.id)).toMatchObject({ comment: "Revisado", published: 1 });
    expect(await pendingInDb()).toBe(before - 1);
  });

  test("[comment.put.comments-id#validacao] campos em branco, longos, de tipo errado, `published` que não é boolean ou campo desconhecido: 400 e o comentário não muda", async ({ request }) => {
    const sent = await make(request);
    const snapshot = await commentRow(sent.id);
    const base = payload({ name: sent.name });
    const bad: Array<[string, Record<string, unknown>]> = [
      ["comentário em branco", { ...base, comment: "   " }],
      ["nome em branco", { ...base, name: "" }],
      ["clubinho acima de 100", { ...base, shelter: "s".repeat(101) }],
      ["published texto", { ...base, published: "talvez" }],
      ["published \"false\"", { ...base, published: "false" }],
      ["published número", { ...base, published: 1 }],
      ["campo desconhecido", { ...base, id: BAD_ID }],
      ["corpo vazio", {}],
    ];
    for (const [title, body] of bad) {
      expect((await putRaw(request, admin, sent.id, body)).status(), title).toBe(400);
    }
    expect(await commentRow(sent.id)).toEqual(snapshot);
  });

  test("[comment.put.comments-id#falha-do-colaborador-sem-efeito-parcial] uma mudança válida junto de outra recusada: nenhuma é aplicada, nem a publicação", async ({ request }) => {
    const sent = await make(request);
    const snapshot = await commentRow(sent.id);
    const res = await putRaw(request, admin, sent.id, { ...payload({ name: sent.name }), comment: "Mudança válida", published: true, neighborhood: "b".repeat(101) });
    expect(res.status()).toBe(400);
    expect(await commentRow(sent.id), "nada foi gravado").toEqual(snapshot);
    expect(await publishedIds(request)).not.toContain(sent.id);
  });

  test("[comment.put.comments-id#nao-encontrado] id que não existe: 404; id malformado: 400; nada é criado", async ({ request }) => {
    const before = await allComments();
    expect((await putRaw(request, admin, BAD_ID, payload({ name: "x" }))).status()).toBe(404);
    expect((await putRaw(request, admin, "nao-e-uuid", payload({ name: "x" }))).status()).toBe(400);
    expect(await allComments()).toBe(before);
  });

  test("[comment.put.comments-id#conflito-ou-duplicidade] publicar duas vezes é idempotente (continua publicado, uma vez só na vitrine)", async ({ request }) => {
    const sent = await make(request);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      expect((await publish(request, sent, true)).status()).toBe(200);
    }
    expect((await commentRow(sent.id))?.published).toBe(1);
    expect((await publishedIds(request)).filter((id) => id === sent.id)).toHaveLength(1);
  });

  test("[comment.put.comments-id#email-enviado-ou-bloqueado-por-flag] editar ou publicar não avisa ninguém: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxByStatus();
    expect((await publish(request, sent, true, { comment: "Sem e-mail" })).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
  });

  // ───────────────────────── DELETE ─────────────────────────
  test("[comment.delete.comments-id#feliz] apagar remove só o comentário pedido e ele sai da vitrine", async ({ request }) => {
    const target = await make(request);
    const other = await make(request);
    expect((await publish(request, target, true)).status()).toBe(200);
    expect((await deleteRaw(request, admin, target.id)).status()).toBe(200);
    expect(await commentRow(target.id)).toBeNull();
    expect((await commentRow(other.id))?.id, "o outro continua").toBe(other.id);
    expect(await publishedIds(request)).not.toContain(target.id);
    created.splice(created.indexOf(target.id), 1);
  });

  test("[comment.delete.comments-id#nao-encontrado] apagar o que não existe (ou já foi apagado): 404", async ({ request }) => {
    const sent = await make(request);
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(200);
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(404);
    expect((await deleteRaw(request, admin, BAD_ID)).status()).toBe(404);
    created.splice(created.indexOf(sent.id), 1);
  });

  test("[comment.delete.comments-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhum comentário some", async ({ request }) => {
    await make(request);
    const before = await allComments();
    expect((await deleteRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await allComments()).toBe(before);
  });

  test("[comment.delete.comments-id#email-enviado-ou-bloqueado-por-flag] apagar não avisa ninguém: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxByStatus();
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(200);
    expect(await outboxByStatus()).toEqual(before);
    created.splice(created.indexOf(sent.id), 1);
  });
});
