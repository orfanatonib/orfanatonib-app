import type { APIRequestContext } from "@playwright/test";

import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import {
  BAD_ID,
  ROUTE_PREFIX,
  create,
  createRaw,
  deleteRaw,
  get,
  informativeRow,
  informativesWithTag,
  label,
  patchRaw,
  payload,
  routeOf,
  routesCount,
  routesWithTag,
  snapshotDb,
  type InformativeBody,
  type InformativeInput,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários do plano 28 (`informative`): o admin cria, edita e apaga banners; qualquer usuário autenticado lê. Cada
 * banner tem UMA rota (`routes`, entidade `Informative`) que precisa nascer, mudar e sumir junto com ele. Cada
 * cenário cria os próprios dados pela API e prova o efeito por SELECT. Autorização por perfil está em
 * `informatives-authorization.api.spec.ts`.
 */
test.describe.serial("Banners informativos — cenários de contrato, atomicidade e rota", () => {
  let admin: string;
  let member: Actor;
  const created: string[] = [];
  let counter = 0;
  const next = (): string => label(`in-${(counter += 1)}`);

  const make = async (request: APIRequestContext, overrides: Partial<InformativeInput> = {}): Promise<InformativeBody> => {
    const body = await create(request, admin, { title: next(), ...overrides });
    created.push(body.id);
    return body;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = await createActor(request, admin, "member", "in-member");
  });

  test.afterEach(async ({ request }) => {
    for (const id of created.splice(0)) await deleteRaw(request, admin, id);
  });

  test.afterAll(async ({ request }) => {
    await removeActors(request, admin, [member.id]);
    if (CLEANUP_ENABLED) expect(await informativesWithTag(RUN_TAG), "a limpeza deixou banners do E2E").toBe(0);
    if (CLEANUP_ENABLED) expect(await routesWithTag(RUN_TAG), "a limpeza deixou rotas do E2E").toBe(0);
    await closeDb();
  });

  // ───────────────────────── POST ─────────────────────────
  test("[informative.post.informatives#feliz] cria o banner e a rota dele (mesma entidade, mesma visibilidade, caminho com prefixo)", async ({ request }) => {
    const sent = await make(request, { description: "Texto exato", public: false });
    expect(await informativeRow(sent.id)).toMatchObject({ title: sent.title, description: "Texto exato", public: 0 });
    const route = await routeOf(sent.id);
    expect(route, "a rota nasce com o banner").toBeTruthy();
    expect(route).toMatchObject({ title: sent.title, public: 0, entityId: sent.id, type: "other" });
    expect(route?.path.startsWith(ROUTE_PREFIX)).toBe(true);
    expect((await informativeRow(sent.id))?.routeId).toBe(route?.id);
  });

  test("[informative.post.informatives#validacao] título/descrição ausentes, em branco ou longos demais, `public` que não é boolean ou campo desconhecido: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const base = payload({ title: next() });
    const bad: Array<[string, Record<string, unknown>]> = [
      ["sem título", { ...base, title: undefined }],
      ["título vazio", { ...base, title: "" }],
      ["título em branco", { ...base, title: "   " }],
      ["título acima de 255", { ...base, title: "t".repeat(256) }],
      ["sem descrição", { ...base, description: undefined }],
      ["descrição em branco", { ...base, description: "   " }],
      ["sem public", { ...base, public: undefined }],
      ["public texto", { ...base, public: "talvez" }],
      ["public \"false\"", { ...base, public: "false" }],
      ["public número", { ...base, public: 1 }],
      ["campo desconhecido", { ...base, routeId: BAD_ID }],
    ];
    for (const [title, body] of bad) {
      expect((await createRaw(request, admin, body)).status(), title).toBe(400);
    }
    expect(await snapshotDb()).toEqual(before);
  });

  test("[informative.post.informatives#falha-do-colaborador-sem-efeito-parcial] [informative.post.informatives#rollback-de-transacao] corpo que o banco recusaria (título de 300 caracteres): 400 e nem banner nem rota ficam", async ({ request }) => {
    const before = await snapshotDb();
    const res = await createRaw(request, admin, payload({ title: `${next()}-${"t".repeat(300)}` }));
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[informative.post.informatives#conflito-ou-duplicidade] dois banners com o mesmo título: os dois nascem e cada um ganha um caminho de rota distinto", async ({ request }) => {
    const title = next();
    const first = await make(request, { title });
    const second = await make(request, { title });
    expect(first.id).not.toBe(second.id);
    const [a, b] = [await routeOf(first.id), await routeOf(second.id)];
    expect(a?.path).toBeTruthy();
    expect(b?.path).toBeTruthy();
    expect(a?.path, "o caminho é único").not.toBe(b?.path);
  });

  // ───────────────────────── GET ─────────────────────────
  test("[informative.get.informatives#feliz] a lista traz o banner pelo título/descrição (busca) e mais recente primeiro", async ({ request }) => {
    const first = await make(request, { description: "alfa" });
    const second = await make(request, { description: "beta" });
    const all = (await (await get(request, member.token, "/informatives")).json()) as InformativeBody[];
    const ids = all.map((item) => item.id);
    expect(ids.indexOf(second.id), "o mais recente vem antes").toBeLessThan(ids.indexOf(first.id));
    const byTitle = (await (await get(request, member.token, `/informatives?search=${encodeURIComponent(first.title)}`)).json()) as InformativeBody[];
    expect(byTitle.map((item) => item.id)).toEqual([first.id]);
    const byDescription = (await (await get(request, member.token, `/informatives?search=${encodeURIComponent(RUN_TAG)}`)).json()) as InformativeBody[];
    expect(byDescription.length, "busca por trecho do título").toBeGreaterThanOrEqual(2);
  });

  test("[informative.get.informatives#escopo-proprio-x-outro] visitante não lê (401); membro lê tanto o público quanto o não público", async ({ request }) => {
    const open = await make(request, { public: true });
    const closed = await make(request, { public: false });
    expect((await get(request, undefined, "/informatives")).status()).toBe(401);
    const list = (await (await get(request, member.token, "/informatives")).json()) as InformativeBody[];
    expect(list.map((item) => item.id)).toEqual(expect.arrayContaining([open.id, closed.id]));
    expect(list.find((item) => item.id === closed.id)?.public).toBe(false);
  });

  test("[informative.get.informatives-id#feliz] ler por id traz exatamente o que foi enviado", async ({ request }) => {
    const sent = await make(request, { description: "Texto exato", public: false });
    const res = await get(request, member.token, `/informatives/${sent.id}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: sent.id, title: sent.title, description: "Texto exato", public: false });
  });

  test("[informative.get.informatives-id#escopo-proprio-x-outro] visitante recebe 401 no detalhe e o banner não público continua legível para o membro autenticado", async ({ request }) => {
    const closed = await make(request, { public: false });
    expect((await get(request, undefined, `/informatives/${closed.id}`)).status()).toBe(401);
    expect((await get(request, member.token, `/informatives/${closed.id}`)).status()).toBe(200);
  });

  test("[informative.get.informatives-id#nao-encontrado] id que não existe: 404; id malformado: 400", async ({ request }) => {
    expect((await get(request, member.token, `/informatives/${BAD_ID}`)).status()).toBe(404);
    expect((await get(request, member.token, "/informatives/nao-e-uuid")).status()).toBe(400);
  });

  test("[informative.get.informatives-id#flag-desligada] com informative_banners desligada, ler por id: 403 FEATURE_DISABLED; religada, volta", async ({ request }) => {
    const sent = await make(request);
    await withFlagsOff(request, admin, ["informative_banners"], async () => {
      await expectFeatureDisabled(await get(request, member.token, `/informatives/${sent.id}`));
    });
    expect((await get(request, member.token, `/informatives/${sent.id}`)).status()).toBe(200);
  });

  // ───────────────────────── PATCH ─────────────────────────
  test("[informative.patch.informatives-id#feliz] muda título, descrição e visibilidade: a rota acompanha (título, visibilidade, tipo e prefixo preservados)", async ({ request }) => {
    const sent = await make(request, { public: true });
    const routeBefore = await routeOf(sent.id);
    const title = next();
    const res = await patchRaw(request, admin, sent.id, { title, description: "Depois", public: false });
    expect(res.status(), await res.text()).toBe(200);
    expect(await informativeRow(sent.id)).toMatchObject({ title, description: "Depois", public: 0 });
    const route = await routeOf(sent.id);
    expect(route?.id, "é a mesma rota").toBe(routeBefore?.id);
    expect(route).toMatchObject({ title, public: 0, type: "other" });
    expect(route?.path.startsWith(ROUTE_PREFIX)).toBe(true);
    expect(await routesCount(sent.id)).toBe(1);
  });

  test("[informative.patch.informatives-id#feliz] mudança parcial (só `public`) não toca título, descrição, caminho nem tipo da rota", async ({ request }) => {
    const sent = await make(request, { description: "Fica igual", public: true });
    const routeBefore = await routeOf(sent.id);
    expect((await patchRaw(request, admin, sent.id, { public: false })).status()).toBe(200);
    expect(await informativeRow(sent.id)).toMatchObject({ title: sent.title, description: "Fica igual", public: 0 });
    const route = await routeOf(sent.id);
    expect(route).toMatchObject({ title: sent.title, path: routeBefore?.path, type: routeBefore?.type, public: 0 });
  });

  test("[informative.patch.informatives-id#validacao] campos em branco, longos, `public` que não é boolean ou campo desconhecido: 400 e banner e rota não mudam", async ({ request }) => {
    const sent = await make(request);
    const snapshot = { row: await informativeRow(sent.id), route: await routeOf(sent.id) };
    for (const body of [{ title: "" }, { title: "   " }, { title: "t".repeat(256) }, { description: "  " }, { public: "talvez" }, { public: "false" }, { public: 1 }, { routeId: BAD_ID }]) {
      expect((await patchRaw(request, admin, sent.id, body)).status(), JSON.stringify(body)).toBe(400);
    }
    expect({ row: await informativeRow(sent.id), route: await routeOf(sent.id) }).toEqual(snapshot);
  });

  test("[informative.patch.informatives-id#falha-do-colaborador-sem-efeito-parcial] [informative.patch.informatives-id#rollback-de-transacao] uma mudança válida junto de outra recusada: nenhuma é aplicada (banner e rota)", async ({ request }) => {
    const sent = await make(request);
    const snapshot = { row: await informativeRow(sent.id), route: await routeOf(sent.id) };
    const res = await patchRaw(request, admin, sent.id, { description: "Mudança válida", title: "t".repeat(300) });
    expect(res.status()).toBe(400);
    expect({ row: await informativeRow(sent.id), route: await routeOf(sent.id) }).toEqual(snapshot);
  });

  test("[informative.patch.informatives-id#nao-encontrado] id que não existe: 404; id malformado: 400; nada é criado", async ({ request }) => {
    const before = await snapshotDb();
    expect((await patchRaw(request, admin, BAD_ID, { title: "x" })).status()).toBe(404);
    expect((await patchRaw(request, admin, "nao-e-uuid", { title: "x" })).status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[informative.patch.informatives-id#conflito-ou-duplicidade] renomear para o título de outro banner: os dois seguem com caminhos de rota distintos; repetir o mesmo PATCH é idempotente", async ({ request }) => {
    const other = await make(request);
    const sent = await make(request);
    expect((await patchRaw(request, admin, sent.id, { title: other.title })).status()).toBe(200);
    const [a, b] = [await routeOf(sent.id), await routeOf(other.id)];
    expect(a?.path, "o caminho continua único").not.toBe(b?.path);
    const again = await routeOf(sent.id);
    expect((await patchRaw(request, admin, sent.id, { title: other.title })).status()).toBe(200);
    expect((await routeOf(sent.id))?.path, "repetir não muda o caminho").toBe(again?.path);
    expect(await routesCount(sent.id)).toBe(1);
  });

  // ───────────────────────── DELETE ─────────────────────────
  test("[informative.delete.informatives-id#feliz] apagar remove o banner e a rota dele, e só eles", async ({ request }) => {
    const target = await make(request);
    const other = await make(request);
    expect((await deleteRaw(request, admin, target.id)).status()).toBe(200);
    expect(await informativeRow(target.id)).toBeNull();
    expect(await routesCount(target.id), "a rota sai junto").toBe(0);
    expect((await informativeRow(other.id))?.id, "o outro continua").toBe(other.id);
    expect(await routesCount(other.id)).toBe(1);
    created.splice(created.indexOf(target.id), 1);
  });

  test("[informative.delete.informatives-id#nao-encontrado] apagar o que não existe (ou já foi apagado): 404", async ({ request }) => {
    const sent = await make(request);
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(200);
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(404);
    expect((await deleteRaw(request, admin, BAD_ID)).status()).toBe(404);
    created.splice(created.indexOf(sent.id), 1);
  });

  test("[informative.delete.informatives-id#falha-do-colaborador-sem-efeito-parcial] [informative.delete.informatives-id#rollback-de-transacao] id malformado: 400 e nenhum banner ou rota some", async ({ request }) => {
    await make(request);
    const before = await snapshotDb();
    expect((await deleteRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });
});
