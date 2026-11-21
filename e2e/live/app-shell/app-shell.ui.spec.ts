import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import {
  expectTouchTarget,
  type FlagSnapshot,
  readFlagFromDb,
  restoreFlags,
  type ShellFlag,
  setFlag,
  snapshotFlags,
} from "./support";

/**
 * Casca do app (planos 09/11), front → API → banco, sem mock: rota inexistente é 404 de verdade, o menu público,
 * o menu do usuário e o painel respeitam papel × flag, e cada flag desligada também fecha a API (403 FEATURE_DISABLED)
 * sem alterar o banco. As flags são alteradas pela API do admin, lidas por SELECT em `feature_flags` e restauradas
 * ao estado original no fim (inclusive o público `targetRoles`).
 */
const NAV_ITEMS_PUBLIC = ["Início", "Sobre", "Eventos", "Contato"] as const;
const userMenuTestId = (id: string) => `shell-user-menu-${id}`;
const mobileMenuTestId = (id: string) => `shell-mobile-menu-${id}`;

test.describe.serial("App shell — UI", () => {
  let adminToken: string;
  let original: Record<ShellFlag, FlagSnapshot>;
  const sessions: Partial<Record<"admin" | "leader" | "member", LoginResult>> = {};

  const header = (page: Page) => page.getByRole("banner");
  const navButton = (page: Page, name: string) => header(page).getByRole("button", { name, exact: true });
  const flag = (request: import("@playwright/test").APIRequestContext, key: ShellFlag, enabled: boolean, targetRoles?: string[]) =>
    setFlag(request, adminToken, key, { enabled, targetRoles });
  const openUserMenu = async (page: Page) => {
    await page.getByRole("button", { name: "Menu do Usuário" }).click();
  };
  const loginPage = async (page: Page, role: "admin" | "leader" | "member") => {
    await seedBrowserSession(page, sessions[role] as LoginResult);
  };

  test.beforeAll(async ({ request }) => {
    for (const role of ["admin", "leader", "member"] as const) sessions[role] = await loginAs(request, role);
    adminToken = (sessions.admin as LoginResult).accessToken;
    original = await snapshotFlags();
  });

  // Cada teste parte do estado original das flags (e o banco volta a ele ao final de cada um).
  test.beforeEach(async ({ request }) => {
    await restoreFlags(request, adminToken, original);
    for (const key of Object.keys(original) as ShellFlag[]) {
      expect(await readFlagFromDb(key), `${key} no banco antes do teste`).toEqual(original[key]);
    }
  });

  test.afterAll(async ({ request }) => {
    await restoreFlags(request, adminToken, original);
    await closeDb();
  });

  test("[app-shell.get.rota-inexistente#nao-encontrado] rota que não existe mostra a página 404, não a Home", async ({ page }) => {
    await page.goto("/pagina-que-nao-existe-123");
    await expect(page.getByTestId("not-found-page")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("not-found-home").click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test("[app-shell.get.menu-publico#visitante] visitante vê o menu público e o Entrar, sem menu de usuário", async ({ page }) => {
    for (const key of ["about_page", "events_section"] as const) expect((await readFlagFromDb(key)).enabled).toBe(true);
    await page.goto("/");
    for (const name of NAV_ITEMS_PUBLIC) await expect(navButton(page, name).first()).toBeVisible({ timeout: 20_000 });
    await expect(header(page).getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu do Usuário" })).toHaveCount(0);
  });

  test("[app-shell.get.menu-publico#flag-desligada] com about_page desligada o item Sobre some do menu; ligada, volta", async ({ page, request }) => {
    await page.goto("/");
    await expect(navButton(page, "Sobre").first()).toBeVisible({ timeout: 20_000 });

    await flag(request, "about_page", false);
    expect((await readFlagFromDb("about_page")).enabled).toBe(false);
    await page.goto("/");
    await expect(navButton(page, "Início").first()).toBeVisible({ timeout: 20_000 });
    await expect(navButton(page, "Sobre")).toHaveCount(0);

    await flag(request, "about_page", true);
    await page.goto("/");
    await expect(navButton(page, "Sobre").first()).toBeVisible({ timeout: 20_000 });
  });

  test("[app-shell.get.menu-publico#so-lider] events_section só para líder: membro não vê o item nem chama a API; líder vê", async ({
    page,
    request,
  }) => {
    await flag(request, "events_section", true, ["leader"]);
    expect(await readFlagFromDb("events_section")).toEqual({ enabled: true, targetRoles: ["leader"] });

    const asMember = await request.get(`${API_URL}/events`, { headers: authHeaders((sessions.member as LoginResult).accessToken) });
    expect(asMember.status()).toBe(403);
    expect(JSON.stringify(await asMember.json())).toContain("FEATURE_DISABLED");
    const asLeader = await request.get(`${API_URL}/events`, { headers: authHeaders((sessions.leader as LoginResult).accessToken) });
    expect(asLeader.status()).toBe(200);

    await loginPage(page, "member");
    await page.goto("/");
    await expect(navButton(page, "Início").first()).toBeVisible({ timeout: 20_000 });
    await expect(navButton(page, "Eventos")).toHaveCount(0);

    const leaderPage = await page.context().browser()?.newContext();
    if (!leaderPage) throw new Error("sem navegador para o contexto do líder");
    try {
      const lp = await leaderPage.newPage();
      await lp.addInitScript((s) => {
        window.localStorage.setItem("accessToken", s.accessToken);
        window.localStorage.setItem("refreshToken", s.refreshToken);
      }, sessions.leader as LoginResult);
      await lp.goto("/");
      await expect(navButton(lp, "Eventos").first()).toBeVisible({ timeout: 20_000 });
    } finally {
      await leaderPage.close();
    }
  });

  test("[app-shell.get.menu-publico#mobile] @mobile no celular o menu público abre em gaveta, sem rolagem horizontal e com alvos de 44 px", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Abrir menu" });
    await expect(toggle).toBeVisible({ timeout: 20_000 });
    await expectTouchTarget(toggle);
    await toggle.click();
    const drawer = page.getByRole("presentation").filter({ has: page.getByRole("button", { name: "Início", exact: true }) }).first();
    for (const name of ["Início", "Sobre", "Contato"]) {
      const item = drawer.getByRole("button", { name, exact: true });
      await expect(item).toBeVisible();
      await expectTouchTarget(item);
    }
    await expectTouchTarget(drawer.getByRole("button", { name: "Entrar" }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("[app-shell.get.menu-usuario#membro] membro vê Área do Membro, Área dos Acolhidos e Meu Perfil, sem Administração", async ({ page }) => {
    await loginPage(page, "member");
    await page.goto("/");
    await openUserMenu(page);
    await expect(page.getByTestId(userMenuTestId("member-area"))).toBeVisible();
    await expect(page.getByTestId(userMenuTestId("sheltered-area"))).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Meu Perfil" })).toBeVisible();
    await expect(page.getByTestId(userMenuTestId("admin-area"))).toHaveCount(0);
  });

  test("[app-shell.get.menu-usuario#lider] líder vê as quatro entradas", async ({ page }) => {
    await loginPage(page, "leader");
    await page.goto("/");
    await openUserMenu(page);
    await expect(page.getByTestId(userMenuTestId("member-area"))).toBeVisible();
    await expect(page.getByTestId(userMenuTestId("sheltered-area"))).toBeVisible();
    await expect(page.getByTestId(userMenuTestId("admin-area"))).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Meu Perfil" })).toBeVisible();
    await page.getByTestId(userMenuTestId("admin-area")).click();
    await expect(page).toHaveURL(/\/adm$/);
  });

  test("[app-shell.get.menu-usuario#admin] admin vê Área do Membro e Administração, sem Área dos Acolhidos", async ({ page }) => {
    await loginPage(page, "admin");
    await page.goto("/");
    await openUserMenu(page);
    await expect(page.getByTestId(userMenuTestId("member-area"))).toBeVisible();
    await expect(page.getByTestId(userMenuTestId("admin-area"))).toBeVisible();
    await expect(page.getByTestId(userMenuTestId("sheltered-area"))).toHaveCount(0);
  });

  test("[app-shell.get.menu-usuario#flag-desligada] com member_area e sheltered_area desligadas as entradas somem do menu", async ({
    page,
    request,
  }) => {
    await flag(request, "member_area", false);
    await flag(request, "sheltered_area", false);
    expect((await readFlagFromDb("member_area")).enabled).toBe(false);
    expect((await readFlagFromDb("sheltered_area")).enabled).toBe(false);

    await loginPage(page, "member");
    await page.goto("/");
    await openUserMenu(page);
    await expect(page.getByRole("menuitem", { name: "Meu Perfil" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(userMenuTestId("member-area"))).toHaveCount(0);
    await expect(page.getByTestId(userMenuTestId("sheltered-area"))).toHaveCount(0);

    // a URL direta também fecha: a rota sai da Área do Membro
    await page.goto("/area-do-membro");
    await expect(page).not.toHaveURL(/\/area-do-membro$/);
  });

  test("[app-shell.get.menu-usuario#mobile] @mobile no celular o menu do usuário na gaveta tem alvos de 44 px e some a Administração para o membro", async ({
    page,
  }) => {
    await loginPage(page, "member");
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const memberArea = page.getByTestId(mobileMenuTestId("member-area"));
    await expect(memberArea).toBeVisible({ timeout: 20_000 });
    await expectTouchTarget(memberArea);
    await expectTouchTarget(page.getByTestId(mobileMenuTestId("sheltered-area")));
    await expect(page.getByTestId(mobileMenuTestId("admin-area"))).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("[app-shell.get.menu-admin#perfil-indevido] membro e visitante não chegam ao painel; líder chega", async ({ page }) => {
    await page.goto("/adm");
    await expect(page.getByTestId("login-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-layout")).toHaveCount(0);

    await loginPage(page, "member");
    await page.goto("/adm");
    // membro é redirecionado para a Home (ProtectedRoute); nunca vê o painel
    await expect(page).toHaveURL(/localhost:\d+\/$/, { timeout: 20_000 });
    await expect(page.getByTestId("admin-layout")).toHaveCount(0);
    await expect(page.getByTestId("admin-dashboard")).toHaveCount(0);

    await loginPage(page, "leader");
    await page.goto("/adm");
    await expect(page.getByTestId("admin-layout")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-sidebar-item-members")).toHaveCount(1);
    await expect(page.getByTestId("admin-sidebar-item-users")).toHaveCount(0);
  });

  test("[app-shell.get.menu-admin#flag-desligada] com pagelas desligada o item Pagelas some do painel; a API fecha e o banco não muda", async ({
    page,
    request,
  }) => {
    await loginPage(page, "admin");
    await page.goto("/adm");
    await expect(page.getByTestId("admin-sidebar-item-pagelas")).toHaveCount(1, { timeout: 20_000 });

    await flag(request, "pagelas", false);
    await flag(request, "sheltered_area", false);
    expect((await readFlagFromDb("pagelas")).enabled).toBe(false);
    await page.goto("/adm");
    await expect(page.getByTestId("admin-layout")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-sidebar-item-pagelas")).toHaveCount(0);

    const res = await request.get(`${API_URL}/pagelas`, { headers: authHeaders(adminToken) });
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect((await readFlagFromDb("pagelas")).enabled).toBe(false);
  });

  test("[app-shell.get.menu-admin#selo-pendencias] o item Fotos dos Abrigos (selo de pendências) continua no menu do painel", async ({ page }) => {
    await loginPage(page, "admin");
    await page.goto("/adm");
    await expect(page.getByTestId("admin-layout")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-sidebar-item-shelter-photos")).toHaveCount(1);
    await expect(page.getByTestId("admin-sidebar-item-feed-comments")).toHaveCount(1);
  });

  test("[app-shell.get.menu-admin#mobile] @mobile no celular a gaveta do painel abre, filtra por seção, sem rolagem horizontal e com alvos de 44 px", async ({
    page,
  }) => {
    await loginPage(page, "admin");
    await page.goto("/adm");
    const open = page.getByTestId("admin-sidebar-open");
    await expect(open).toBeVisible({ timeout: 20_000 });
    await expectTouchTarget(open);
    await open.click();
    await expect(page.getByTestId("admin-sidebar")).toBeVisible();
    const filters = page.locator('[data-testid^="admin-sidebar-filter-"]');
    expect(await filters.count()).toBeGreaterThan(1);
    for (let i = 0; i < (await filters.count()); i++) await expectTouchTarget(filters.nth(i));
    await page.getByTestId("admin-sidebar-filter-people").click();
    await expect(page.getByTestId("admin-sidebar-group-people")).toBeVisible();
    await expect(page.getByTestId("admin-sidebar-group-communication")).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("[app-shell.get.flags#estado-restaurado] ao final o banco tem as flags exatamente como estavam", async ({ request }) => {
    await restoreFlags(request, adminToken, original);
    for (const key of Object.keys(original) as ShellFlag[]) expect(await readFlagFromDb(key)).toEqual(original[key]);
  });
});
