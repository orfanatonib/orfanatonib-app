import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, snapshotBucket } from "../support/s3";
import {
  BAD_ID,
  OVERSIZED_FILE_NAME,
  create,
  createRaw,
  eventNoticeStates,
  eventRow,
  eventsWithTag,
  get,
  label,
  mediaCount,
  patchRaw,
  png,
  removeApi,
  snapshotDb,
  type Audience,
  type EventBody,
} from "./support";

/**
 * Cenários de `/events` por handler (plano 20 §7.3): feliz, validação, conflito, não encontrado, escopo (a audiência
 * decide quem vê), flag, falha sem efeito parcial, e-mail bloqueado por flag e S3 sem órfão. Cada cenário cria os próprios
 * dados pela API (prefixo RUN_TAG), prova o efeito por SELECT e o `afterAll` confere 0 sobras e o bucket consistente.
 */
test.describe.serial("Eventos — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const created: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const make = async (request: APIRequestContext, name: string, extra: { audience?: Audience; file?: boolean; date?: string } = {}): Promise<EventBody> => {
    const event = await create(request, admin, { title: label(name), audience: extra.audience, date: extra.date, file: extra.file ? png(`${name}.png`) : undefined });
    created.push(event.id);
    return event;
  };

  const idsOf = <T extends { id: string }>(items: T[]): string[] => items.map((item) => item.id);

  /** Espera o aviso assíncrono terminar de entrar no outbox (o estado final é o que se prova). */
  const settle = async (): Promise<Record<string, number>> => {
    let previous = JSON.stringify(await eventNoticeStates());
    for (let i = 0; i < 8; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const current = JSON.stringify(await eventNoticeStates());
      if (current === previous) break;
      previous = current;
    }
    return eventNoticeStates();
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await removeApi(request, admin, id);
    expect(await eventsWithTag(RUN_TAG), "a limpeza deixou eventos do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /events

  test("[event.post.events#feliz] [event.post.events#s3-sem-orfao] admin cria com imagem: evento e mídia batem com o banco e o objeto está no bucket", async ({ request }) => {
    const event = await make(request, "post-feliz", { file: true });
    expect(await eventRow(event.id)).toMatchObject({ title: label("post-feliz"), audience: "all" });
    expect(await mediaCount(event.id)).toBe(1);
    // A resposta do POST não traz a mídia; a leitura por id traz.
    expect(((await json<EventBody>(await get(request, admin, `/events/${event.id}`))).media?.url)).toBeTruthy();
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[event.post.events#validacao] sem título, sem data, data que não é data, audiência inválida e campo extra: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const base = { title: label("validacao"), date: "2099-12-01", location: "L", description: "d", audience: "all" };
    for (const data of [
      { ...base, title: "" },
      { ...base, date: "" },
      { ...base, date: "ontem" },
      { ...base, audience: "todos" },
      { ...base, campoExtra: "x" },
    ]) {
      const res = await request.post(`${API_URL}/events`, { headers: authHeaders(admin), multipart: { eventData: JSON.stringify(data) } });
      expect(res.status(), JSON.stringify(data).slice(0, 70)).toBe(400);
    }
    expect((await request.post(`${API_URL}/events`, { headers: authHeaders(admin), multipart: { eventData: "{ json quebrado" } })).status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[event.post.events#conflito-ou-duplicidade] mesmo título e data duas vezes: dois eventos (não há unicidade)", async ({ request }) => {
    const first = await make(request, "post-duplicado");
    const second = await make(request, "post-duplicado");
    expect(second.id).not.toBe(first.id);
    expect(await eventsWithTag(label("post-duplicado"))).toBe(2);
  });

  test("[event.post.events#falha-do-colaborador-sem-efeito-parcial] imagem cujo registro o banco recusa, DEPOIS do upload: nenhum evento, mídia nem objeto", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await createRaw(request, admin, { title: label("post-colaborador"), file: png(OVERSIZED_FILE_NAME) });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await eventsWithTag(label("post-colaborador"))).toBe(0);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  test("[event.post.events#email-enviado-ou-bloqueado-por-flag] criar evento com e-mail desligado no E2E: o aviso entra no outbox só como `skipped` (nada pendente nem enviado)", async ({ request }) => {
    const before = await settle();
    await make(request, "post-email", { audience: "all" });
    const after = await settle();
    expect((after.skipped ?? 0) - (before.skipped ?? 0)).toBeGreaterThan(0);
    expect(after.pending ?? 0).toBe(before.pending ?? 0);
    expect(after.sent ?? 0).toBe(before.sent ?? 0);
  });

  // ---------------------------------------------------------------- GET

  test("[event.get.events#feliz] [event.get.events-id#feliz] listagem (com busca) e leitura por id batem com o banco", async ({ request }) => {
    const event = await make(request, "get-feliz", { file: true });
    const list = await get(request, admin, `/events?search=${encodeURIComponent(label("get-feliz"))}`);
    expect(list.status()).toBe(200);
    expect(idsOf(await json<EventBody[]>(list))).toContain(event.id);

    const one = await get(request, admin, `/events/${event.id}`);
    expect(one.status()).toBe(200);
    const body = await json<EventBody>(one);
    expect(body.title).toBe((await eventRow(event.id))?.title);
    expect(body.media?.url).toBeTruthy();
  });

  test("[event.get.events#escopo-proprio-x-outro] [event.get.events-id#escopo-proprio-x-outro] a audiência decide quem vê: visitante só `all`, membro `all`+`members`, líder e admin tudo; fora da audiência é 404", async ({ request }) => {
    const all = await make(request, "escopo-all", { audience: "all" });
    const members = await make(request, "escopo-membros", { audience: "members" });
    const leaders = await make(request, "escopo-lideres", { audience: "leaders" });
    const expectations: Array<[string, string | undefined, string[]]> = [
      ["visitante", undefined, [all.id]],
      ["membro", member, [all.id, members.id]],
      ["líder", leader, [all.id, members.id, leaders.id]],
      ["admin", admin, [all.id, members.id, leaders.id]],
    ];
    for (const [who, token, visible] of expectations) {
      const list = idsOf(await json<EventBody[]>(await get(request, token, `/events?search=${encodeURIComponent(label("escopo-"))}`)));
      for (const event of [all, members, leaders]) {
        expect(list.includes(event.id), `${who} × ${event.title}`).toBe(visible.includes(event.id));
        const one = await get(request, token, `/events/${event.id}`);
        expect(one.status(), `${who} × ${event.title}`).toBe(visible.includes(event.id) ? 200 : 404);
      }
    }
  });

  test("[event.get.events-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/events/${BAD_ID}`)).status()).toBe(404);
  });

  test("[event.get.events-id#flag-desligada] [event.get.events-upcoming#flag-desligada] com events_section desligada: 403 FEATURE_DISABLED", async ({ request }) => {
    const event = await make(request, "get-flag");
    await withFlagsOff(request, admin, ["events_section"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/events/${event.id}`));
      await expectFeatureDisabled(await get(request, admin, "/events/upcoming"));
    });
    expect((await get(request, admin, `/events/${event.id}`)).status()).toBe(200);
  });

  test("[event.get.events-upcoming#feliz] [event.get.events-upcoming#escopo-proprio-x-outro] os próximos eventos trazem o futuro e deixam o passado, respeitando a audiência", async ({ request }) => {
    const future = await make(request, "upcoming-futuro", { audience: "members", date: "2099-06-01" });
    const past = await make(request, "upcoming-passado", { audience: "members", date: "2001-06-01" });
    const asMember = idsOf(await json<EventBody[]>(await get(request, member, "/events/upcoming")));
    expect(asMember).toContain(future.id);
    expect(asMember).not.toContain(past.id);
    const asVisitor = idsOf(await json<EventBody[]>(await get(request, undefined, "/events/upcoming")));
    expect(asVisitor).not.toContain(future.id);
  });

  // ---------------------------------------------------------------- PATCH /events/:id

  test("[event.patch.events-id#feliz] admin altera título, local e imagem: o banco reflete e a mídia continua uma só", async ({ request }) => {
    const event = await make(request, "patch-feliz", { file: true });
    const res = await patchRaw(request, admin, event.id, { title: label("patch-feliz-novo"), location: "Novo local", audience: "members" }, png("nova.png"));
    expect(res.status(), await res.text()).toBe(200);
    expect(await eventRow(event.id)).toMatchObject({ title: label("patch-feliz-novo"), location: "Novo local", audience: "members" });
    expect(await mediaCount(event.id)).toBe(1);
  });

  test("[event.patch.events-id#validacao] audiência inválida, data que não é data, campo extra e JSON quebrado: 400 e o evento fica como estava", async ({ request }) => {
    const event = await make(request, "patch-validacao");
    const before = await eventRow(event.id);
    for (const data of [{ audience: "todos" }, { date: "ontem" }, { campoExtra: "x" }]) {
      expect((await patchRaw(request, admin, event.id, data)).status(), JSON.stringify(data)).toBe(400);
    }
    const broken = await request.patch(`${API_URL}/events/${event.id}`, { headers: authHeaders(admin), multipart: { eventData: "{ json quebrado" } });
    expect(broken.status()).toBe(400);
    expect(await eventRow(event.id)).toEqual(before);
  });

  test("[event.patch.events-id#nao-encontrado] uuid inexistente: 404 e nada criado", async ({ request }) => {
    const before = await snapshotDb();
    expect((await patchRaw(request, admin, BAD_ID, { title: label("patch-fantasma") })).status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[event.patch.events-id#conflito-ou-duplicidade] renomear para o título de outro evento é aceito (sem unicidade): os dois existem", async ({ request }) => {
    const first = await make(request, "patch-conflito-a");
    const second = await make(request, "patch-conflito-b");
    const res = await patchRaw(request, admin, second.id, { title: label("patch-conflito-a") });
    expect(res.status(), await res.text()).toBe(200);
    expect((await eventRow(first.id))?.title).toBe(label("patch-conflito-a"));
    expect((await eventRow(second.id))?.title).toBe(label("patch-conflito-a"));
  });

  test("[event.patch.events-id#falha-do-colaborador-sem-efeito-parcial] [event.patch.events-id#s3-sem-orfao] imagem que o banco recusa junto de outras mudanças: o evento NÃO muda (título, local, audiência), a mídia e o bucket ficam intactos", async ({
    request,
  }) => {
    const event = await make(request, "patch-colaborador", { file: true });
    const before = await eventRow(event.id);
    const bucket = await snapshotBucket();
    const res = await patchRaw(request, admin, event.id, { title: label("patch-nao-grava"), location: "Não grava", audience: "leaders" }, png(OVERSIZED_FILE_NAME));
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await eventRow(event.id)).toEqual(before);
    expect(await mediaCount(event.id)).toBe(1);
    await expectBucketUnchanged(bucket);
  });

  test("[event.patch.events-id#feliz] remover a imagem (o formulário manda `media.url = null`): a linha e o objeto saem e o evento continua", async ({ request }) => {
    const event = await make(request, "patch-remove-imagem", { file: true });
    expect(await mediaCount(event.id)).toBe(1);
    const res = await patchRaw(request, admin, event.id, { title: label("patch-remove-imagem"), media: { title: "x", url: null, isLocalFile: false } });
    expect(res.status(), await res.text()).toBe(200);
    expect(await mediaCount(event.id)).toBe(0);
    expect(await eventRow(event.id)).not.toBeNull();
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[event.patch.events-id#email-enviado-ou-bloqueado-por-flag] alterar evento com e-mail desligado no E2E: o aviso entra no outbox só como `skipped`", async ({ request }) => {
    const event = await make(request, "patch-email", { audience: "all" });
    const before = await settle();
    const res = await patchRaw(request, admin, event.id, { title: label("patch-email-novo"), location: "Outro local" });
    expect(res.status()).toBe(200);
    const after = await settle();
    expect((after.skipped ?? 0) - (before.skipped ?? 0)).toBeGreaterThan(0);
    expect(after.pending ?? 0).toBe(before.pending ?? 0);
    expect(after.sent ?? 0).toBe(before.sent ?? 0);
  });

  // ---------------------------------------------------------------- DELETE

  test("[event.delete.events-id#feliz] [event.delete.events-id#s3-sem-orfao] admin remove: evento, mídia e o objeto somem", async ({ request }) => {
    const event = await make(request, "delete-feliz", { file: true });
    const res = await request.delete(`${API_URL}/events/${event.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(204);
    expect(await eventRow(event.id)).toBeNull();
    expect(await mediaCount(event.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[event.delete.events-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/events/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[event.delete.events-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 4xx e nenhum evento, mídia nem objeto some", async ({ request }) => {
    const event = await make(request, "delete-colaborador", { file: true });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await request.delete(`${API_URL}/events/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    expect(await eventRow(event.id)).not.toBeNull();
  });

  test("[event.delete.events-id#email-enviado-ou-bloqueado-por-flag] remover evento com e-mail desligado no E2E: o aviso entra no outbox só como `skipped`", async ({ request }) => {
    const event = await make(request, "delete-email", { audience: "all" });
    const before = await settle();
    expect((await request.delete(`${API_URL}/events/${event.id}`, { headers: authHeaders(admin) })).status()).toBe(204);
    const after = await settle();
    expect((after.skipped ?? 0) - (before.skipped ?? 0)).toBeGreaterThan(0);
    expect(after.pending ?? 0).toBe(before.pending ?? 0);
    expect(after.sent ?? 0).toBe(before.sent ?? 0);
  });
});
