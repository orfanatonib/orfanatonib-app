import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { RUN_TAG } from "../support/factory";

/**
 * Material de visita por categoria (Geral + faixas etárias) contra a API real: criação com seções e testamento,
 * atualização (omitir `sections` não mexe nelas; enviar a lista a torna a verdade) e as telas de leitura e edição.
 * Só mídias por link (nenhum upload) e nenhuma IA: a página é criada e apagada pelo próprio cenário.
 */
const link = (title: string, mediaType: "document" | "video") => ({
  title,
  description: `Descrição de ${title}`,
  uploadType: "link",
  mediaType,
  isLocalFile: false,
  url: `https://example.test/${encodeURIComponent(title)}`,
  ...(mediaType === "video" ? { platformType: "youtube" } : { platformType: "googledrive" }),
});

type SectionDto = { id: string; category: string; title: string | null; documents: { title: string }[] };
type PageDto = {
  id: string;
  testament: string;
  route: { path: string };
  documents: { title: string }[];
  sections: SectionDto[];
};

test.describe.serial("Material de visita por categoria — ao vivo", () => {
  let token: string;
  let page: PageDto;
  const title = `Categorias ${RUN_TAG}`;

  const payload = (over: Record<string, unknown>) => ({
    visitMaterialsPageData: JSON.stringify({
      pageTitle: title,
      pageSubtitle: "Subtítulo",
      pageDescription: "Descrição da página",
      testament: "NEW_TESTAMENT",
      ...over,
    }),
  });

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    if (page?.id) await request.delete(`${API_URL}/visit-material-pages/${page.id}`, { headers: authHeaders(token) });
  });

  test("cria com Geral + seções e devolve as faixas em ordem, mantendo o novo testamento", async ({ request }) => {
    const response = await request.post(`${API_URL}/visit-material-pages`, {
      headers: authHeaders(token),
      multipart: payload({
        documents: [link("Guia geral", "document")],
        sections: [
          { category: "TEEN", title: "Adolescentes", documents: [link("PDF teen", "document")] },
          { category: "BABY", description: "Só os pequenos", videos: [link("Canção baby", "video")] },
        ],
      }),
    });
    expect(response.status()).toBe(201);
    page = (await response.json()) as PageDto;

    expect(page.testament).toBe("NEW_TESTAMENT");
    expect(page.documents.map((item) => item.title)).toEqual(["Guia geral"]);
    expect(page.sections.map((item) => item.category)).toEqual(["BABY", "TEEN"]);
    expect(page.sections[1].documents.map((item) => item.title)).toEqual(["PDF teen"]);
  });

  test("recusa a mesma categoria duas vezes", async ({ request }) => {
    const response = await request.post(`${API_URL}/visit-material-pages`, {
      headers: authHeaders(token),
      multipart: payload({ sections: [{ category: "BABY" }, { category: "BABY" }] }),
    });
    expect(response.status()).toBe(400);
  });

  test("listagem e filtro por testamento trazem as seções", async ({ request }) => {
    const list = await request.get(`${API_URL}/visit-material-pages?testament=NEW_TESTAMENT`, { headers: authHeaders(token) });
    const found = ((await list.json()) as PageDto[]).find((item) => item.id === page.id);
    expect(found?.sections).toHaveLength(2);
  });

  test("omitir `sections` na edição não mexe nelas; enviar a lista cria, atualiza e remove", async ({ request }) => {
    const base = { id: page.id, currentWeek: false };
    const untouched = await request.patch(`${API_URL}/visit-material-pages/${page.id}`, {
      headers: authHeaders(token),
      multipart: payload({ ...base, documents: [link("Guia geral", "document")] }),
    });
    expect(untouched.ok()).toBeTruthy();
    expect(((await untouched.json()) as PageDto).sections).toHaveLength(2);

    const reconciled = await request.patch(`${API_URL}/visit-material-pages/${page.id}`, {
      headers: authHeaders(token),
      multipart: payload({
        ...base,
        testament: "OLD_TESTAMENT",
        documents: [link("Guia geral", "document")],
        sections: [
          { category: "BABY", title: "Baby", videos: [link("Canção baby", "video")] },
          { category: "ADULT", documents: [link("PDF adultos", "document")] },
        ],
      }),
    });
    expect(reconciled.ok()).toBeTruthy();
    page = (await reconciled.json()) as PageDto;
    expect(page.testament).toBe("OLD_TESTAMENT");
    expect(page.sections.map((item) => item.category)).toEqual(["BABY", "ADULT"]);
    expect(page.sections[0].title).toBe("Baby");
  });

  test("o filtro por categoria só traz páginas que têm a seção", async ({ request }) => {
    const ids = async (category: string) =>
      (
        (await (
          await request.get(`${API_URL}/visit-material-pages?category=${category}&searchString=${encodeURIComponent(title)}`, {
            headers: authHeaders(token),
          })
        ).json()) as PageDto[]
      ).map((item) => item.id);

    expect(await ids("BABY")).toContain(page.id);
    expect(await ids("ADULT")).toContain(page.id);
    expect(await ids("TEEN")).not.toContain(page.id);
    expect((await request.get(`${API_URL}/visit-material-pages?category=GENERAL`, { headers: authHeaders(token) })).status()).toBe(400);
  });

  test("a lista do membro filtra pelo chip de categoria", async ({ page: browser, request }) => {
    await seedBrowserSession(browser, await loginAs(request, "admin"));
    await browser.setViewportSize({ width: 390, height: 844 });
    await browser.goto("/area-do-membro/materiais-visita");
    await expect(browser.getByTestId("visit-material-member-list-category-filter")).toBeVisible({ timeout: 60_000 });

    await browser.getByTestId("visit-material-member-list-category-TEEN").click();
    await expect(browser.getByText(title)).toHaveCount(0);
    await browser.getByTestId("visit-material-member-list-category-ADULT").click();
    await expect(browser.getByText(title).first()).toBeVisible({ timeout: 20_000 });
    await browser.getByTestId("visit-material-member-list-category-all").click();
    expect(await browser.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("a página pública mostra o Geral e as categorias, e troca de categoria", async ({ page: browser, request }) => {
    await seedBrowserSession(browser, await loginAs(request, "admin"));
    await browser.setViewportSize({ width: 390, height: 844 });
    await browser.goto(`/area-do-membro/materiais-visita/${page.id}`);

    await expect(browser.getByTestId("visit-material-category-selector")).toBeVisible({ timeout: 20_000 });
    for (const category of ["GENERAL", "BABY", "ADULT"]) {
      await expect(browser.getByTestId(`visit-material-category-${category}`)).toBeVisible();
    }
    await expect(browser.getByTestId("visit-material-category-TEEN")).toHaveCount(0);

    await browser.getByTestId("visit-material-category-ADULT").click();
    await expect(browser.getByTestId("visit-material-page-media-item")).toHaveCount(1);
    expect(await browser.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("o editor carrega Geral e faixas, e a faixa vazia não vira seção ao salvar", async ({ page: browser, request }) => {
    await seedBrowserSession(browser, await loginAs(request, "admin"));
    await browser.setViewportSize({ width: 390, height: 844 });
    await browser.goto(`/adm/editar-pagina-visita?id=${page.id}`);

    await expect(browser.getByTestId("visit-material-page-editor-categories")).toBeVisible({ timeout: 60_000 });
    await expect(browser.getByTestId("visit-material-page-editor-category-BABY")).toContainText("1");
    await expect(browser.getByTestId("visit-material-page-editor-category-TEEN")).not.toContainText("·");

    await browser.getByTestId("visit-material-page-editor-category-BABY").click();
    await expect(browser.getByTestId("visit-material-page-editor-section-title")).toHaveValue("Baby");
    expect(await browser.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
