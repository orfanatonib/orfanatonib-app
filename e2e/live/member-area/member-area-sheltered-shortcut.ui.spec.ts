import { closeDb } from "../support/db";
import { expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { expectTouchTarget, type FlagSnapshot, readFlagFromDb, restoreFlags, setFlag, snapshotFlags, type ShellFlag } from "../app-shell/support";

/**
 * Atalho "Área dos Acolhidos" na Home da Área do Membro e no menu do usuário: aparece só pela flag
 * `sheltered_area` (que já limita a admin, líder e membro), em todos os papéis. Flag e banco reais.
 */
const ROLES = ["member", "leader", "admin"] as const;
const SHORTCUT = "member-area-action-shelteredArea";
const MENU_ITEM = "shell-user-menu-sheltered-area";

test.describe.serial("Área do Membro — atalho Área dos Acolhidos", () => {
  let adminToken: string;
  let original: Record<ShellFlag, FlagSnapshot>;
  const sessions: Partial<Record<(typeof ROLES)[number], LoginResult>> = {};

  test.beforeAll(async ({ request }) => {
    for (const role of ROLES) sessions[role] = await loginAs(request, role);
    adminToken = (sessions.admin as LoginResult).accessToken;
    original = await snapshotFlags();
  });

  test.beforeEach(async ({ request }) => {
    await restoreFlags(request, adminToken, original);
  });

  test.afterAll(async ({ request }) => {
    await restoreFlags(request, adminToken, original);
    await closeDb();
  });

  for (const role of ROLES) {
    test(`${role}: com a flag ligada o atalho aparece na Home e leva à Área dos Acolhidos`, async ({ page }) => {
      expect((await readFlagFromDb("sheltered_area")).enabled).toBe(true);
      await seedBrowserSession(page, sessions[role] as LoginResult);
      await page.goto("/area-do-membro");
      const shortcut = page.getByTestId(SHORTCUT);
      await expect(shortcut).toBeVisible({ timeout: 20_000 });
      await expect(shortcut).toContainText("Área dos Acolhidos");
      await shortcut.click();
      await expect(page).toHaveURL(/\/area-dos-acolhidos$/);
    });

    test(`${role}: o item "Área dos Acolhidos" está no menu do usuário e leva à mesma tela`, async ({ page }) => {
      await seedBrowserSession(page, sessions[role] as LoginResult);
      await page.goto("/");
      await page.getByRole("button", { name: "Menu do Usuário" }).click();
      await expect(page.getByTestId(MENU_ITEM)).toBeVisible();
      await expect(page.getByTestId("shell-user-menu-member-area")).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Meu Perfil" })).toBeVisible();
      await page.getByTestId(MENU_ITEM).click();
      await expect(page).toHaveURL(/\/area-dos-acolhidos$/);
    });

    test(`${role}: com sheltered_area desligada o atalho e o item do menu somem`, async ({ page, request }) => {
      await setFlag(request, adminToken, "sheltered_area", { enabled: false });
      expect((await readFlagFromDb("sheltered_area")).enabled).toBe(false);
      await seedBrowserSession(page, sessions[role] as LoginResult);
      await page.goto("/area-do-membro");
      await expect(page.getByTestId("member-area-quick-actions")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId(SHORTCUT)).toHaveCount(0);
      await page.getByRole("button", { name: "Menu do Usuário" }).click();
      await expect(page.getByRole("menuitem", { name: "Meu Perfil" })).toBeVisible();
      await expect(page.getByTestId(MENU_ITEM)).toHaveCount(0);
    });
  }

  test("@mobile 375px: o atalho aparece com alvo de toque de 44px e sem rolagem lateral", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await seedBrowserSession(page, sessions.member as LoginResult);
    await page.goto("/area-do-membro");
    const shortcut = page.getByTestId(SHORTCUT);
    await expect(shortcut).toBeVisible({ timeout: 20_000 });
    await expectTouchTarget(shortcut);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
