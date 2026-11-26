import type { APIRequestContext } from "@playwright/test";

import { closeDb, queryOne } from "../support/db";
import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  CS,
  PUBLICATION_FLAGS,
  STAGE_TEXT_DOCUMENT,
  callApi,
  cleanupPackages,
  createPackage,
  getPackage,
  setFlag,
  type Pkg,
} from "./publication.fixtures";

/**
 * Sininho com caixa de entrada: o envio de uma categoria para a revisão avisa TODOS os administradores
 * (aviso persistido, lido/não lido), o aviso abre a tela certa e "marcar todos como lidos" zera o contador.
 */
type Notice = {
  id: string;
  type: string;
  title: string;
  preview: string;
  readAt: string | null;
  target: { kind: string; id: string; audience: string | null };
};
type Page = { items: Notice[]; total: number; unreadCount: number };

const before: Record<string, number> = {};
const created: string[] = [];
let admin = "";
let pkg: Pkg;

async function produceAndSend(request: APIRequestContext, packageId: string): Promise<void> {
  const full = await getPackage(request, admin, packageId);
  const track = (full.tracks as unknown as Array<{ audience: string; stages: Array<{ id: string; position: number }> }>).find(
    (item) => item.audience === "BABY",
  )!;
  for (const stage of [...track.stages].sort((a, b) => a.position - b.position)) {
    await callApi(request, admin, "patch", `${CS}/packages/${packageId}/stages/${stage.id}/content`, {
      structuredContent: { title: `Etapa ${stage.position}` },
      contentDocument: STAGE_TEXT_DOCUMENT,
    });
    expect([200, 201]).toContain(
      (await callApi(request, admin, "post", `${CS}/packages/${packageId}/stages/${stage.id}/complete-production`)).status(),
    );
  }
  expect([200, 201]).toContain(
    (await callApi(request, admin, "post", `${CS}/packages/${packageId}/submit-review`, { audiences: ["BABY"] })).status(),
  );
}

const listNotices = async (request: APIRequestContext, token: string, query = ""): Promise<Page> => {
  const res = await request.get(`${API_URL}/notifications/me${query}`, { headers: authHeaders(token) });
  expect(res.status()).toBe(200);
  return (await res.json()) as Page;
};

test.describe.serial("Sininho — caixa de entrada dos Estúdios", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const flag of [...PUBLICATION_FLAGS, "notification_center"]) {
      before[flag] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [flag]))?.enabled ?? 0;
      await setFlag(request, admin, flag, true);
    }
    pkg = await createPackage(request, admin, "sininho", created);
    await produceAndSend(request, pkg.id);
  });

  test.afterAll(async ({ request }) => {
    await cleanupPackages(request, admin, created);
    for (const flag of Object.keys(before)) await setFlag(request, admin, flag, before[flag] === 1);
    await closeDb();
  });

  test("API: o envio avisa o admin (uma vez), a lista é paginada e ler é idempotente", async ({ request }) => {
    const page = await listNotices(request, admin, "?limit=50");
    const mine = page.items.filter((item) => item.target.id === pkg.id);
    expect(mine.map((item) => item.type)).toContain("SUBMITTED_FOR_REVIEW");
    expect(mine.filter((item) => item.type === "SUBMITTED_FOR_REVIEW")).toHaveLength(1);
    expect(mine[0].target.kind).toBe("STUDIO_PACKAGE");
    expect(page.unreadCount).toBeGreaterThan(0);

    const summary = await (await request.get(`${API_URL}/notifications/me/summary`, { headers: authHeaders(admin) })).json();
    expect(summary.unreadCount).toBe(page.unreadCount);
    expect(typeof summary.revision).toBe("string");

    const target = mine[0];
    const first = await request.patch(`${API_URL}/notifications/me/${target.id}/read`, { headers: authHeaders(admin) });
    expect(first.status()).toBe(200);
    const firstReadAt = ((await first.json()) as Notice).readAt;
    expect(firstReadAt).not.toBeNull();
    const second = await request.patch(`${API_URL}/notifications/me/${target.id}/read`, { headers: authHeaders(admin) });
    expect(((await second.json()) as Notice).readAt).toBe(firstReadAt);

    const after = await (await request.get(`${API_URL}/notifications/me/summary`, { headers: authHeaders(admin) })).json();
    expect(after.revision).not.toBe(summary.revision);
  });

  test("API: aviso de outra pessoa é 404 e visitante é 401", async ({ request }) => {
    const leader = await loginAs(request, "leader");
    const mine = (await listNotices(request, admin, "?limit=50")).items.find((item) => item.target.id === pkg.id)!;
    expect((await request.get(`${API_URL}/notifications/me/${mine.id}`, { headers: authHeaders(leader.accessToken) })).status()).toBe(404);
    expect((await request.patch(`${API_URL}/notifications/me/${mine.id}/read`, { headers: authHeaders(leader.accessToken) })).status()).toBe(404);
    const leaderPage = await listNotices(request, leader.accessToken);
    expect(leaderPage.items.filter((item) => item.target.id === pkg.id)).toHaveLength(0);
    expect((await request.get(`${API_URL}/notifications/me/summary`)).status()).toBe(401);
  });

  test("UI: o sino mostra o aviso, abre a revisão da categoria e 'marcar todos' zera o contador", async ({ page, request }) => {
    test.setTimeout(100_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm");
    const bell = page.getByTestId("notifications-button");
    await expect(bell).toBeVisible({ timeout: 20_000 });
    await bell.click();
    const inbox = page.getByTestId("notifications-inbox");
    await expect(inbox).toBeVisible();
    const item = inbox.getByTestId("notifications-inbox-item").filter({ hasText: pkg.theme }).first();
    await expect(item).toBeVisible({ timeout: 20_000 });
    // O teste anterior leu só o "enviado"; o "produção concluída" da categoria segue não lido e abre a produção.
    const unread = inbox.locator('[data-testid="notifications-inbox-item"][data-unread="true"]').filter({ hasText: pkg.theme }).first();
    await expect(unread).toContainText("Produção concluída");
    await unread.click();
    await expect(page).toHaveURL(new RegExp(`/adm/estudio/pacotes/${pkg.id}\\?audience=BABY`));

    await page.getByTestId("notifications-button").click();
    const readAll = page.getByTestId("notifications-inbox-read-all");
    if (await readAll.isEnabled()) await readAll.click();
    await expect(readAll).toBeDisabled({ timeout: 20_000 });
    const summary = await (await request.get(`${API_URL}/notifications/me/summary`, { headers: authHeaders(admin) })).json();
    expect(summary.unreadCount).toBe(0);
  });
});
