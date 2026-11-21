import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Matriz de cenários do plano 08 (feature flags), 100% full-stack: HTTP real
 * contra a API e prova por SELECT em `feature_flags` — nenhum mock.
 *
 * Regras desta suíte:
 * - toda escrita é feita numa flag PRÓPRIA do cenário (`e2e-matrix-*`), criada
 *   aqui e apagada no fim; as flags do catálogo só são lidas (ou, quando o
 *   cenário precisa delas, têm o estado restaurado no afterAll);
 * - negativos (anônimo/líder/membro, validação, não encontrado) provam que o
 *   banco ficou IDÊNTICO (foto da tabela inteira antes e depois);
 * - as flags `email_*` não são tocadas.
 */
const RUN = `e2e-matrix-${Date.now()}`;
const OWN = `${RUN}-a`;
const OTHER = `${RUN}-b`;
const MISSING = `${RUN}-nao-existe`;
const PROTECTED_KEY = "shelter_management"; // flag de fábrica (admin + líder)
const ADMIN_ONLY_KEY = "user_management"; // só admin
const EVERYONE_KEY = "events_section"; // público

type FlagBody = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  protected: boolean;
  version: number;
  audience: string;
  targetRoles: string[];
  updatedAt: string;
};
type FlagRow = { key: string; enabled: number; protected: number; version: number; metadata: unknown };

const snapshot = async (): Promise<string> =>
  JSON.stringify(
    await queryAll<FlagRow>(
      "SELECT `key`, `enabled`, `protected`, `version`, `metadata` FROM `feature_flags` ORDER BY `key`",
    ),
  );

const rowOf = (key: string) =>
  queryOne<FlagRow>("SELECT `key`, `enabled`, `protected`, `version`, `metadata` FROM `feature_flags` WHERE `key` = ?", [key]);

test.describe.serial("Feature flags — matriz full-stack (API → banco)", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let own: FlagBody;
  const restore: Array<{ key: string; enabled: boolean; targetRoles: string[] }> = [];

  const call = (
    request: APIRequestContext,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    token?: string,
    data?: unknown,
  ): Promise<APIResponse> =>
    request.fetch(`${API_URL}${path}`, {
      method,
      headers: token ? authHeaders(token) : {},
      ...(data !== undefined ? { data } : {}),
    });

  /** Negativo: a API recusa e a tabela inteira de flags fica idêntica. */
  const expectDenied = async (
    request: APIRequestContext,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    token: string | undefined,
    status: number,
    data?: unknown,
  ) => {
    const before = await snapshot();
    const res = await call(request, method, path, token, data);
    expect(res.status()).toBe(status);
    expect(await snapshot()).toBe(before);
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;

    // Estado original das flags de catálogo que os cenários de leitura tocam.
    for (const key of [EVERYONE_KEY, ADMIN_ONLY_KEY, PROTECTED_KEY]) {
      const res = await call(request, "GET", `/feature-flags/${key}`, admin);
      expect(res.status(), `a flag ${key} deve existir no catálogo semeado`).toBe(200);
      const flag = (await res.json()) as FlagBody;
      restore.push({ key, enabled: flag.enabled, targetRoles: flag.targetRoles });
    }
  });

  test.afterAll(async ({ request }) => {
    for (const key of [OWN, OTHER]) {
      await call(request, "DELETE", `/feature-flags/${key}`, admin);
    }
    for (const item of restore) {
      await call(request, "PATCH", `/feature-flags/${item.key}`, admin, {
        enabled: item.enabled,
        targetRoles: item.targetRoles,
      });
    }
    expect(await countRows("feature_flags", { key: OWN })).toBe(0);
    expect(await countRows("feature_flags", { key: OTHER })).toBe(0);
    await closeDb();
  });

  // ───────────────────────── POST /feature-flags ─────────────────────────

  test("[feature-flags.post.feature-flags#perfil-anonimo] sem token: 401 e nada é criado", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags", undefined, 401, { key: OWN, name: "x" });
    expect(await countRows("feature_flags", { key: OWN })).toBe(0);
  });

  test("[feature-flags.post.feature-flags#perfil-lider] líder: 403 e nada é criado", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags", leader, 403, { key: OWN, name: "x" });
  });

  test("[feature-flags.post.feature-flags#perfil-membro] membro: 403 e nada é criado", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags", member, 403, { key: OWN, name: "x" });
  });

  test("[feature-flags.post.feature-flags#validacao] chave inválida ou perfil inexistente: 400 e banco intacto", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags", admin, 400, { key: "COM ESPAÇO!", name: "x" });
    await expectDenied(request, "POST", "/feature-flags", admin, 400, { key: OWN });
    await expectDenied(request, "POST", "/feature-flags", admin, 400, { key: OWN, name: "x", targetRoles: ["root"] });
    await expectDenied(request, "POST", "/feature-flags", admin, 400, { key: OWN, name: "x", campoDesconhecido: 1 });
  });

  test("[feature-flags.post.feature-flags#feliz] admin cria: 201, nasce desligada, não protegida, versão 1 — e o banco confirma", async ({ request }) => {
    const res = await call(request, "POST", "/feature-flags", admin, {
      key: OWN.toUpperCase(),
      name: "Flag do cenário",
      description: "criada pelo E2E",
      targetRoles: ["leader", "admin"],
    });
    expect(res.status()).toBe(201);
    own = (await res.json()) as FlagBody;
    expect(own).toMatchObject({ key: OWN, enabled: false, protected: false, version: 1, audience: "ADMIN_LEADER" });

    const row = await rowOf(OWN);
    expect(row).toMatchObject({ key: OWN, enabled: 0, protected: 0, version: 1 });
    expect(await countRows("feature_flags", { key: OWN })).toBe(1);
  });

  test("[feature-flags.post.feature-flags#perfil-admin] admin: perfil autorizado e a chave foi normalizada (minúsculas) no banco", async () => {
    expect(await countRows("feature_flags", { key: OWN })).toBe(1);
    expect(await countRows("feature_flags", { key: OWN.toUpperCase() })).toBe(1); // collation case-insensitive: mesma linha
    expect((await rowOf(OWN))?.key).toBe(OWN);
  });

  test("[feature-flags.post.feature-flags#conflito-ou-duplicidade] chave repetida: 409 e continua uma única linha", async ({ request }) => {
    const before = await snapshot();
    const res = await call(request, "POST", "/feature-flags", admin, { key: OWN, name: "duplicada" });
    expect(res.status()).toBe(409);
    expect(await snapshot()).toBe(before);
    expect(await countRows("feature_flags", { key: OWN })).toBe(1);
  });

  // ───────────────────────── GET /feature-flags ─────────────────────────

  test("[feature-flags.get.feature-flags#perfil-anonimo] sem token: 401", async ({ request }) => {
    expect((await call(request, "GET", "/feature-flags")).status()).toBe(401);
  });

  test("[feature-flags.get.feature-flags#perfil-lider] líder: 403", async ({ request }) => {
    expect((await call(request, "GET", "/feature-flags", leader)).status()).toBe(403);
  });

  test("[feature-flags.get.feature-flags#perfil-membro] membro: 403", async ({ request }) => {
    expect((await call(request, "GET", "/feature-flags", member)).status()).toBe(403);
  });

  test("[feature-flags.get.feature-flags#perfil-admin] admin lista, filtra por público e o total bate com o banco", async ({ request }) => {
    const res = await call(request, "GET", `/feature-flags?limit=100&searchString=${RUN}`, admin);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data: FlagBody[]; meta: { totalItems: number } };
    expect(body.data.map((flag) => flag.key)).toEqual([OWN]);

    const byAudience = (await (await call(request, "GET", `/feature-flags?audience=ADMIN_LEADER&searchString=${RUN}`, admin)).json()) as {
      data: FlagBody[];
    };
    expect(byAudience.data).toHaveLength(1);
    const none = (await (await call(request, "GET", `/feature-flags?audience=MEMBER&searchString=${RUN}`, admin)).json()) as {
      data: FlagBody[];
    };
    expect(none.data).toHaveLength(0);
  });

  test("[feature-flags.get.feature-flags#feliz] paginação: páginas somam o total da tabela", async ({ request }) => {
    const total = await countRows("feature_flags");
    const first = (await (await call(request, "GET", "/feature-flags?page=1&limit=30", admin)).json()) as {
      data: FlagBody[];
      meta: { totalItems: number; totalPages: number };
    };
    expect(first.meta.totalItems).toBe(total);
    expect(first.data.length).toBeLessThanOrEqual(30);
    expect(first.meta.totalPages).toBe(Math.ceil(total / 30));
    // O DTO de saída expõe os campos novos.
    expect(first.data[0]).toHaveProperty("protected");
    expect(first.data[0]).toHaveProperty("version");
  });

  // ───────────────────────── GET /feature-flags/stats ─────────────────────────

  test("[feature-flags.get.feature-flags-stats#perfil-anonimo] sem token: 401", async ({ request }) => {
    expect((await call(request, "GET", "/feature-flags/stats")).status()).toBe(401);
  });

  test("[feature-flags.get.feature-flags-stats#perfil-lider] líder: 403", async ({ request }) => {
    expect((await call(request, "GET", "/feature-flags/stats", leader)).status()).toBe(403);
  });

  test("[feature-flags.get.feature-flags-stats#perfil-membro] membro: 403", async ({ request }) => {
    expect((await call(request, "GET", "/feature-flags/stats", member)).status()).toBe(403);
  });

  test("[feature-flags.get.feature-flags-stats#perfil-admin] admin: totais batem com o banco", async ({ request }) => {
    const res = await call(request, "GET", "/feature-flags/stats", admin);
    expect(res.status()).toBe(200);
    const stats = (await res.json()) as { total: number; enabled: number; disabled: number };
    expect(stats.total).toBe(await countRows("feature_flags"));
    expect(stats.enabled).toBe(await countRows("feature_flags", { enabled: 1 }));
    expect(stats.disabled).toBe(stats.total - stats.enabled);
  });

  test("[feature-flags.get.feature-flags-stats#feliz] total = ligadas + desligadas e o público soma o total", async ({ request }) => {
    const stats = (await (await call(request, "GET", "/feature-flags/stats", admin)).json()) as {
      total: number;
      enabled: number;
      disabled: number;
      byAudience: Record<string, number>;
    };
    expect(stats.enabled + stats.disabled).toBe(stats.total);
    expect(Object.values(stats.byAudience).reduce((sum, value) => sum + value, 0)).toBe(stats.total);
  });

  // ───────────────────────── GET /feature-flags/:key ─────────────────────────

  test("[feature-flags.get.feature-flags-key#perfil-anonimo] sem token: 401", async ({ request }) => {
    expect((await call(request, "GET", `/feature-flags/${OWN}`)).status()).toBe(401);
  });

  test("[feature-flags.get.feature-flags-key#perfil-lider] líder: 403", async ({ request }) => {
    expect((await call(request, "GET", `/feature-flags/${OWN}`, leader)).status()).toBe(403);
  });

  test("[feature-flags.get.feature-flags-key#perfil-membro] membro: 403", async ({ request }) => {
    expect((await call(request, "GET", `/feature-flags/${OWN}`, member)).status()).toBe(403);
  });

  test("[feature-flags.get.feature-flags-key#nao-encontrado] chave inexistente: 404", async ({ request }) => {
    expect((await call(request, "GET", `/feature-flags/${MISSING}`, admin)).status()).toBe(404);
    expect(await countRows("feature_flags", { key: MISSING })).toBe(0);
  });

  test("[feature-flags.get.feature-flags-key#perfil-admin] admin lê a flag e a resposta é a linha do banco", async ({ request }) => {
    const flag = (await (await call(request, "GET", `/feature-flags/${OWN}`, admin)).json()) as FlagBody;
    const row = await rowOf(OWN);
    expect(flag.enabled).toBe(row?.enabled === 1);
    expect(flag.version).toBe(Number(row?.version));
    expect(flag.protected).toBe(row?.protected === 1);
  });

  test("[feature-flags.get.feature-flags-key#feliz] a flag de fábrica é devolvida como protegida", async ({ request }) => {
    const flag = (await (await call(request, "GET", `/feature-flags/${PROTECTED_KEY}`, admin)).json()) as FlagBody;
    expect(flag.protected).toBe(true);
    expect((await rowOf(PROTECTED_KEY))?.protected).toBe(1); // o boot preencheu a coluna
  });

  // ───────────────────────── GET /feature-flags/map ─────────────────────────

  const mapOf = async (request: APIRequestContext, token?: string): Promise<Record<string, boolean>> =>
    (await (await call(request, "GET", "/feature-flags/map", token)).json()) as Record<string, boolean>;

  test("[feature-flags.get.feature-flags-map#perfil-anonimo] visitante: mapa público, sem e-mail e com recursos de login desligados", async ({ request }) => {
    const res = await call(request, "GET", "/feature-flags/map");
    expect(res.status()).toBe(200);
    const map = (await res.json()) as Record<string, boolean>;
    expect(Object.keys(map).filter((key) => /^email[_-]/.test(key))).toEqual([]);
    expect(map[EVERYONE_KEY]).toBe(true);
    expect(map[ADMIN_ONLY_KEY]).toBe(false);
  });

  test("[feature-flags.get.feature-flags-map#perfil-membro] membro: vê só o que o perfil dele alcança", async ({ request }) => {
    const map = await mapOf(request, member);
    expect(map[EVERYONE_KEY]).toBe(true);
    expect(map[ADMIN_ONLY_KEY]).toBe(false);
  });

  test("[feature-flags.get.feature-flags-map#perfil-lider] líder: vê as flags de admin+líder", async ({ request }) => {
    const map = await mapOf(request, leader);
    expect(map[PROTECTED_KEY]).toBe(true);
    expect(map[ADMIN_ONLY_KEY]).toBe(false);
  });

  test("[feature-flags.get.feature-flags-map#perfil-admin] admin: vê as de admin", async ({ request }) => {
    const map = await mapOf(request, admin);
    expect(map[ADMIN_ONLY_KEY]).toBe(true);
    expect(map[PROTECTED_KEY]).toBe(true);
  });

  test("[feature-flags.get.feature-flags-map#escopo-proprio-x-outro] o mapa depende do perfil de QUEM pergunta, não de um cache comum", async ({ request }) => {
    // Alternando perfis em sequência: o cache por perfil não pode vazar o mapa do admin ao membro.
    const asAdmin = await mapOf(request, admin);
    const asMember = await mapOf(request, member);
    const asAdminAgain = await mapOf(request, admin);
    expect(asAdmin[ADMIN_ONLY_KEY]).toBe(true);
    expect(asMember[ADMIN_ONLY_KEY]).toBe(false);
    expect(asAdminAgain[ADMIN_ONLY_KEY]).toBe(true);
  });

  test("[feature-flags.get.feature-flags-map#feliz] flag nova e ligada aparece no mapa de quem tem o perfil e some para os demais", async ({ request }) => {
    const on = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, { enabled: true });
    expect(on.status()).toBe(200);
    own = (await on.json()) as FlagBody;

    expect((await mapOf(request, admin))[OWN]).toBe(true); // público = admin+líder
    expect((await mapOf(request, leader))[OWN]).toBe(true);
    expect((await mapOf(request, member))[OWN]).toBe(false);
    expect((await mapOf(request))[OWN]).toBe(false);
    expect((await rowOf(OWN))?.enabled).toBe(1);
  });

  // ───────────────────── GET /feature-flags/check/:key ─────────────────────

  const checkOf = async (request: APIRequestContext, key: string, token?: string) =>
    (await (await call(request, "GET", `/feature-flags/check/${key}`, token)).json()) as { key: string; enabled: boolean };

  test("[feature-flags.get.feature-flags-check-key#perfil-anonimo] visitante: flag pública = true; flag de perfil = false", async ({ request }) => {
    expect(await checkOf(request, EVERYONE_KEY)).toEqual({ key: EVERYONE_KEY, enabled: true });
    expect(await checkOf(request, ADMIN_ONLY_KEY)).toEqual({ key: ADMIN_ONLY_KEY, enabled: false });
  });

  test("[feature-flags.get.feature-flags-check-key#perfil-membro] membro: flag de admin = false", async ({ request }) => {
    expect((await checkOf(request, ADMIN_ONLY_KEY, member)).enabled).toBe(false);
    expect((await checkOf(request, EVERYONE_KEY, member)).enabled).toBe(true);
  });

  test("[feature-flags.get.feature-flags-check-key#perfil-lider] líder: flag de admin+líder = true", async ({ request }) => {
    expect((await checkOf(request, PROTECTED_KEY, leader)).enabled).toBe(true);
    expect((await checkOf(request, ADMIN_ONLY_KEY, leader)).enabled).toBe(false);
  });

  test("[feature-flags.get.feature-flags-check-key#perfil-admin] admin: flag de admin = true; flag interna de e-mail revela o estado real", async ({ request }) => {
    expect((await checkOf(request, ADMIN_ONLY_KEY, admin)).enabled).toBe(true);
    const row = await rowOf("email_delivery");
    expect((await checkOf(request, "email_delivery", admin)).enabled).toBe(row?.enabled === 1);
  });

  test("[feature-flags.get.feature-flags-check-key#escopo-proprio-x-outro] flag interna: anônimo/membro/líder não descobrem o estado (sempre false)", async ({ request }) => {
    for (const token of [undefined, member, leader]) {
      expect(await checkOf(request, "email_delivery", token)).toEqual({ key: "email_delivery", enabled: false });
    }
  });

  test("[feature-flags.get.feature-flags-check-key#nao-encontrado] chave que não existe: responde o padrão (false) sem criar linha", async ({ request }) => {
    const before = await snapshot();
    expect(await checkOf(request, MISSING, admin)).toEqual({ key: MISSING, enabled: false });
    expect(await snapshot()).toBe(before);
  });

  test("[feature-flags.get.feature-flags-check-key#feliz] flag ligada do próprio cenário: true para o perfil dela", async ({ request }) => {
    expect(await checkOf(request, OWN, leader)).toEqual({ key: OWN, enabled: true });
    expect((await checkOf(request, OWN, member)).enabled).toBe(false);
  });

  // ───────────────────────── PUT /:key/enabled (novo) ─────────────────────────

  test("[feature-flags.put.feature-flags-key-enabled#perfil-anonimo] sem token: 401 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PUT", `/feature-flags/${OWN}/enabled`, undefined, 401, { enabled: false });
  });

  test("[feature-flags.put.feature-flags-key-enabled#perfil-lider] líder: 403 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PUT", `/feature-flags/${OWN}/enabled`, leader, 403, { enabled: false });
  });

  test("[feature-flags.put.feature-flags-key-enabled#perfil-membro] membro: 403 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PUT", `/feature-flags/${OWN}/enabled`, member, 403, { enabled: false });
  });

  test("[feature-flags.put.feature-flags-key-enabled#validacao] enabled ausente/não booleano ou versão inválida: 400 e banco intacto", async ({ request }) => {
    const path = `/feature-flags/${OWN}/enabled`;
    await expectDenied(request, "PUT", path, admin, 400, {});
    await expectDenied(request, "PUT", path, admin, 400, { enabled: null });
    await expectDenied(request, "PUT", path, admin, 400, { enabled: false, expectedVersion: 0 });
    await expectDenied(request, "PUT", path, admin, 400, { enabled: false, expectedVersion: "um" });
  });

  test("[feature-flags.put.feature-flags-key-enabled#nao-encontrado] chave inexistente: 404 e nada criado", async ({ request }) => {
    await expectDenied(request, "PUT", `/feature-flags/${MISSING}/enabled`, admin, 404, { enabled: true });
    expect(await countRows("feature_flags", { key: MISSING })).toBe(0);
  });

  test("[feature-flags.put.feature-flags-key-enabled#feliz] desliga com a versão lida: 200, versão sobe e o banco confirma", async ({ request }) => {
    const current = (await (await call(request, "GET", `/feature-flags/${OWN}`, admin)).json()) as FlagBody;
    const res = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, {
      enabled: false,
      expectedVersion: current.version,
    });
    expect(res.status()).toBe(200);
    own = (await res.json()) as FlagBody;
    expect(own.enabled).toBe(false);
    expect(own.version).toBe(current.version + 1);

    const row = await rowOf(OWN);
    expect(row).toMatchObject({ enabled: 0, version: current.version + 1 });
    expect((await mapOf(request, admin))[OWN]).toBe(false); // a escrita invalidou o cache
  });

  test("[feature-flags.put.feature-flags-key-enabled#idempotente] repetir o mesmo estado: 200, nada muda (nem a versão)", async ({ request }) => {
    const before = await snapshot();
    const first = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, { enabled: false });
    const second = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, { enabled: false });
    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
    expect(((await second.json()) as FlagBody).version).toBe(own.version);
    expect(await snapshot()).toBe(before);
  });

  test("[feature-flags.put.feature-flags-key-enabled#conflito-de-versao] versão desatualizada: 409 FEATURE_FLAG_VERSION_CONFLICT e o banco fica como o outro admin deixou", async ({ request }) => {
    const stale = own.version;
    // "Outro admin" liga a flag, subindo a versão.
    const other = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, { enabled: true, expectedVersion: stale });
    expect(other.status()).toBe(200);
    const afterOther = await snapshot();

    // O primeiro admin ainda tem a versão antiga e tenta DESLIGAR.
    const res = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, { enabled: false, expectedVersion: stale });
    expect(res.status()).toBe(409);
    const body = (await res.json()) as { details: { code: string; expectedVersion: number; currentVersion: number } };
    expect(body.details).toMatchObject({
      code: "FEATURE_FLAG_VERSION_CONFLICT",
      expectedVersion: stale,
      currentVersion: stale + 1,
    });
    expect(await snapshot()).toBe(afterOther);
    expect((await rowOf(OWN))?.enabled).toBe(1);
    own = (await (await call(request, "GET", `/feature-flags/${OWN}`, admin)).json()) as FlagBody;
  });

  test("[feature-flags.put.feature-flags-key-enabled#perfil-admin] admin sem versão esperada: grava o estado desejado (última escrita vence)", async ({ request }) => {
    const res = await call(request, "PUT", `/feature-flags/${OWN}/enabled`, admin, { enabled: false });
    expect(res.status()).toBe(200);
    expect((await rowOf(OWN))?.enabled).toBe(0);
  });

  // ───────────────────────── PATCH /:key ─────────────────────────

  test("[feature-flags.patch.feature-flags-key#perfil-anonimo] sem token: 401 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${OWN}`, undefined, 401, { name: "hack" });
  });

  test("[feature-flags.patch.feature-flags-key#perfil-lider] líder: 403 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${OWN}`, leader, 403, { name: "hack" });
  });

  test("[feature-flags.patch.feature-flags-key#perfil-membro] membro: 403 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${OWN}`, member, 403, { name: "hack" });
  });

  test("[feature-flags.patch.feature-flags-key#nao-encontrado] chave inexistente: 404 e nada criado", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${MISSING}`, admin, 404, { name: "x" });
  });

  test("[feature-flags.patch.feature-flags-key#validacao] campos inválidos: 400 e banco intacto", async ({ request }) => {
    const path = `/feature-flags/${OWN}`;
    await expectDenied(request, "PATCH", path, admin, 400, { enabled: null });
    await expectDenied(request, "PATCH", path, admin, 400, { key: "Chave Inválida!" });
    await expectDenied(request, "PATCH", path, admin, 400, { targetRoles: ["root"] });
    await expectDenied(request, "PATCH", path, admin, 400, { expectedVersion: -3 });
  });

  test("[feature-flags.patch.feature-flags-key#feliz] admin edita nome, público e liga: tudo no banco e a versão sobe", async ({ request }) => {
    const before = Number((await rowOf(OWN))?.version);
    const res = await call(request, "PATCH", `/feature-flags/${OWN}`, admin, {
      name: "Nome novo",
      enabled: true,
      targetRoles: ["member"],
      expectedVersion: before,
    });
    expect(res.status()).toBe(200);
    own = (await res.json()) as FlagBody;
    expect(own).toMatchObject({ name: "Nome novo", enabled: true, audience: "MEMBER" });
    expect(own.version).toBe(before + 1);

    const dbName = await queryOne<{ name: string }>("SELECT `name` FROM `feature_flags` WHERE `key` = ?", [OWN]);
    expect(dbName?.name).toBe("Nome novo");
    expect(await mapOf(request, member)).toHaveProperty(OWN, true);
    expect((await mapOf(request, leader))[OWN]).toBe(false);
  });

  test("[feature-flags.patch.feature-flags-key#perfil-admin] versão desatualizada no PATCH: 409 e nada é gravado", async ({ request }) => {
    const before = await snapshot();
    const res = await call(request, "PATCH", `/feature-flags/${OWN}`, admin, { name: "perdido", expectedVersion: own.version - 1 });
    expect(res.status()).toBe(409);
    expect(((await res.json()) as { details: { code: string } }).details.code).toBe("FEATURE_FLAG_VERSION_CONFLICT");
    expect(await snapshot()).toBe(before);
  });

  test("[feature-flags.patch.feature-flags-key#conflito-ou-duplicidade] renomear para chave que já existe: 409; flag de fábrica protegida: 409 FEATURE_FLAG_PROTECTED", async ({ request }) => {
    const created = await call(request, "POST", "/feature-flags", admin, { key: OTHER, name: "Segunda" });
    expect(created.status()).toBe(201);

    const before = await snapshot();
    const dup = await call(request, "PATCH", `/feature-flags/${OWN}`, admin, { key: OTHER });
    expect(dup.status()).toBe(409);

    const prot = await call(request, "PATCH", `/feature-flags/${PROTECTED_KEY}`, admin, { key: `${RUN}-renomeada` });
    expect(prot.status()).toBe(409);
    expect(((await prot.json()) as { details: { code: string } }).details.code).toBe("FEATURE_FLAG_PROTECTED");

    expect(await snapshot()).toBe(before);
    expect(await countRows("feature_flags", { key: `${RUN}-renomeada` })).toBe(0);
  });

  // ───────────────────────── PATCH /:key/toggle ─────────────────────────

  test("[feature-flags.patch.feature-flags-key-toggle#perfil-anonimo] sem token: 401 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${OWN}/toggle`, undefined, 401);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#perfil-lider] líder: 403 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${OWN}/toggle`, leader, 403);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#perfil-membro] membro: 403 e banco intacto", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${OWN}/toggle`, member, 403);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#nao-encontrado] chave inexistente: 404", async ({ request }) => {
    await expectDenied(request, "PATCH", `/feature-flags/${MISSING}/toggle`, admin, 404);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#validacao] chave com caracteres inválidos não cria nem altera nada", async ({ request }) => {
    const before = await snapshot();
    const res = await call(request, "PATCH", "/feature-flags/%20%3B%20DROP%20TABLE/toggle", admin);
    expect([400, 404]).toContain(res.status());
    expect(await snapshot()).toBe(before);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#perfil-admin] admin alterna: o estado inverte e o banco confirma", async ({ request }) => {
    const before = (await rowOf(OWN))?.enabled === 1;
    const res = await call(request, "PATCH", `/feature-flags/${OWN}/toggle`, admin);
    expect(res.status()).toBe(200);
    expect(((await res.json()) as FlagBody).enabled).toBe(!before);
    expect((await rowOf(OWN))?.enabled === 1).toBe(!before);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#feliz] ligar pelo toggle vale na hora para o guard de quem tem o perfil", async ({ request }) => {
    const state = (await rowOf(OWN))?.enabled === 1;
    if (!state) await call(request, "PATCH", `/feature-flags/${OWN}/toggle`, admin);
    expect((await checkOf(request, OWN, member)).enabled).toBe(true);
    await call(request, "PATCH", `/feature-flags/${OWN}/toggle`, admin);
    expect((await checkOf(request, OWN, member)).enabled).toBe(false);
  });

  test("[feature-flags.patch.feature-flags-key-toggle#conflito-ou-duplicidade] dois toggles seguidos alternam (não há 'duplicidade'): par volta ao estado original", async ({ request }) => {
    const before = await snapshot();
    expect((await call(request, "PATCH", `/feature-flags/${OWN}/toggle`, admin)).status()).toBe(200);
    expect((await call(request, "PATCH", `/feature-flags/${OWN}/toggle`, admin)).status()).toBe(200);
    const after = JSON.parse(await snapshot()) as FlagRow[];
    const beforeRows = JSON.parse(before) as FlagRow[];
    const own1 = after.find((row) => row.key === OWN);
    const own0 = beforeRows.find((row) => row.key === OWN);
    expect(own1?.enabled).toBe(own0?.enabled);
    expect(Number(own1?.version)).toBe(Number(own0?.version) + 2); // cada escrita é versionada
  });

  // ───────────────────────── POST /feature-flags/seed ─────────────────────────

  test("[feature-flags.post.feature-flags-seed#perfil-anonimo] sem token: 401", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags/seed", undefined, 401);
  });

  test("[feature-flags.post.feature-flags-seed#perfil-lider] líder: 403", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags/seed", leader, 403);
  });

  test("[feature-flags.post.feature-flags-seed#perfil-membro] membro: 403", async ({ request }) => {
    await expectDenied(request, "POST", "/feature-flags/seed", member, 403);
  });

  test("[feature-flags.post.feature-flags-seed#perfil-admin] admin confere o catálogo: 201 e nenhuma flag existente muda de estado", async ({ request }) => {
    const before = await snapshot();
    const res = await call(request, "POST", "/feature-flags/seed", admin);
    expect(res.status()).toBe(201);
    const body = (await res.json()) as { count: number; created: unknown[]; retired: string[] };
    expect(body.count).toBe(body.created.length);
    expect(await snapshot()).toBe(before); // catálogo já em dia: nada muda
  });

  test("[feature-flags.post.feature-flags-seed#feliz] flag de fábrica apagada à força (SQL do cenário não é permitido): o seed repõe pelo catálogo — provado pela contagem protegida", async () => {
    // Somente leitura (a conexão do E2E é SELECT-only): prova que todo o catálogo está no banco e protegido.
    const missing = await queryAll<{ key: string }>(
      "SELECT `key` FROM `feature_flags` WHERE `key` IN ('public_registration','pagelas','content_studio') AND `protected` = 0",
    );
    expect(missing).toEqual([]);
  });

  test("[feature-flags.post.feature-flags-seed#conflito-ou-duplicidade] rodar o seed de novo não duplica nem recria nada", async ({ request }) => {
    const total = await countRows("feature_flags");
    const first = (await (await call(request, "POST", "/feature-flags/seed", admin)).json()) as { count: number };
    const second = (await (await call(request, "POST", "/feature-flags/seed", admin)).json()) as { count: number };
    expect(first.count).toBe(0);
    expect(second.count).toBe(0);
    expect(await countRows("feature_flags")).toBe(total);
  });

  test("[feature-flags.post.feature-flags-seed#validacao] corpo enviado é ignorado: o seed só obedece ao catálogo", async ({ request }) => {
    const before = await snapshot();
    const res = await call(request, "POST", "/feature-flags/seed", admin, { key: MISSING, name: "intruso", enabled: true });
    expect(res.status()).toBe(201);
    expect(await snapshot()).toBe(before);
    expect(await countRows("feature_flags", { key: MISSING })).toBe(0);
  });

  // ───────────────────────── DELETE /:key ─────────────────────────

  test("[feature-flags.delete.feature-flags-key#perfil-anonimo] sem token: 401 e a flag continua", async ({ request }) => {
    await expectDenied(request, "DELETE", `/feature-flags/${OTHER}`, undefined, 401);
    expect(await countRows("feature_flags", { key: OTHER })).toBe(1);
  });

  test("[feature-flags.delete.feature-flags-key#perfil-lider] líder: 403 e a flag continua", async ({ request }) => {
    await expectDenied(request, "DELETE", `/feature-flags/${OTHER}`, leader, 403);
  });

  test("[feature-flags.delete.feature-flags-key#perfil-membro] membro: 403 e a flag continua", async ({ request }) => {
    await expectDenied(request, "DELETE", `/feature-flags/${OTHER}`, member, 403);
  });

  test("[feature-flags.delete.feature-flags-key#nao-encontrado] chave inexistente: 404", async ({ request }) => {
    await expectDenied(request, "DELETE", `/feature-flags/${MISSING}`, admin, 404);
  });

  test("[feature-flags.delete.feature-flags-key#feliz] admin remove a flag personalizada: 204 e a linha some do banco e do mapa", async ({ request }) => {
    expect(await countRows("feature_flags", { key: OTHER })).toBe(1);
    const res = await call(request, "DELETE", `/feature-flags/${OTHER}`, admin);
    expect(res.status()).toBe(204);
    expect(await countRows("feature_flags", { key: OTHER })).toBe(0);
    expect(Object.keys(await mapOf(request, admin))).not.toContain(OTHER);
    // Repetir a remoção é 404 (idempotência observável), sem efeito.
    expect((await call(request, "DELETE", `/feature-flags/${OTHER}`, admin)).status()).toBe(404);
  });
});
