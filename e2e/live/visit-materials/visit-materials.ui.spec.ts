import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { RUN_TAG } from "../support/factory";

test.describe.serial("Gerenciamento de Materiais de Visita — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/paginas-materiais-visita", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-materiais-visita");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("visit-materials-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("visit-materials-toolbar")).toBeVisible();
  });

  test("2. Navegação para a lista de materiais de visita na Área do Membro", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/area-do-membro/materiais-visita");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });

  test("3. Clicar em um material abre /area-do-membro/materiais-visita/:id dentro da casca", async ({
    page,
    request,
  }) => {
    const admin = await loginAs(request, "admin");
    const title = `Material UI ${RUN_TAG}`;
    const created = await request.post(`${API_URL}/visit-material-pages`, {
      headers: authHeaders(admin.accessToken),
      multipart: {
        visitMaterialsPageData: JSON.stringify({
          pageTitle: title,
          pageSubtitle: "Subtítulo do cenário",
          pageDescription: "Criado pelo cenário",
          testament: "OLD_TESTAMENT",
          videos: [
            {
              title: "Vídeo do cenário",
              description: "Descrição",
              uploadType: "link",
              mediaType: "video",
              isLocalFile: false,
              url: "https://youtu.be/xyz",
              platformType: "youtube",
            },
          ],
        }),
      },
    });
    expect(created.status()).toBe(201);
    const material = (await created.json()) as { id: string; route: { path: string } };

    try {
      await seedBrowserSession(page, await loginAs(request, "member"));
      await page.goto("/area-do-membro/materiais-visita");
      await page.getByLabel("Buscar materiais").fill(title);
      await page.getByTestId("visit-material-member-card-open").first().click();

      await expect(page).toHaveURL(new RegExp(`/area-do-membro/materiais-visita/${material.id}$`));
      await expect(page.getByTestId("visit-material-page")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
      await expect(page.getByTestId("member-nav-materials")).toHaveAttribute("aria-current", "page");

      // O endereço antigo por slug leva ao novo.
      await page.goto(`/${material.route.path}`);
      await expect(page).toHaveURL(new RegExp(`/area-do-membro/materiais-visita/${material.id}$`), {
        timeout: 20_000,
      });
    } finally {
      await request.delete(`${API_URL}/visit-material-pages/${material.id}`, {
        headers: authHeaders(admin.accessToken),
      });
    }
  });
});
