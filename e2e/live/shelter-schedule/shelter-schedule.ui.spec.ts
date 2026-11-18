import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Agendamentos / Escala de Visitas — Teste E2E Full-Stack", () => {
  test("1. Autenticação real e carregamento da página /adm/agendamentos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/agendamentos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("shelter-schedule-manager")).toBeVisible({
      timeout: 20_000,
    });
  });
});
