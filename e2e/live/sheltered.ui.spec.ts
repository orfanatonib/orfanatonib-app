import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "./support/live";

/**
 * Tela de acolhidos contra a pilha real: API NestJS, MySQL e sessão obtida por
 * login de verdade. Nenhuma rota é interceptada — o que a tela mostra veio do
 * banco, e o que ela grava fica gravado.
 */
const RUN_TAG = `e2e${Date.now()}`;
const SHELTERED_NAME = `Acolhido ${RUN_TAG}`;

type Sheltered = { id: string; name: string };

test.describe.serial("Acolhidos — UI ao vivo", () => {
  let token: string;
  let shelterId: string;
  const createdIds: string[] = [];

  const api = (request: import("@playwright/test").APIRequestContext) => ({
    createSheltered: async (name: string): Promise<Sheltered> => {
      const response = await request.post(`${API_URL}/sheltered`, {
        headers: authHeaders(token),
        data: {
          name,
          gender: "F",
          birthDate: "2015-04-02",
          guardianName: "Responsável E2E",
          guardianPhone: "92999990000",
          shelterId,
          address: { city: "Manaus", state: "AM" },
        },
      });
      expect(response.status(), await response.text()).toBe(201);
      const created = (await response.json()) as Sheltered;
      createdIds.push(created.id);
      return created;
    },
    getSheltered: (id: string) =>
      request.get(`${API_URL}/sheltered/${id}`, { headers: authHeaders(token) }),
    listByName: async (name: string): Promise<Sheltered[]> => {
      const response = await request.get(
        `${API_URL}/sheltered?searchString=${encodeURIComponent(name)}&limit=50`,
        { headers: authHeaders(token) },
      );
      return ((await response.json()) as { data: Sheltered[] }).data;
    },
  });

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;

    // Um abrigo real, porque o formulário exige vínculo.
    const response = await request.post(`${API_URL}/shelters`, {
      headers: authHeaders(token),
      multipart: {
        shelterData: JSON.stringify({
          name: `Abrigo ${RUN_TAG}`,
          description: "Abrigo criado pelo e2e",
          teamsQuantity: 1,
          address: { street: "Rua E2E", number: "1", district: "Centro", city: "Manaus", state: "AM", postalCode: "69000000" },
          teams: [{ numberTeam: 1, description: "Equipe e2e" }],
        }),
      },
    });
    expect(response.ok(), await response.text()).toBe(true);
    shelterId = ((await response.json()) as { id: string }).id;
  });

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(token) });
    }
    if (shelterId) {
      await request.delete(`${API_URL}/shelters/${shelterId}`, { headers: authHeaders(token) });
    }
  });

  test("abre a tela autenticada e lista o que está no banco", async ({ page, request }) => {
    const created = await api(request).createSheltered(SHELTERED_NAME);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/acolhidos");
    await page.getByTestId("sheltered-manager").waitFor();

    await page.getByTestId("sheltered-filter-search").locator("input").fill(RUN_TAG);
    await expect(page.getByTestId(`sheltered-row-${created.id}`)).toContainText(
      SHELTERED_NAME,
    );
  });

  test("o filtro consulta a API de verdade e o vazio aparece sem resultado", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/acolhidos");
    await page.getByTestId("sheltered-manager").waitFor();

    await page
      .getByTestId("sheltered-filter-search")
      .locator("input")
      .fill(`inexistente-${RUN_TAG}`);

    await expect(page.getByTestId("sheltered-empty")).toBeVisible();
  });

  test("o detalhe carrega o registro completo da API", async ({ page, request }) => {
    const created = await api(request).createSheltered(`${SHELTERED_NAME} detalhe`);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/acolhidos");
    await page.getByTestId("sheltered-manager").waitFor();
    await page.getByTestId("sheltered-filter-search").locator("input").fill(RUN_TAG);
    await page.getByTestId(`sheltered-row-view-${created.id}`).click();

    await expect(page.getByTestId("sheltered-view-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-view-name")).toHaveText(
      `${SHELTERED_NAME} detalhe`,
    );
    await expect(page.getByTestId("sheltered-view-guardian-name")).toContainText(
      "Responsável E2E",
    );
    // Regressão do link de WhatsApp, agora com o telefone que veio do banco.
    await expect(page.getByTestId("sheltered-view-whatsapp")).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/92999990000\?text=/,
    );
  });

  test("editar pela tela persiste na API", async ({ page, request }) => {
    const created = await api(request).createSheltered(`${SHELTERED_NAME} editar`);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/acolhidos");
    await page.getByTestId("sheltered-manager").waitFor();
    await page.getByTestId("sheltered-filter-search").locator("input").fill(RUN_TAG);
    await page.getByTestId(`sheltered-row-edit-${created.id}`).click();

    const nameInput = page.getByTestId("sheltered-form-name").locator("input");
    await expect(nameInput).toHaveValue(`${SHELTERED_NAME} editar`);
    await nameInput.fill(`${SHELTERED_NAME} renomeado`);
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeHidden();

    // A verdade está no banco, não na tela.
    const stored = await (await api(request).getSheltered(created.id)).json();
    expect(stored.name).toBe(`${SHELTERED_NAME} renomeado`);
  });

  test("excluir pela tela remove o registro de verdade", async ({ page, request }) => {
    const created = await api(request).createSheltered(`${SHELTERED_NAME} excluir`);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/acolhidos");
    await page.getByTestId("sheltered-manager").waitFor();
    await page.getByTestId("sheltered-filter-search").locator("input").fill(RUN_TAG);
    await page.getByTestId(`sheltered-row-delete-${created.id}`).click();

    await expect(page.getByTestId("sheltered-delete-dialog")).toBeVisible();
    await page.getByTestId("sheltered-delete-dialog-confirm").click();
    await expect(page.getByTestId("sheltered-delete-dialog")).toBeHidden();

    expect((await api(request).getSheltered(created.id)).status()).toBe(404);
  });

  test("membro não alcança a rota administrativa", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/adm/acolhidos");

    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
    await expect(page.getByTestId("sheltered-manager")).toBeHidden();
  });
});
