import { API_URL } from "../../../playwright.live.config";
import { expectCardActionsAligned } from "../support/card-layout";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { RUN_TAG, tagged } from "../support/factory";
import { createPage, deletePageApi, mediaRows, pageRow, pagesWithTag, png, routeRows, sectionRows, snapshotDb } from "./support";

test.describe.serial("Gerenciamento de Páginas de Ideias — Teste E2E Full-Stack", () => {
  test("1. Autenticação e acesso a /adm/paginas-ideias", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-ideias");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("ideas-pages-manager")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("2. Clicar em uma ideia abre /area-do-membro/ideias/:id dentro da casca (95% no desktop, 98% no mobile)", async ({
    page,
    request,
  }) => {
    const admin = await loginAs(request, "admin");
    const title = `Ideia UI ${RUN_TAG}`;
    const created = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(admin.accessToken),
      multipart: {
        ideasMaterialsPageData: JSON.stringify({
          title,
          subtitle: "Subtítulo do cenário",
          description: "Criada pelo cenário",
          sections: [{ title: "Seção do cenário", description: "Descrição", public: true, medias: [] }],
        }),
      },
    });
    expect(created.status()).toBe(201);
    const idea = (await created.json()) as { id: string; route?: { path: string } };

    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      await seedBrowserSession(page, await loginAs(request, "member"));
      await page.goto("/area-do-membro/ideias");
      await page.getByLabel("Buscar ideias").fill(title);
      await page.getByTestId(/^member-ideas-card-/).first().click();

      await expect(page).toHaveURL(new RegExp(`/area-do-membro/ideias/${idea.id}$`));
      await expect(page.getByTestId("ideas-page")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
      await expect(page.getByTestId("member-nav-ideas")).toHaveAttribute("aria-current", "page");

      const frameWidth = async () =>
        page.getByTestId("member-area-frame").evaluate((el) =>
          Math.round((el.getBoundingClientRect().width / window.innerWidth) * 100),
        );
      expect(await frameWidth()).toBe(95);
      await page.setViewportSize({ width: 375, height: 800 });
      await expect.poll(frameWidth).toBe(98);
    } finally {
      await request.delete(`${API_URL}/ideas-pages/${idea.id}`, {
        headers: authHeaders(admin.accessToken),
      });
    }
  });
});

/**
 * Telas do plano 31 (front -> API real -> banco): nada de `page.route`; cada passo é provado por SELECT
 * e os negativos provam que o banco não mudou.
 */
test.describe.serial("Páginas de ideias — telas do painel", () => {
  let admin: string;
  const created: string[] = [];

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin, id);
    expect(await pagesWithTag(RUN_TAG)).toBe(0);
    await closeDb();
  });

  const seedPage = async (request: import("@playwright/test").APIRequestContext, label: string) => {
    const page = await createPage(request, admin, {
      title: tagged(label),
      sections: [{ title: "Seção", medias: [{ title: "Imagem", file: png("tela.png") }] }],
    });
    created.push(page.id);
    return page;
  };

  test("[ideas-page.post.ideas-pages#feliz] [ideas-page.get.ideas-pages#feliz] criar pela tela grava no banco e a lista mostra a página", async ({ page, request }) => {
    const title = tagged("ui-criar");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/criar-pagina");
    await page.getByTestId("page-template-card-ideas").click();
    await page.getByRole("textbox", { name: /Título da Página/ }).fill(title);
    await page.getByRole("textbox", { name: /Descrição da Página/ }).fill("Descrição do cenário");
    await page.getByTestId("ideas-page-creator-add-section").click();
    await page.getByTestId("ideas-material-title").fill("Seção do cenário");
    await page.getByTestId("ideas-material-description").fill("Descrição da seção");

    const posted = page.waitForResponse((r) => r.url().endsWith("/ideas-pages") && r.request().method() === "POST");
    await page.getByTestId("ideas-page-creator-save").click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };
    created.push(body.id);

    expect((await pageRow(body.id))?.title).toBe(title);
    expect(await sectionRows(body.id)).toHaveLength(1);
    expect(await routeRows(body.id)).toHaveLength(1);

    await page.goto("/adm/paginas-ideias");
    await page.getByTestId("ideas-toolbar-search").fill(title);
    await expect(page.getByTestId(`ideas-page-card-title-${body.id}`)).toHaveText(title);
  });

  test("[ideas-page.post.ideas-pages#validacao] criar sem campos obrigatórios mostra a mensagem e não grava nada", async ({ page, request }) => {
    const before = await snapshotDb();
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/criar-pagina");
    await page.getByTestId("page-template-card-ideas").click();
    await page.getByTestId("ideas-page-creator-save").click();
    await expect(page.getByText("Preencha todos os campos obrigatórios e adicione pelo menos uma seção.")).toBeVisible();
    expect(await snapshotDb()).toEqual(before);
  });

  test("[ideas-page.patch.ideas-pages-id#feliz] editar pela tela atualiza título e seção no banco", async ({ page, request }) => {
    const seeded = await seedPage(request, "ui-editar");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/${seeded.route.path}`);
    await page.getByTestId("ideas-page-edit").click();
    const newTitle = tagged("ui-editar-novo");
    await page.getByRole("textbox", { name: /Título da Página/ }).fill(newTitle);

    const patched = page.waitForResponse((r) => r.url().endsWith(`/ideas-pages/${seeded.id}`) && r.request().method() === "PATCH");
    await page.getByTestId("ideas-page-creator-save").click();
    const response = await patched;
    expect(response.status(), await response.text()).toBe(200);
    expect((await pageRow(seeded.id))?.title).toBe(newTitle);
    expect(await mediaRows(seeded.id)).toHaveLength(1);
  });

  test("[ideas-page.delete.ideas-pages-id#feliz] excluir pela lista remove página, seções, mídia e rota", async ({ page, request }) => {
    const seeded = await seedPage(request, "ui-excluir");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/paginas-ideias");
    await page.getByTestId("ideas-toolbar-search").fill(seeded.title);
    await page.getByTestId(`ideas-page-card-delete-${seeded.id}`).click();
    const deleted = page.waitForResponse((r) => r.url().endsWith(`/ideas-pages/${seeded.id}`) && r.request().method() === "DELETE");
    await page.getByTestId("ideas-pages-delete-dialog-confirm").click();
    expect((await deleted).status()).toBe(200);

    expect(await pageRow(seeded.id)).toBeNull();
    expect(await sectionRows(seeded.id)).toHaveLength(0);
    expect(await mediaRows(seeded.id)).toHaveLength(0);
    expect(await routeRows(seeded.id)).toHaveLength(0);
  });

  test("lista vazia: busca sem resultado mostra o estado vazio", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/paginas-ideias");
    await page.getByTestId("ideas-toolbar-search").fill(tagged("nao-existe"));
    await expect(page.getByTestId("ideas-pages-empty")).toBeVisible();
    expect(await countRows("ideas_pages", { title: tagged("nao-existe") })).toBe(0);
  });

  test("erro real da API visível: excluir página já removida mostra a mensagem e o banco não muda", async ({ page, request }) => {
    const seeded = await seedPage(request, "ui-erro");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/paginas-ideias");
    await page.getByTestId("ideas-toolbar-search").fill(seeded.title);
    await expect(page.getByTestId(`ideas-page-card-${seeded.id}`)).toBeVisible();
    await deletePageApi(request, admin, seeded.id);
    const before = await snapshotDb();
    await page.getByTestId(`ideas-page-card-delete-${seeded.id}`).click();
    await page.getByTestId("ideas-pages-delete-dialog-confirm").click();
    await expect(page.getByTestId("ideas-pages-error")).toBeVisible();
    expect(await snapshotDb()).toEqual(before);
  });

  for (const role of ["member", "leader"] as const) {
    test(`[ideas-page.post.ideas-pages#perfil-${role === "member" ? "membro" : "lider"}] ${role} não vê o painel de páginas de ideias`, async ({ page, request }) => {
      await seedBrowserSession(page, await loginAs(request, role));
      await page.goto("/adm/paginas-ideias");
      await expect(page.getByTestId("ideas-pages-manager")).toHaveCount(0);
    });
  }

  test("[ideas-page.post.ideas-pages#perfil-anonimo] visitante não vê o painel de páginas de ideias", async ({ page }) => {
    await page.goto("/adm/paginas-ideias");
    await expect(page.getByTestId("ideas-pages-manager")).toHaveCount(0);
  });

  test("[ideas-page.post.ideas-pages#flag-desligada] com page_management desligada o painel some e a API devolve 403 FEATURE_DISABLED sem gravar", async ({ page, request }) => {
    const flagBefore = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'page_management'"))?.enabled ?? 1;
    await request.patch(`${API_URL}/feature-flags/page_management`, { headers: authHeaders(admin), data: { enabled: false } });
    try {
      const before = await snapshotDb();
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.goto("/adm/paginas-ideias");
      await expect(page.getByTestId("ideas-pages-manager")).toHaveCount(0);
      const res = await request.post(`${API_URL}/ideas-pages`, { headers: authHeaders(admin), multipart: {} });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      expect(await snapshotDb()).toEqual(before);
    } finally {
      await request.patch(`${API_URL}/feature-flags/page_management`, { headers: authHeaders(admin), data: { enabled: flagBefore === 1 } });
    }
  });

  test("@mobile painel de páginas de ideias em 375x812: sem rolagem horizontal e ações com alvo >= 44px", async ({ page, request }) => {
    const seeded = await seedPage(request, "ui-mobile");
    await page.setViewportSize({ width: 375, height: 812 });
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/paginas-ideias");
    await page.getByTestId("ideas-toolbar-search").fill(seeded.title);
    const view = page.getByTestId(`ideas-page-card-view-${seeded.id}`);
    await expect(view).toBeVisible();
    const box = await view.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectCardActionsAligned(page, [`ideas-page-card-view-${seeded.id}`]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
