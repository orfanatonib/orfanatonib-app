import { buildSheltered } from "../fixtures/sheltered.fixtures";
import { expect, test } from "../support/test";

test.describe("Acolhidos — listagem", () => {
  test("renderiza a tabela com os acolhidos devolvidos pela API", async ({
    page,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await expect(page.getByTestId("sheltered-table")).toBeVisible();
    await expect(page.getByTestId("sheltered-row-sheltered-1")).toContainText(
      "Maria Silva",
    );
    await expect(page.getByTestId("sheltered-row-sheltered-2")).toContainText(
      "João Pereira",
    );
    // Sem abrigo vinculado a coluna mostra o chip de vazio, não um erro.
    await expect(page.getByTestId("sheltered-row-sheltered-3")).toContainText("—");
  });

  test("pede a primeira página com os defaults documentados", async ({
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    const query = api.lastListQuery();
    expect(query?.get("page")).toBe("1");
    expect(query?.get("limit")).toBe("12");
    expect(query?.get("orderBy")).toBe("updatedAt");
    expect(query?.get("order")).toBe("DESC");
  });

  test("envia a busca geral como searchString, nunca como chave legada", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-filter-search").locator("input").fill("Maria");
    await expect
      .poll(() => api.lastListQuery()?.get("searchString"))
      .toBe("Maria");

    const query = api.lastListQuery();
    // Regressão: estas chaves não existem no QueryShelteredDto e, com
    // forbidNonWhitelisted, derrubavam a listagem inteira com 400.
    expect(query?.has("shelteredSearchingString")).toBe(false);
    expect(query?.has("shelterName")).toBe(false);
    expect(query?.has("city")).toBe(false);
    expect(query?.has("state")).toBe(false);
  });

  test("envia apenas os filtros preenchidos", async ({ page, api, gotoSheltered }) => {
    await gotoSheltered();

    await page
      .getByTestId("sheltered-filter-shelter")
      .locator("input")
      .fill("Esperança");
    await expect
      .poll(() => api.lastListQuery()?.get("shelterSearchingString"))
      .toBe("Esperança");

    const query = api.lastListQuery();
    expect(query?.has("addressFilter")).toBe(false);
    expect(query?.has("gender")).toBe(false);
  });

  test("aplica o filtro de gênero pelo enum do domínio", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-filter-gender").click();
    await page.getByTestId("sheltered-filter-gender-female").click();

    await expect.poll(() => api.lastListQuery()?.get("gender")).toBe("F");
  });

  test("ordena por uma coluna da allowlist e volta para a primeira página", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-sort-name").click();

    await expect.poll(() => api.lastListQuery()?.get("orderBy")).toBe("name");
    expect(api.lastListQuery()?.get("order")).toBe("ASC");
    expect(api.lastListQuery()?.get("page")).toBe("1");
  });

  test("limpa todos os filtros de uma vez", async ({ page, api, gotoSheltered }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-filter-search").locator("input").fill("Maria");
    await expect.poll(() => api.lastListQuery()?.get("searchString")).toBe("Maria");

    await page.getByTestId("sheltered-clear-filters").click();

    await expect.poll(() => api.lastListQuery()?.has("searchString")).toBe(false);
    await expect(page.getByTestId("sheltered-clear-filters")).toBeHidden();
  });

  test("mostra o estado vazio quando a busca não retorna nada", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    api.setShelteredList([]);
    await gotoSheltered();

    await expect(page.getByTestId("sheltered-empty")).toBeVisible();
    await expect(page.getByTestId("sheltered-table")).toBeHidden();
  });

  test("mostra a mensagem da API quando a listagem falha", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    api.failNext("GET", "/sheltered", 400, "Validation failed");
    await gotoSheltered();

    await expect(page.getByTestId("sheltered-error")).toContainText(
      "Validation failed",
    );
  });

  test("recarrega a lista pelo botão de atualizar", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    const before = api.callsTo("GET", "/sheltered").length;

    api.setShelteredList([buildSheltered({ id: "sheltered-9", name: "Novo Acolhido" })]);
    await page.getByTestId("sheltered-refresh").click();

    await expect(page.getByTestId("sheltered-row-sheltered-9")).toContainText(
      "Novo Acolhido",
    );
    expect(api.callsTo("GET", "/sheltered").length).toBeGreaterThan(before);
  });
});
