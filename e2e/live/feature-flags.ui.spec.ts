import { API_URL } from "../../playwright.live.config";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
} from "./support/live";

/**
 * Painel de feature flags contra a pilha real.
 *
 * O painel é o caminho usado para **religar** recursos, então ele nunca é
 * protegido por uma flag — e é justamente por isso que uma regressão aqui é
 * difícil de reverter: sem o painel, não há como ligar nada de volta.
 */
const RUN_TAG = `e2e-flag-${Date.now()}`;
const FLAG_KEY = `${RUN_TAG}`;

type FeatureFlag = { id: string; key: string; enabled: boolean };

test.describe.serial("Feature flags — UI ao vivo", () => {
  let token: string;
  let created: FeatureFlag | null = null;

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    if (created) {
      await request.delete(`${API_URL}/feature-flags/${created.key}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("o mapa público não expõe as flags operacionais de e-mail", async ({
    request,
  }) => {
    // Sem token de propósito: a rota é pública.
    const response = await request.get(`${API_URL}/feature-flags/map`);

    expect(response.status()).toBe(200);
    const map = (await response.json()) as Record<string, boolean>;
    const keys = Object.keys(map);

    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((key) => key.startsWith("email-"))).toEqual([]);
    // O visitante anônimo não descobre o estado do envio de e-mail.
    expect(map).not.toHaveProperty("email-delivery");
  });

  test("a flag legada de eventos foi aposentada", async ({ request }) => {
    const response = await request.get(
      `${API_URL}/feature-flags/event-email-notifications`,
      { headers: authHeaders(token) },
    );

    expect(response.status()).toBe(404);
  });

  test("o catálogo administrativo continua listando as flags de e-mail", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/feature-flags?limit=100`, {
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { data: FeatureFlag[] };
    const keys = body.data.map((flag) => flag.key);

    // Invisíveis no mapa público, mas administráveis pelo painel.
    expect(keys).toContain("email-delivery");
    expect(keys).toContain("email-password-reset");
  });

  test("o painel abre para admin e lista as flags do banco", async ({
    page,
    request,
  }) => {
    const session = await loginAs(request, "admin");
    await seedBrowserSession(page, session);

    await page.goto("/adm/feature-flags");

    await expect(page.getByTestId("feature-flags-page")).toBeVisible();
    await expect(page.getByTestId("feature-flags-list")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("criar uma flag pelo painel persiste na API", async ({
    page,
    request,
  }) => {
    const session = await loginAs(request, "admin");
    await seedBrowserSession(page, session);
    await page.goto("/adm/feature-flags");
    await expect(page.getByTestId("feature-flags-list")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("feature-flags-create").click();
    const dialog = page.getByTestId("feature-flags-form-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/chave/i).fill(FLAG_KEY);
    await dialog.getByLabel(/nome/i).first().fill(`Flag ${RUN_TAG}`);
    await page.getByTestId("feature-flags-form-submit").click();

    await expect(dialog).toBeHidden({ timeout: 15_000 });

    // A prova é a API, não a tela.
    const response = await request.get(`${API_URL}/feature-flags/${FLAG_KEY}`, {
      headers: authHeaders(token),
    });
    expect(response.status()).toBe(200);
    created = (await response.json()) as FeatureFlag;
    expect(created.key).toBe(FLAG_KEY);
  });

  test("alternar pelo painel muda o estado na API", async ({
    page,
    request,
  }) => {
    expect(created, "a flag do cenário anterior deveria existir").not.toBeNull();
    const flag = created!;

    const session = await loginAs(request, "admin");
    await seedBrowserSession(page, session);
    await page.goto("/adm/feature-flags");
    await expect(page.getByTestId("feature-flags-list")).toBeVisible({
      timeout: 15_000,
    });

    // A lista é paginada pela API: sem buscar, a flag recém-criada pode cair
    // em outra página e o cartão nem existir no DOM.
    await page.getByTestId("feature-flags-search").fill(flag.key);
    const toggle = page.getByTestId(`feature-flags-card-toggle-${flag.id}`);
    await expect(toggle).toBeVisible({ timeout: 15_000 });

    const before = flag.enabled;
    await toggle.click();

    await expect
      .poll(
        async () => {
          const response = await request.get(
            `${API_URL}/feature-flags/${flag.key}`,
            { headers: authHeaders(token) },
          );
          return ((await response.json()) as FeatureFlag).enabled;
        },
        { timeout: 15_000 },
      )
      .toBe(!before);
  });

  test("membro não alcança o painel", async ({ page, request }) => {
    const member = await loginAs(request, "member");
    await seedBrowserSession(page, member);

    await page.goto("/adm/feature-flags");

    await expect(page.getByTestId("feature-flags-page")).toHaveCount(0);
  });
});
