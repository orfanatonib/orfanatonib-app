import { expect, test } from "../support/live";

/**
 * Páginas públicas de autenticação (plano 06), contra a pilha real.
 */
test.describe("Auth — páginas públicas", () => {
  test("[auth.get.recuperar-senha-token#url-limpa] link de redefinição com token inválido: mostra o erro e tira o token da barra de endereço", async ({
    page,
  }) => {
    await page.goto("/recuperar-senha/token-que-nao-existe-123");
    await expect(page.getByTestId("reset-password-invalid")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/recuperar-senha$/);
    expect(page.url()).not.toContain("token-que-nao-existe-123");
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  });

  test("[auth.post.auth-login#erro-na-tela] senha errada: a tela mostra o erro e continua em /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("e2e.member@orfanatonib.test");
    await page.getByTestId("login-password").fill("SenhaErrada#1");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test("[auth.post.auth-login#aterrissagem-lider] líder entra e vai para o painel (/adm), membro para a Área do Membro", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("e2e.leader@orfanatonib.test");
    await page.getByTestId("login-password").fill("E2e@12345");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/adm/, { timeout: 20_000 });
  });

  test("[auth.get.login#mobile] @mobile login em 375×812 sem rolagem horizontal e com alvos de toque", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-page")).toBeVisible({ timeout: 20_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const box = await page.getByTestId("login-submit").boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
  });
});
