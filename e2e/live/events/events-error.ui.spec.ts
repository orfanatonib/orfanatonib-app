import { API_URL } from "../../../playwright.live.config";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * A falha ao carregar eventos aparece para a pessoa (antes o `catch` vazio mostrava lista vazia
 * como se não houvesse eventos). A API é interceptada só neste cenário para forçar o 500.
 */
test("falha da API ao listar eventos mostra o aviso de erro, não uma lista vazia silenciosa", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.route(`${API_URL}/events**`, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "falha simulada" }) })
      : route.continue(),
  );
  await page.goto("/eventos");
  await expect(page.getByTestId("events-error")).toBeVisible({ timeout: 20_000 });
});
