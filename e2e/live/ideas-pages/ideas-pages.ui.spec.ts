import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { RUN_TAG } from "../support/factory";

test.describe.serial("Gerenciamento de Páginas de Ideias — Teste E2E Full-Stack", () => {
  test("1. Autenticação e acesso a /adm/paginas-ideias", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-ideias");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("ideas-pages-manager")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("2. Clicar em uma ideia abre /area-do-membro/ideias/:id dentro da casca (95% no desktop, 98% no mobile)", async ({
    page,
    request,
  }) => {
    const admin = await loginAs(request, "admin");
    const title = `Ideia UI ${RUN_TAG}`;
    const created = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(admin.accessToken),
      multipart: {
        ideasMaterialsPageData: JSON.stringify({
          title,
          subtitle: "Subtítulo do cenário",
          description: "Criada pelo cenário",
          public: true,
          sections: [{ title: "Seção do cenário", description: "Descrição", public: true, medias: [] }],
        }),
      },
    });
    expect(created.status()).toBe(201);
    const idea = (await created.json()) as { id: string; route?: { path: string } };

    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      await seedBrowserSession(page, await loginAs(request, "member"));
      await page.goto("/area-do-membro/ideias");
      await page.getByLabel("Buscar ideias").fill(title);
      await page.getByTestId(/^member-ideas-card-/).first().click();

      await expect(page).toHaveURL(new RegExp(`/area-do-membro/ideias/${idea.id}$`));
      await expect(page.getByTestId("ideas-page")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
      await expect(page.getByTestId("member-nav-ideas")).toHaveAttribute("aria-current", "page");

      const frameWidth = async () =>
        page.getByTestId("member-area-frame").evaluate((el) =>
          Math.round((el.getBoundingClientRect().width / window.innerWidth) * 100),
        );
      expect(await frameWidth()).toBe(95);
      await page.setViewportSize({ width: 375, height: 800 });
      await expect.poll(frameWidth).toBe(98);
    } finally {
      await request.delete(`${API_URL}/ideas-pages/${idea.id}`, {
        headers: authHeaders(admin.accessToken),
      });
    }
  });
});
