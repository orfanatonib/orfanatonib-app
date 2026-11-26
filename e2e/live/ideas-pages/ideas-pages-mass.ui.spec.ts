import { closeDb } from "../support/db";
import { tagged } from "../support/factory";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { pageRow, routeRows, sectionRows } from "./support";

/**
 * Massa (regra do E2E): toda execução cria de 5 a 10 páginas de ideias PELA TELA do criador, cada uma com uma seção.
 * Ficam no banco e acumulam; a prova é o SELECT (página, seção e rota) e a listagem filtrada pela tag.
 */
test.describe.serial("Páginas de ideias — massa por execução (UI ao vivo)", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("cria de 5 a 10 páginas pelo criador e elas aparecem na lista", async ({ page, request }) => {
    const total = massCount();
    test.setTimeout(60_000 + total * 40_000);

    for (let n = 1; n <= total; n += 1) {
      // O app rotaciona o refresh token; cada volta semeia uma sessão nova (o init script reaplica as chaves a cada navegação).
      await seedBrowserSession(page, await loginAs(request, "admin"));
      const title = tagged(`massa-ideias-${String(n).padStart(2, "0")}`);
      await page.goto("/adm/criar-pagina");
      await page.getByTestId("page-template-card-ideas").click();
      await page.getByRole("textbox", { name: /Título da Página/ }).fill(title);
      await page.getByRole("textbox", { name: /Descrição da Página/ }).fill(`Página de massa ${n} de ${total}`);
      await page.getByTestId("ideas-page-creator-add-section").click();
      await page.getByTestId("ideas-material-title").fill(`Seção de ${title}`);
      await page.getByTestId("ideas-material-description").fill("Seção de massa");

      const posted = page.waitForResponse((r) => r.url().endsWith("/ideas-pages") && r.request().method() === "POST");
      await page.getByTestId("ideas-page-creator-save").click();
      const response = await posted;
      expect(response.status(), await response.text()).toBe(201);
      const body = (await response.json()) as { id: string };
      expect((await pageRow(body.id))?.title).toBe(title);
      expect(await sectionRows(body.id)).toHaveLength(1);
      expect(await routeRows(body.id)).toHaveLength(1);
    }

    await page.goto("/adm/paginas-ideias");
    await expect(page.getByTestId("ideas-pages-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("ideas-pages-toolbar-search").fill(tagged("massa-ideias"));
    await expect(page.getByTestId("ideas-pages-pagination-summary")).toHaveText(new RegExp(`^1–${Math.min(12, total)} de ${total}$`));
  });
});
