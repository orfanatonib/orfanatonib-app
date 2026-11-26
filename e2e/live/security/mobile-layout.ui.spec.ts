import { seedContact, seedDocument, seedShelter, type Undo } from "../support/baseline";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Mobile-first (375×812): as telas principais não podem rolar na horizontal
 * e o conteúdo precisa caber na largura da viewport. Dados criados pela API e removidos no fim.
 */
const PUBLIC_PAGES = ["/", "/contato", "/login"];
const ADMIN_PAGES = ["/adm/contatos", "/adm/abrigos", "/adm/documentos", "/adm/equipes"];

async function expectNoHorizontalScroll(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `largura ${scrollWidth} > viewport ${innerWidth}`).toBeLessThanOrEqual(innerWidth + 1);
}

test.describe("Layout mobile @mobile", () => {
  const undos: Undo[] = [];
  test.beforeAll(async ({ request }) => {
    const tag = `e2e-mobile-${Date.now()}`;
    undos.push(await seedContact(request, tag), await seedDocument(request, tag), await seedShelter(request, tag));
  });
  test.afterAll(async ({ request }) => {
    for (const undo of undos.reverse()) await undo(request);
  });

  for (const path of PUBLIC_PAGES) {
    test(`@mobile página pública ${path} não rola na horizontal`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    });
  }

  for (const path of ADMIN_PAGES) {
    test(`@mobile painel ${path} não rola na horizontal (cartões, sem tabela larga)`, async ({ page, request }) => {
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    });
  }
});
