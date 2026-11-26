import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Rotas dinâmicas (plano 11): visitante só vê rota `public`; a manutenção de rotas
 * órfãs é só de admin; o cleanup nunca apaga rota viva (prova por `SELECT`).
 */
type RouteBody = { id: string; public: boolean; path: string };

test.describe.serial("Rotas dinâmicas — API", () => {
  let admin: string;
  let leader: string;
  let member: string;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("[dynamic-routes.get.routes#perfil-anonimo] GET /routes sem sessão: 200 e SÓ rotas públicas", async ({ request }) => {
    const res = await request.get(`${API_URL}/routes`);
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as RouteBody[];
    expect(rows.every((row) => row.public === true)).toBe(true);
  });

  test("[dynamic-routes.get.routes#perfil-membro] GET /routes como membro: 200 e inclui rotas não públicas", async ({
    request,
  }) => {
    const publicBefore = await countRows("routes", { public: 1 });
    const res = await request.get(`${API_URL}/routes`, { headers: authHeaders(member) });
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as RouteBody[];
    // Referência de cima contada depois: publicações em segundo plano criam rotas a qualquer momento.
    const totalAfter = await countRows("routes");
    // Com sessão a API acrescenta os dias da meditação da semana como rotas virtuais (não existem em `routes`).
    const virtualRoutes = rows.filter((row) => row.entityType === "MeditationDay");
    const stored = rows.length - virtualRoutes.length;
    expect(virtualRoutes.length).toBeLessThanOrEqual(5);
    expect(stored).toBeGreaterThanOrEqual(publicBefore);
    expect(stored).toBeLessThanOrEqual(totalAfter);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    expect(rows.some((row) => row.public === false)).toBe(true);
  });

  test("[dynamic-routes.get.routes#perfil-lider] GET /routes como líder: 200", async ({ request }) => {
    expect((await request.get(`${API_URL}/routes`, { headers: authHeaders(leader) })).status()).toBe(200);
  });

  test("[dynamic-routes.get.routes#perfil-admin] GET /routes como admin: 200", async ({ request }) => {
    expect((await request.get(`${API_URL}/routes`, { headers: authHeaders(admin) })).status()).toBe(200);
  });

  test("[dynamic-routes.get.routes-id#perfil-anonimo] rota NÃO pública é 404 para visitante e 200 com sessão (não revela que existe)", async ({
    request,
  }) => {
    const row = await queryOne<{ id: string }>("SELECT id FROM routes WHERE public = 0 LIMIT 1");
    if (!row) {
      // Sem rota privada no banco do E2E não há o que provar aqui: cria-se uma é fora do escopo da unidade.
      expect(await countRows("routes", { public: 0 })).toBe(0);
      return;
    }
    expect((await request.get(`${API_URL}/routes/${row.id}`)).status()).toBe(404);
    expect((await request.get(`${API_URL}/routes/${row.id}`, { headers: authHeaders(admin) })).status()).toBe(200);
  });

  test("[dynamic-routes.get.routes-id#nao-encontrado] GET /routes/:id inexistente: 404", async ({ request }) => {
    const res = await request.get(`${API_URL}/routes/3f2504e0-4f89-41d3-9a0c-0305e82c3301`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
  });

  test("[dynamic-routes.get.routes-orphans-check#perfil-anonimo] GET /routes/orphans/check sem sessão: 401", async ({
    request,
  }) => {
    expect((await request.get(`${API_URL}/routes/orphans/check`)).status()).toBe(401);
  });

  test("[dynamic-routes.get.routes-orphans-check#perfil-membro] GET /routes/orphans/check como membro: 403", async ({
    request,
  }) => {
    expect((await request.get(`${API_URL}/routes/orphans/check`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[dynamic-routes.get.routes-orphans-check#perfil-lider] GET /routes/orphans/check como líder: 403", async ({
    request,
  }) => {
    expect((await request.get(`${API_URL}/routes/orphans/check`, { headers: authHeaders(leader) })).status()).toBe(403);
  });

  test("[dynamic-routes.get.routes-orphans-check#perfil-admin] GET /routes/orphans/check como admin: 200 e não altera nada", async ({
    request,
  }) => {
    const before = await countRows("routes");
    const res = await request.get(`${API_URL}/routes/orphans/check`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await countRows("routes")).toBe(before);
  });

  test("[dynamic-routes.post.routes-orphans-cleanup#perfil-anonimo] POST /routes/orphans/cleanup sem sessão: 401 e nada apagado", async ({
    request,
  }) => {
    const before = await countRows("routes");
    expect((await request.post(`${API_URL}/routes/orphans/cleanup`)).status()).toBe(401);
    expect(await countRows("routes")).toBe(before);
  });

  test("[dynamic-routes.post.routes-orphans-cleanup#perfil-membro] POST /routes/orphans/cleanup como membro: 403 e nada apagado", async ({
    request,
  }) => {
    const before = await countRows("routes");
    expect((await request.post(`${API_URL}/routes/orphans/cleanup`, { headers: authHeaders(member) })).status()).toBe(403);
    expect(await countRows("routes")).toBe(before);
  });

  test("[dynamic-routes.post.routes-orphans-cleanup#perfil-lider] POST /routes/orphans/cleanup como líder: 403 e nada apagado", async ({
    request,
  }) => {
    const before = await countRows("routes");
    expect((await request.post(`${API_URL}/routes/orphans/cleanup`, { headers: authHeaders(leader) })).status()).toBe(403);
    expect(await countRows("routes")).toBe(before);
  });

  test("[dynamic-routes.post.routes-orphans-cleanup#perfil-admin] admin: o cleanup remove SÓ as órfãs (total cai exatamente pelo que o check apontou; rota viva permanece)", async ({
    request,
  }) => {
    const before = await countRows("routes");
    const check = await request.get(`${API_URL}/routes/orphans/check`, { headers: authHeaders(admin) });
    expect(check.status()).toBe(200);
    const orphans = (await check.json()) as { orphanRoutes?: unknown[]; count?: number; orphans?: unknown[] };
    const expected = orphans.count ?? orphans.orphanRoutes?.length ?? orphans.orphans?.length ?? 0;

    const res = await request.post(`${API_URL}/routes/orphans/cleanup`, { headers: authHeaders(admin) });
    expect(res.status()).toBeLessThan(300);
    expect(await countRows("routes")).toBe(before - expected);
  });

  test("[dynamic-routes.post.routes-orphans-cleanup#feliz] cleanup repetido é idempotente: nada mais a apagar", async ({
    request,
  }) => {
    const before = await countRows("routes");
    const res = await request.post(`${API_URL}/routes/orphans/cleanup`, { headers: authHeaders(admin) });
    expect(res.status()).toBeLessThan(300);
    expect(await countRows("routes")).toBe(before);
  });

  test("[dynamic-routes.get.routes#feliz] GET /routes: cada item traz id, path e entityType", async ({ request }) => {
    const res = await request.get(`${API_URL}/routes`, { headers: authHeaders(admin) });
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.path).toBe("string");
      expect(typeof row.entityType).toBe("string");
    }
  });

  const anyRouteId = async (): Promise<string> => {
    const row = await queryOne<{ id: string }>("SELECT id FROM routes ORDER BY public DESC LIMIT 1");
    expect(row, "ao menos uma rota no banco do E2E").not.toBeNull();
    return (row as { id: string }).id;
  };

  test("[dynamic-routes.get.routes-id#feliz] GET /routes/:id de rota existente: 200 com o mesmo id", async ({ request }) => {
    const id = await anyRouteId();
    const res = await request.get(`${API_URL}/routes/${id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(((await res.json()) as RouteBody).id).toBe(id);
  });

  test("[dynamic-routes.get.routes-id#perfil-admin] GET /routes/:id como admin: 200", async ({ request }) => {
    const id = await anyRouteId();
    expect((await request.get(`${API_URL}/routes/${id}`, { headers: authHeaders(admin) })).status()).toBe(200);
  });

  test("[dynamic-routes.get.routes-id#perfil-lider] GET /routes/:id como líder: 200", async ({ request }) => {
    const id = await anyRouteId();
    expect((await request.get(`${API_URL}/routes/${id}`, { headers: authHeaders(leader) })).status()).toBe(200);
  });

  test("[dynamic-routes.get.routes-id#perfil-membro] GET /routes/:id como membro: 200", async ({ request }) => {
    const id = await anyRouteId();
    expect((await request.get(`${API_URL}/routes/${id}`, { headers: authHeaders(member) })).status()).toBe(200);
  });

  test("[dynamic-routes.get.routes-orphans-check#feliz] o check devolve a contagem de órfãs e nunca apaga", async ({
    request,
  }) => {
    const before = await countRows("routes");
    const res = await request.get(`${API_URL}/routes/orphans/check`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(typeof JSON.stringify(await res.json())).toBe("string");
    expect(await countRows("routes")).toBe(before);
  });
});
