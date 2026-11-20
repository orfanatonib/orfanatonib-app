import { closeDb, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { PUBLICATION_FLAGS, cleanupPackages, createReadyPackage, getPackage, setFlag } from "./publication.fixtures";

/**
 * Publicação na tela de REVISÃO (`/adm/estudio/revisao/:id`): só com categoria aprovada e a flag de publicação ligada;
 * diálogo com as categorias que entram e o testamento (primeira publicação); ao publicar, vai para
 * `/adm/paginas-materiais-visita`. A produção (`/adm/estudio/pacotes/:id`) NÃO publica. Inclui celular.
 */
const before: Record<string, number> = {};
const created: string[] = [];
let admin = "";

test.describe.serial("Estúdio — publicar em Materiais de Visita (UI)", () => {
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

  test("publica pelo diálogo da revisão, vai para Materiais de Visita e a produção não tem o botão", async ({ page, request }) => {
    test.setTimeout(120_000);
    const pkg = await createReadyPackage(request, admin, "ui", created);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    // A produção não publica: nem com o material pronto aparece o botão.
    await page.goto(`/adm/estudio/pacotes/${pkg.id}`);
    await expect(page.getByTestId("content-studio-production-header")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-publish-button")).toHaveCount(0);

    await page.goto(`/adm/estudio/revisao/${pkg.id}`);
    const button = page.getByTestId("content-studio-publish-button");
    await expect(button).toBeVisible({ timeout: 20_000 });
    await expect(button).toHaveText("Publicar");
    await button.click();

    const dialog = page.getByTestId("content-studio-publish-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Materiais de Visita");
    // Primeira publicação: cria a página e pergunta o testamento; mostra quais categorias entram.
    await expect(page.getByTestId("content-studio-publish-categories")).toContainText("Entram agora");
    await expect(page.getByTestId("content-studio-publish-testament-OLD_TESTAMENT").locator("input")).toBeChecked();
    await page.getByTestId("content-studio-publish-testament-NEW_TESTAMENT").click();
    await page.getByTestId("content-studio-publish-confirm").click();

    // Aprovado e publicado: a revisão leva para a lista das páginas de Materiais de Visita.
    await expect(page).toHaveURL(/\/adm\/paginas-materiais-visita/, { timeout: 90_000 });

    const row = await queryOne<{ testament: string }>("SELECT p.testament AS testament FROM visit_material_pages p WHERE p.sourceLessonId = ?", [pkg.id]);
    expect(row?.testament).toBe("NEW_TESTAMENT");
    expect((await getPackage(request, admin, pkg.id)).status).toBe("PUBLISHED");

    // Integração: a página publicada aparece na lista administrativa e na área do membro (pública, com o documento da categoria).
    const theme = String((await getPackage(request, admin, pkg.id)).theme);
    await expect(page.getByText(theme).first()).toBeVisible({ timeout: 30_000 });
    await page.goto("/area-do-membro/materiais-visita");
    await page.getByRole("tab", { name: /novo testamento/i }).first().click();
    await expect(page.getByText(theme).first()).toBeVisible({ timeout: 30_000 });
  });

  test("sem a flag de publicação o botão não aparece na revisão", async ({ page, request }) => {
    test.setTimeout(100_000);
    const pkg = await createReadyPackage(request, admin, "ui-flag", created);
    await setFlag(request, admin, "content_studio_publication", false);
    try {
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.goto(`/adm/estudio/revisao/${pkg.id}`);
      await expect(page.getByTestId("content-studio-review-header")).toBeVisible({ timeout: 20_000 });
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
    await page.goto(`/adm/estudio/revisao/${pkg.id}`);
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
