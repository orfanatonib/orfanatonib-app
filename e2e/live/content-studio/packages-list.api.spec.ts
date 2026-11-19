import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Listagem de pacotes do Estúdio: a página devolve exatamente `limit` pacotes (antes devolvia 2 de 8 porque o
 * TypeORM limitava linhas do join) e o filtro por faixa funciona (antes dava 500 por causa do join solto).
 */
const FLAGS = ["content_studio"] as const;
const before: Record<string, number> = {};
let admin = "";

type Page = { data: Array<{ id: string }>; total: number; page: number; limit: number };

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
});

test.afterAll(async ({ request }) => {
  for (const key of FLAGS) {
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  }
  await closeDb();
});

const list = async (request: import("@playwright/test").APIRequestContext, query: string): Promise<Page> => {
  const res = await request.get(`${API_URL}/content-studio/packages?${query}`, { headers: authHeaders(admin) });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()) as Page;
};

test("percorrendo as páginas de 3 em 3 vem todo pacote uma única vez, e cada página está cheia", async ({ request }) => {
  const total = (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM content_packages"))?.n ?? 0;
  test.skip(total < 4, "precisa de pelo menos 4 pacotes no banco do E2E");

  const seen: string[] = [];
  for (let page = 1; page <= Math.ceil(total / 3); page++) {
    const body = await list(request, `page=${page}&limit=3`);
    expect(body.total).toBe(total);
    expect(body.data.length).toBe(Math.min(3, total - (page - 1) * 3));
    seen.push(...body.data.map((item) => item.id));
  }
  expect(seen).toHaveLength(total);
  expect(new Set(seen).size).toBe(total);
});

test("filtro por faixa etária e por situação respondem 200 e só devolvem o que existe", async ({ request }) => {
  const all = await list(request, "page=1&limit=50");
  for (const audience of ["BABY", "CHILD", "TEEN", "ADULT"]) {
    const filtered = await list(request, `page=1&limit=50&audience=${audience}`);
    expect(filtered.total).toBeLessThanOrEqual(all.total);
    expect(filtered.data.length).toBe(filtered.total);
  }
  const archived = await list(request, "page=1&limit=50&status=ARCHIVED");
  const rows = (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM content_packages WHERE status = 'ARCHIVED'"))?.n ?? 0;
  expect(archived.total).toBe(rows);
});
