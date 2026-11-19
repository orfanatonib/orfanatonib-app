import { closeDb, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { PUBLICATION_FLAGS, cleanupPackages, createReadyPackage, getPackage, setFlag } from "./publication.fixtures";

/**
 * Botão "Publicar no site" na página do material (`/adm/estudio/pacotes/:id`): só com o material pronto e a flag de
 * publicação ligada; diálogo com testamento e aviso; sucesso com link da página; material fica "Publicado". Inclui celular.
 */
const before: Record<string, number> = {};
const created: string[] = [];
let admin = "";

test.describe.serial("Estúdio — publicar no site (UI)", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const flag of PUBLICATION_FLAGS) {
      before[flag] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [flag]))?.enabled ?? 0;
      await setFlag(request, admin, flag, true);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupPackages(request, admin, created);
    for (const flag of PUBLICATION_FLAGS) await setFlag(request, admin, flag, before[flag] === 1);
    await closeDb();
  });

  test("publica pelo diálogo, mostra o link da página e marca o material como Publicado", async ({ page, request }) => {
    test.setTimeout(100_000);
    const pkg = await createReadyPackage(request, admin, "ui", created);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${pkg.id}`);

    const button = page.getByTestId("content-studio-publish-button");
    await expect(button).toBeVisible({ timeout: 20_000 });
    await expect(button).toHaveText("Publicar no site");
    await button.click();

    const dialog = page.getByTestId("content-studio-publish-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("página em Materiais para Visita");
    await expect(page.getByTestId("content-studio-publish-testament-OLD_TESTAMENT").locator("input")).toBeChecked();
    await page.getByTestId("content-studio-publish-testament-NEW_TESTAMENT").click();
    await page.getByTestId("content-studio-publish-confirm").click();

    const link = page.getByTestId("content-studio-publication-link");
    await expect(link).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("content-studio-publication-result")).toContainText("publicado no site");
    await expect(page.getByTestId("content-studio-publish-button")).toHaveCount(0);
    await expect(page.getByTestId("content-studio-production-header")).toContainText("Publicado");

    const row = await queryOne<{ testament: string; path: string }>(
      "SELECT p.testament AS testament, r.path AS path FROM visit_material_pages p JOIN routes r ON r.id = p.routeId WHERE p.sourceLessonId = ?",
      [pkg.id],
    );
    expect(row?.testament).toBe("NEW_TESTAMENT");
    expect(await link.getAttribute("href")).toBe(`/${row?.path}`);
    expect((await getPackage(request, admin, pkg.id)).status).toBe("PUBLISHED");

    // Ao reabrir o material já publicado, o link continua disponível.
    await page.reload();
    await expect(page.getByTestId("content-studio-publication-link")).toBeVisible({ timeout: 20_000 });
  });

  test("sem a flag de publicação o botão não aparece", async ({ page, request }) => {
    test.setTimeout(100_000);
    const pkg = await createReadyPackage(request, admin, "ui-flag", created);
    await setFlag(request, admin, "content_studio_publication", false);
    try {
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.goto(`/adm/estudio/pacotes/${pkg.id}`);
      await expect(page.getByTestId("content-studio-production-header")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("content-studio-publish-button")).toHaveCount(0);
    } finally {
      await setFlag(request, admin, "content_studio_publication", true);
    }
  });

  test("celular 375px: botão e diálogo cabem, sem rolagem lateral e com alvos de 44px", async ({ page, request }) => {
    test.setTimeout(100_000);
    const pkg = await createReadyPackage(request, admin, "ui-mobile", created);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/adm/estudio/pacotes/${pkg.id}`);
    const button = page.getByTestId("content-studio-publish-button");
    await expect(button).toBeVisible({ timeout: 20_000 });
    expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

    await button.click();
    const dialog = page.getByTestId("content-studio-publish-dialog");
    await expect(dialog).toBeVisible();
    for (const id of ["content-studio-publish-confirm", "content-studio-publish-cancel", "content-studio-publish-testament-OLD_TESTAMENT", "content-studio-publish-testament-NEW_TESTAMENT"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
      expect((box?.x ?? -1) + (box?.width ?? 0), id).toBeLessThanOrEqual(375);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByTestId("content-studio-publish-cancel").click();
    await expect(dialog).toBeHidden();
  });
});
