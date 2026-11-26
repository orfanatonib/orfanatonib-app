import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe("Área do Membro: sidebar nas páginas e subpáginas", () => {
  test("desktop: sidebar na Home, navega para subpágina mantendo a casca e recolhe", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/area-do-membro");
    await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
    await expect(page.getByTestId("member-nav-overview")).toHaveAttribute("aria-current", "page");

    await page.getByTestId("member-nav-materials").click();
    await expect(page).toHaveURL(/\/area-do-membro\/materiais-visita$/);
    await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
    await expect(page.getByTestId("member-nav-materials")).toHaveAttribute("aria-current", "page");

    await page.getByTestId("member-nav-share-idea").click();
    await expect(page).toHaveURL(/\/area-do-membro\/compartilhar-ideia$/);
    await expect(page.getByTestId("member-area-sidebar")).toBeVisible();

    await page.getByTestId("member-area-sidebar-toggle").click();
    await expect(page.getByTestId("member-area-sidebar-title")).toHaveCount(0);
    await expect(page.getByTestId("member-area-sidebar-toggle")).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile: barra de abas no lugar da sidebar, sem rolagem horizontal da página", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/area-do-membro");
    await expect(page.getByTestId("member-area-sidebar-mobile")).toBeVisible();
    await expect(page.getByTestId("member-area-sidebar")).toHaveCount(0);

    await page.getByTestId("member-nav-manual").click();
    await expect(page).toHaveURL(/\/area-do-membro\/manual$/);
    await expect(page.getByTestId("member-area-sidebar-mobile")).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("itens restritos: membro comum não vê Integrações FM; Ajuda, Eventos e Acolhidos ficam fora do menu", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/area-do-membro");
    await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
    await expect(page.getByTestId("member-nav-integrations")).toHaveCount(0);
    await expect(page.getByTestId("member-nav-help")).toHaveCount(0);
    await expect(page.getByTestId("member-nav-events")).toHaveCount(0);
    await expect(page.getByTestId("member-nav-sheltered")).toHaveCount(0);
    await expect(page.getByTestId("member-area-home-help")).toBeVisible();
  });

  test("casca fixa: o cabeçalho não muda de posição ao trocar de subpágina; a Home não repete as subpáginas", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/area-do-membro");
    await expect(page.getByTestId("member-area-home")).toBeVisible();
    // Documentos, ideias e vídeos viraram subpáginas: não renderizam mais na Home,
    // e a Home monta o próprio topo (sem o cabeçalho padrão de página).
    await expect(page.getByTestId("member-documents-page")).toHaveCount(0);
    await expect(page.getByTestId("member-page-header")).toHaveCount(0);

    const header = page.getByTestId("member-area-header");
    const homeBox = await header.boundingBox();

    for (const [navId, pageId, urlPart] of [
      ["documents", "member-documents-page", /\/area-do-membro\/documentos$/],
      ["ideas", "member-ideas-page", /\/area-do-membro\/ideias$/],
      ["videos", "member-videos-page", /\/area-do-membro\/videos$/],
    ] as const) {
      await page.getByTestId(`member-nav-${navId}`).click();
      await expect(page).toHaveURL(urlPart);
      await expect(page.getByTestId(pageId)).toBeVisible();
      await expect(page.getByTestId(`member-nav-${navId}`)).toHaveAttribute("aria-current", "page");
      // Cabeçalho de página vem da casca (não da subpágina) e a galeria usa o mesmo cartão.
      await expect(page.getByTestId("member-page-header")).toBeVisible();
      await expect(page.getByTestId(`member-${navId}-gallery`)).toBeVisible();
      const box = await header.boundingBox();
      expect(box?.y).toBe(homeBox?.y);
      expect(box?.height).toBe(homeBox?.height);
    }
  });
});
