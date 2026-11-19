import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/** Na tela, a geração é acompanhada pelo stream SSE: o navegador abre `.../generations/stream` e a tela termina em sucesso ou erro. */
const FLAGS = ["content_studio", "content_studio_generation"] as const;
const before: Record<string, number> = {};
let admin = "";
let packageId = "";

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
  const res = await request.post(`${API_URL}/content-studio/packages`, {
    headers: authHeaders(admin),
    data: { theme: `e2e-sse-ui ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
  });
  packageId = ((await res.json()) as { id: string }).id;
});

test.afterAll(async ({ request }) => {
  if (packageId) await request.post(`${API_URL}/content-studio/packages/${packageId}/archive`, { headers: authHeaders(admin) });
  for (const key of FLAGS) {
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  }
  await closeDb();
});

test("gerar na tela abre o stream SSE e a etapa termina (conteúdo gerado ou erro explicado)", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto(`/adm/estudio/pacotes/${packageId}?audience=CHILD`);
  await expect(page.getByTestId("content-studio-generate-stage")).toBeVisible({ timeout: 20_000 });

  const streamRequest = page.waitForRequest((req) => req.url().includes(`/packages/${packageId}/generations/stream`), { timeout: 30_000 });
  await page.getByTestId("content-studio-generate-stage").click();
  await streamRequest;

  // Termina sem precisar recarregar: aparece o conteúdo (aba Documento/Campos) ou a mensagem de erro do job.
  await expect(page.getByTestId("content-studio-generation-error").or(page.getByText("Conteúdo gerado. Revise antes de seguir."))).toBeVisible({
    timeout: 45_000,
  });
});
