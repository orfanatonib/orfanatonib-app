import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Controle de Acesso RBAC e Responsividade Mobile — Teste E2E", () => {
  test("1. Membro comum é bloqueado/redirecionado ao tentar acessar rotas administrativas (/adm/*)", async ({
    page,
    request,
  }) => {
    // Autentica com papel de membro comum (sem privilégios admin/leader)
    const memberResult = await loginAs(request, "member");
    await seedBrowserSession(page, memberResult);

    // Tenta acessar rota /adm/abrigos
    await page.goto("/adm/abrigos");
    await page.waitForLoadState("networkidle");
    await page.waitForURL((url) => !url.pathname.includes("/adm/abrigos"), { timeout: 10_000 }).catch(() => {});

    // Deve ser redirecionado para a home ou ter o acesso negado
    const url = page.url();
    const isAccessDeniedOrRedirected =
      !url.includes("/adm/abrigos") || (await page.getByTestId("access-denied-message").isVisible());
    expect(isAccessDeniedOrRedirected).toBe(true);
  });

  test("2. Usuário não autenticado é redirecionado para /login ao tentar acessar rotas protegidas", async ({
    page,
  }) => {
    // Garante sessão limpa no navegador
    await page.goto("/area-do-membro");
    await page.waitForLoadState("networkidle");

    // Deve redirecionar para /login ou exibir a tela de login
    await expect(page).toHaveURL(/.*login/, { timeout: 10_000 });
  });

  test("3. Responsividade Mobile: Renderização correta em viewport mobile (375x812)", async ({
    page,
    request,
  }) => {
    // Define o viewport para dispositivo móvel (iPhone)
    await page.setViewportSize({ width: 375, height: 812 });

    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm");
    await page.waitForLoadState("networkidle");

    // Verifica se a aplicação renderizou a estrutura raiz sem quebrarmos o layout
    await expect(page.getByTestId("app-root")).toBeVisible();

    // Verifica que não há barra de rolagem horizontal indesejada no body
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
