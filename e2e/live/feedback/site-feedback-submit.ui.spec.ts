import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Envio real da avaliação do site pela tela (membro). Antes o formulário mandava
 * `createdAt`/`updatedAt`/`published` e a API (que recusa campo desconhecido) devolvia 400:
 * a pessoa sempre via "Erro ao enviar feedback". O teste prova a linha no banco e limpa depois.
 */
const COMMENT = `Avaliação e2e ${Date.now()}`;

test.afterAll(async () => closeDb());

test("[site-feedback.post.site-feedbacks#feliz] membro envia a avaliação pela tela e a linha existe no banco", async ({
  page,
  request,
}) => {
  const before = await countRows("site_feedbacks");
  await seedBrowserSession(page, await loginAs(request, "member"));
  await page.goto("/area-do-membro/avaliar-site");

  await page.getByTestId("site-feedback-name").fill("Membro E2E");
  await page.getByTestId("site-feedback-rating").locator("label").nth(4).click();
  await page.getByTestId("site-feedback-category").click();
  await page.getByRole("option").first().click();
  await page.getByTestId("site-feedback-comment").fill(COMMENT);
  await page.getByTestId("site-feedback-submit").click();

  await expect(page.getByTestId("site-feedback-success")).toBeVisible({ timeout: 20_000 });
  expect(await countRows("site_feedbacks")).toBe(before + 1);

  const row = await queryOne<{ id: string }>("SELECT id FROM site_feedbacks WHERE comment = ?", [COMMENT]);
  expect(row).toBeTruthy();
  const admin = (await loginAs(request, "admin")).accessToken;
  await request.delete(`${API_URL}/site-feedbacks/${row!.id}`, { headers: authHeaders(admin) });
  expect(await countRows("site_feedbacks")).toBe(before);
});
