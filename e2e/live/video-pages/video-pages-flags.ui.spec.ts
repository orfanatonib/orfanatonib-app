import type { APIRequestContext } from "@playwright/test";

import { cleanupData } from "../support/keep-data";
import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { createPage, createPageRaw, deletePageApi, pagesWithTag, snapshotDb, type VideoPageBody } from "./support";

/**
 * Flags das páginas de vídeo (plano 34, §6): `public_videos` e `training_videos` leem o mesmo endpoint
 * (`anyOf`); `page_management` governa a gestão. Desligada: a rota/menu some E a API devolve 403
 * FEATURE_DISABLED E o banco não muda. O estado original das flags é restaurado no fim.
 */
const FLAGS = ["public_videos", "training_videos", "page_management"] as const;
type FlagRow = { enabled: number; metadata: string | Record<string, unknown> | null };

const rolesOf = (row: FlagRow): string[] => {
  const meta = typeof row.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : row.metadata;
  return Array.isArray(meta?.targetRoles) ? (meta.targetRoles as string[]) : [];
};

test.describe.serial("Páginas de vídeos — flags", () => {
  let admin: LoginResult;
  let leader: LoginResult;
  let member: LoginResult;
  let source: VideoPageBody;
  const original: Record<string, FlagRow> = {};

  const patchFlag = async (request: APIRequestContext, key: string, data: object) => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data });
    expect(res.ok(), await res.text()).toBeTruthy();
  };
  const restore = async (request: APIRequestContext) => {
    for (const key of FLAGS) {
      await patchFlag(request, key, { enabled: original[key].enabled === 1, targetRoles: rolesOf(original[key]) });
    }
  };
  const getAs = (request: APIRequestContext, token?: string) =>
    request.get(`${API_URL}/video-pages/${source.id}`, { headers: token ? authHeaders(token) : {} });

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    leader = await loginAs(request, "leader");
    member = await loginAs(request, "member");
    for (const key of FLAGS) {
      original[key] = (await queryOne<FlagRow>("SELECT enabled, metadata FROM feature_flags WHERE `key` = ?", [key])) as FlagRow;
    }
    source = await createPage(request, admin.accessToken, { title: tagged("flags"), videos: [{ title: "v" }] });
  });

  test.afterEach(async ({ request }) => restore(request));

  test.afterAll(async ({ request }) => {
    await restore(request);
    await cleanupData(async () => {
      await deletePageApi(request, admin.accessToken, source.id);
      expect(await pagesWithTag(RUN_TAG)).toBe(0);
    });
    await closeDb();
  });

  test("[video-page.post.video-pages#flag-desligada] page_management desligada: a rota de gestão some, a API recusa com FEATURE_DISABLED e o banco não muda", async ({
    page,
    request,
  }) => {
    await patchFlag(request, "page_management", { enabled: false });
    const before = await snapshotDb();
    await seedBrowserSession(page, admin);
    await page.goto("/adm/paginas-videos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("video-pages-manager")).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/adm\/paginas-videos/);

    const res = await createPageRaw(request, admin.accessToken, { title: tagged("flag-off"), videos: [] });
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await snapshotDb()).toEqual(before);
  });

  test("[video-page.get.video-pages-id#flag-desligada] [video-page.get.video-pages#flag-desligada] vídeos público e de formação desligados: página some para o visitante e para o membro, API devolve 403", async ({
    page,
    request,
  }) => {
    await patchFlag(request, "public_videos", { enabled: false });
    await patchFlag(request, "training_videos", { enabled: false });
    await patchFlag(request, "page_management", { enabled: false });
    const before = await snapshotDb();

    await page.goto(`/${source.route.path}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("video-page-view")).toHaveCount(0);

    for (const token of [undefined, member.accessToken, leader.accessToken]) {
      const res = await getAs(request, token);
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    }
    expect(await snapshotDb()).toEqual(before);

    await seedBrowserSession(page, member);
    await page.goto("/area-do-membro/videos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("member-videos-page")).toHaveCount(0);
  });

  test("training_videos ligada só para líder (e public_videos desligada): membro não vê nem chama; o líder vê", async ({ page, request, browser }) => {
    await patchFlag(request, "public_videos", { enabled: false });
    await patchFlag(request, "training_videos", { enabled: true, targetRoles: ["leader"] });
    const before = await snapshotDb();

    expect((await getAs(request, member.accessToken)).status()).toBe(403);
    expect((await getAs(request, leader.accessToken)).status()).toBe(200);

    await seedBrowserSession(page, member);
    await page.goto("/area-do-membro/videos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("member-videos-page")).toHaveCount(0);

    const context = await browser.newContext();
    const leaderPage = await context.newPage();
    await seedBrowserSession(leaderPage, leader);
    await leaderPage.goto(`/area-do-membro/videos/${source.id}`);
    await expect(leaderPage.getByTestId("video-page-view")).toBeVisible({ timeout: 20_000 });
    await context.close();
    expect(await snapshotDb()).toEqual(before);
  });

  test("flag ligada para todos: o visitante abre a página pública e a API responde 200", async ({ page, request }) => {
    await patchFlag(request, "public_videos", { enabled: true, targetRoles: [] });
    expect((await getAs(request)).status()).toBe(200);
    await page.goto(`/${source.route.path}`);
    await expect(page.getByTestId("video-page-view")).toBeVisible({ timeout: 20_000 });
  });
});
