import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Imposição das flags na API (planos 08/09): o guard decide pelo perfil do ator
 * e responde 403 com details.code = FEATURE_DISABLED. Cada teste restaura o
 * estado original da flag (afterEach) — o banco volta ao que era.
 */
const FLAG_PUBLIC = "events_section"; // público (targetRoles vazio)
const FLAG_MEMBER_AREA = "weekly_meditation"; // admin, leader, member

type FlagRow = { enabled: number; metadata: string | Record<string, unknown> | null };

const rolesOf = (row: FlagRow): string[] => {
  const meta = typeof row.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : row.metadata;
  const roles = meta?.targetRoles;
  return Array.isArray(roles) ? (roles as string[]) : [];
};

test.describe.serial("Feature flags — imposição na API", () => {
  let admin: string;
  let member: string;
  const original: Record<string, FlagRow> = {};

  const readFlag = (key: string) =>
    queryOne<FlagRow>("SELECT enabled, metadata FROM feature_flags WHERE `key` = ?", [key]);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    for (const key of [FLAG_PUBLIC, FLAG_MEMBER_AREA]) {
      const row = await readFlag(key);
      expect(row, `a flag ${key} deve existir no catálogo semeado`).not.toBeNull();
      original[key] = row as FlagRow;
    }
  });

  test.afterEach(async ({ request }) => {
    for (const [key, row] of Object.entries(original)) {
      const res = await request.patch(`${API_URL}/feature-flags/${key}`, {
        headers: authHeaders(admin),
        data: { enabled: row.enabled === 1, targetRoles: rolesOf(row) },
      });
      expect(res.ok()).toBeTruthy();
    }
  });

  test.afterAll(async () => {
    for (const [key, row] of Object.entries(original)) {
      expect((await readFlag(key))?.enabled).toBe(row.enabled);
    }
    await closeDb();
  });

  const setEnabled = async (request: import("@playwright/test").APIRequestContext, key: string, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, {
      headers: authHeaders(admin),
      data: { enabled },
    });
    expect(res.ok()).toBeTruthy();
  };

  test("flag pública ligada: visitante lê /events (200)", async ({ request }) => {
    expect((await request.get(`${API_URL}/events`)).status()).toBe(200);
  });

  test("flag pública desligada: /events responde 403 FEATURE_DISABLED até para o admin; religar restaura", async ({ request }) => {
    await setEnabled(request, FLAG_PUBLIC, false);

    const anon = await request.get(`${API_URL}/events`);
    expect(anon.status()).toBe(403);
    expect(JSON.stringify(await anon.json())).toContain("FEATURE_DISABLED");

    const asAdmin = await request.get(`${API_URL}/events`, { headers: authHeaders(admin) });
    expect(asAdmin.status()).toBe(403);

    await setEnabled(request, FLAG_PUBLIC, true);
    expect((await request.get(`${API_URL}/events`)).status()).toBe(200);
  });

  test("flag de membro: desligada barra o membro; ligada só para admin barra o membro e mantém o admin", async ({ request }) => {
    const url = `${API_URL}/meditations/this-week`;
    expect((await request.get(url, { headers: authHeaders(member) })).status()).toBeLessThan(400);

    await setEnabled(request, FLAG_MEMBER_AREA, false);
    expect((await request.get(url, { headers: authHeaders(member) })).status()).toBe(403);

    const res = await request.patch(`${API_URL}/feature-flags/${FLAG_MEMBER_AREA}`, {
      headers: authHeaders(admin),
      data: { enabled: true, targetRoles: ["admin"] },
    });
    expect(res.ok()).toBeTruthy();
    expect((await request.get(url, { headers: authHeaders(member) })).status()).toBe(403);
    expect((await request.get(url, { headers: authHeaders(admin) })).status()).toBeLessThan(400);
  });

  test("anônimo sem token continua recebendo 401 (e não 403) numa rota protegida com flag", async ({ request }) => {
    const res = await request.post(`${API_URL}/events`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test("o mapa público não traz flags de e-mail", async ({ request }) => {
    const map = (await (await request.get(`${API_URL}/feature-flags/map`)).json()) as Record<string, boolean>;
    expect(Object.keys(map).filter((k) => k.startsWith("email_") || k.startsWith("email-"))).toEqual([]);
    expect(map[FLAG_PUBLIC]).toBe(true);
  });
});
