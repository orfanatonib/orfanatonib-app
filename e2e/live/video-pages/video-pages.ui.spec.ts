import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { captureFormData, openCreator, readCapturedForm } from "../page-creator/support";
import { BAD_ID, createPage, deletePageApi, mediaRows, pageRow, pagesWithTag, routeRows, snapshotDb, type VideoPageBody } from "./support";

/**
 * Telas de `/video-pages` (plano 34) de ponta a ponta: UI -> API -> MySQL. Os dados nascem pela API
 * (prefixo RUN_TAG) e a prova de cada efeito é um SELECT; recusas provam banco inalterado.
 */
test.describe.serial("Páginas de vídeos — UI ao vivo", () => {
  let admin: LoginResult;
  let leader: LoginResult;
  let member: LoginResult;
  const created: string[] = [];

  const make = async (
    request: import("@playwright/test").APIRequestContext,
    label: string,
    options: { isPublic?: boolean; videos?: number } = {},
  ): Promise<VideoPageBody> => {
    const count = options.videos ?? 1;
    const page = await createPage(request, admin.accessToken, {
      title: tagged(label),
      isPublic: options.isPublic ?? true,
      videos: Array.from({ length: count }, (_, i) => ({ title: `Vídeo ${i + 1}` })),
    });
    created.push(page.id);
    return page;
  };

  const openManager = async (page: Page, search: string): Promise<void> => {
    await page.goto("/adm/paginas-videos");
    await expect(page.getByTestId("video-pages-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("video-pages-search").fill(search);
  };

  const fillBasics = async (page: Page, title: string, description: string): Promise<void> => {
    await page.getByTestId("video-page-creator-title").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill(title);
    await page.getByTestId("video-page-creator-description").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill(description);
  };

  const addLinkVideo = async (page: Page, title: string): Promise<void> => {
    await page.getByTestId("video-form-title").fill(title);
    await page.getByTestId("video-form-description").fill(`Descrição de ${title}`);
    await page.getByTestId("video-form-url").fill("https://youtu.be/abc123");
    // O blur do campo desloca o layout e pode engolir o primeiro clique: repete até agir.
    await expect(async () => {
      await page.getByTestId("video-form-submit").click();
      await expect(page.getByTestId("video-list-item")).toHaveCount(1, { timeout: 1500 });
    }).toPass();
  };

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    leader = await loginAs(request, "leader");
    member = await loginAs(request, "member");
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin.accessToken, id);
    expect(await pagesWithTag(RUN_TAG), "a limpeza deixou páginas do E2E").toBe(0);
    await closeDb();
  });

  test("[video-page.get.video-pages#feliz] o painel lista exatamente as páginas do banco, com título e visibilidade", async ({
    page,
    request,
  }) => {
    const pub = await make(request, "ui-lista-a", { isPublic: true });
    const priv = await make(request, "ui-lista-b", { isPublic: false });
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-lista"));

    const cards = page.getByTestId("video-page-card");
    await expect(cards).toHaveCount(await pagesWithTag(tagged("ui-lista")));
    await expect(cards.filter({ hasText: tagged("ui-lista-a") }).getByTestId("video-page-card-visibility")).toHaveText("Pública");
    await expect(cards.filter({ hasText: tagged("ui-lista-b") }).getByTestId("video-page-card-visibility")).toHaveText("Privada");
    expect((await pageRow(pub.id))?.public).toBe(1);
    expect((await pageRow(priv.id))?.public).toBe(0);
  });

  test("lista vazia: busca sem resultado mostra o estado vazio e não muda o banco", async ({ page }) => {
    const before = await snapshotDb();
    await seedBrowserSession(page, admin);
    await openManager(page, `nao-existe-${RUN_TAG}`);
    await expect(page.getByTestId("video-pages-empty")).toBeVisible();
    expect(await snapshotDb()).toEqual(before);
  });

  test("[video-page.post.video-pages#validacao] criador: campos obrigatórios bloqueiam o envio e nada é gravado", async ({ page }) => {
    await seedBrowserSession(page, admin);
    const before = await snapshotDb();
    let posts = 0;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/video-pages")) posts += 1;
    });
    await openCreator(page, "page-template-card-videos");

    const feedback = page.getByTestId("video-page-creator-feedback");
    await page.getByTestId("video-page-creator-save").click();
    await expect(feedback).toContainText("O título da galeria é obrigatório.");
    await page.getByTestId("video-page-creator-title").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill(tagged("ui-validacao"));
    await page.getByTestId("video-page-creator-save").click();
    await expect(feedback).toContainText("A descrição da galeria é obrigatória.");
    await page.getByTestId("video-page-creator-description").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill("d");
    await page.getByTestId("video-page-creator-save").click();
    await expect(feedback).toContainText("Adicione pelo menos um vídeo.");

    expect(posts).toBe(0);
    expect(await snapshotDb()).toEqual(before);
    expect(await pagesWithTag(tagged("ui-validacao"))).toBe(0);
  });

  test("[video-page.post.video-pages#feliz] [video-page.post.video-pages#perfil-admin] criador: admin cria pela tela, o banco confirma e a página abre com o mesmo dado", async ({
    page,
  }) => {
    const title = tagged("ui-criar");
    await seedBrowserSession(page, admin);
    await captureFormData(page);
    await openCreator(page, "page-template-card-videos");
    await fillBasics(page, title, "Descrição criada pela tela");
    await addLinkVideo(page, "Vídeo da tela");

    const posted = page.waitForResponse((r) => r.url().endsWith("/video-pages") && r.request().method() === "POST");
    await page.getByTestId("video-page-creator-save").click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as VideoPageBody;
    created.push(body.id);

    const form = await readCapturedForm(page);
    expect(JSON.parse(form.fields.videosPageData) as { title: string }).toMatchObject({ title });
    expect(await pageRow(body.id)).toMatchObject({ name: title, description: "Descrição criada pela tela", public: 1 });
    const [row] = await mediaRows(body.id);
    expect(row.url).toBe("https://youtu.be/abc123");
    expect(await routeRows(body.id)).toHaveLength(1);

    await expect(page.getByTestId("video-page-title")).toContainText(title);
    await page.reload();
    await expect(page.getByTestId("video-page-title")).toContainText((await pageRow(body.id))?.name ?? "");
    await expect(page.getByTestId("video-card")).toHaveCount((await mediaRows(body.id)).length);
  });

  test("[video-page.patch.video-pages-id#feliz] [video-page.patch.video-pages-id#perfil-admin] editar: a tela carrega os dados do banco e salva a alteração", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-editar");
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-editar"));
    await page.getByTestId("video-page-card").filter({ hasText: tagged("ui-editar") }).getByTestId("video-page-card-edit").click();

    await expect(page).toHaveURL(new RegExp(`/adm/editar-pagina-videos\\?id=${source.id}`));
    const titleInput = page.getByTestId("video-page-creator-title").locator("input");
    await expect(titleInput).toHaveValue((await pageRow(source.id))?.name ?? "");
    await expect(page.getByTestId("video-list-item")).toHaveCount((await mediaRows(source.id)).length);

    const newTitle = tagged("ui-editar-novo");
    await titleInput.fill(newTitle);
    const patched = page.waitForResponse((r) => r.url().endsWith(`/video-pages/${source.id}`) && r.request().method() === "PATCH");
    await page.getByTestId("video-page-creator-save").click();
    expect((await patched).status()).toBe(200);
    expect((await pageRow(source.id))?.name).toBe(newTitle);
    expect(await mediaRows(source.id)).toHaveLength(1);
  });

  test("editar sem id volta para a lista de páginas (nunca para o feed)", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/editar-pagina-videos");
    await expect(page).toHaveURL(/\/adm\/paginas-videos$/);
    await expect(page.getByTestId("video-pages-manager")).toBeVisible();
  });

  test("[video-page.delete.video-pages-id#feliz] [video-page.delete.video-pages-id#perfil-admin] excluir pelo painel: a página, a rota e a mídia somem do banco", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-excluir", { videos: 2 });
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-excluir"));
    await page.getByTestId("video-page-card").filter({ hasText: tagged("ui-excluir") }).getByTestId("video-page-card-delete").click();

    const deleted = page.waitForResponse((r) => r.url().endsWith(`/video-pages/${source.id}`) && r.request().method() === "DELETE");
    await page.getByTestId("video-pages-delete-modal-confirm").click();
    expect((await deleted).status()).toBe(200);
    await expect(page.getByTestId("video-pages-snackbar")).toContainText("excluída com sucesso");
    expect(await pageRow(source.id)).toBeNull();
    expect(await routeRows(source.id)).toHaveLength(0);
    expect(await mediaRows(source.id)).toHaveLength(0);
  });

  test("[video-page.delete.video-pages-id#perfil-lider] líder não alcança o painel pela tela e a página segue no banco", async ({ page, request }) => {
    const source = await make(request, "ui-lider");
    await seedBrowserSession(page, leader);
    const before = await snapshotDb();
    await page.goto("/adm/paginas-videos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("video-pages-manager")).toHaveCount(0);
    await expect(page.getByTestId("video-page-card")).toHaveCount(0);
    expect(await snapshotDb()).toEqual(before);
    expect(await pageRow(source.id)).not.toBeNull();
  });

  test("[video-page.post.video-pages#perfil-membro] membro não alcança o painel nem o criador, e o banco não muda", async ({ page }) => {
    const before = await snapshotDb();
    await seedBrowserSession(page, member);
    for (const path of ["/adm/paginas-videos", "/adm/criar-pagina", "/adm/editar-pagina-videos"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL(/\/adm\//);
      await expect(page.getByTestId("video-pages-manager")).toHaveCount(0);
      await expect(page.getByTestId("video-page-creator")).toHaveCount(0);
    }
    expect(await snapshotDb()).toEqual(before);
  });

  test("[video-page.post.video-pages#perfil-anonimo] visitante é mandado para o login e nada muda", async ({ page }) => {
    const before = await snapshotDb();
    await page.goto("/adm/paginas-videos");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/adm\//);
    await expect(page.getByTestId("video-pages-manager")).toHaveCount(0);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[video-page.get.video-pages-id#feliz] [video-page.get.video-pages-id#perfil-anonimo] visitante abre a página pública: título e vídeos vêm do banco", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-publica", { videos: 2 });
    await page.goto(`/${source.route.path}`);
    await expect(page.getByTestId("video-page-view")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("video-page-title")).toContainText((await pageRow(source.id))?.name ?? "");
    await expect(page.getByTestId("video-card")).toHaveCount((await mediaRows(source.id)).length);
  });

  test("página sem vídeos mostra o estado vazio", async ({ page, request }) => {
    const source = await make(request, "ui-vazia", { videos: 0 });
    expect(await mediaRows(source.id)).toHaveLength(0);
    await page.goto(`/${source.route.path}`);
    await expect(page.getByTestId("video-page-empty")).toBeVisible({ timeout: 20_000 });
  });

  test("[video-page.get.video-pages-id#escopo-proprio-x-outro] página não pública: visitante não abre, o membro abre pela Área do Membro", async ({
    page,
    request,
    browser,
  }) => {
    const source = await make(request, "ui-privada", { isPublic: false, videos: 1 });
    await page.goto(`/${source.route.path}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("video-page-view")).toHaveCount(0);

    const context = await browser.newContext();
    const memberPage = await context.newPage();
    await seedBrowserSession(memberPage, member);
    await memberPage.goto(`/area-do-membro/videos/${source.id}`);
    await expect(memberPage.getByTestId("video-page-view")).toBeVisible({ timeout: 20_000 });
    await expect(memberPage.getByTestId("video-page-title")).toContainText((await pageRow(source.id))?.name ?? "");
    await context.close();
  });

  test("[video-page.get.video-pages-id#nao-encontrado] id inexistente na Área do Membro: erro real da API (404) aparece na tela", async ({ page }) => {
    await seedBrowserSession(page, member);
    await page.goto(`/area-do-membro/videos/${BAD_ID}`);
    await expect(page.getByTestId("video-page-error")).toBeVisible({ timeout: 20_000 });
  });

  test("[video-page.get.video-pages#perfil-membro] a Área do Membro lista as páginas de vídeo pelas rotas do banco", async ({ page, request }) => {
    const source = await make(request, "ui-membro-lista", { isPublic: false });
    const [route] = await routeRows(source.id);
    await seedBrowserSession(page, member);
    await page.goto("/area-do-membro/videos");
    await expect(page.getByTestId("member-videos-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`member-videos-card-${route.id}`)).toBeVisible();
    await page.getByTestId(`member-videos-card-${route.id}`).click();
    await expect(page).toHaveURL(new RegExp(`/area-do-membro/videos/${source.id}$`));
    await expect(page.getByTestId("video-page-view")).toBeVisible();
  });

  test("@mobile painel de vídeos em 375px: cards sem rolagem horizontal e Ver/Editar alinhados", async ({ page, request }) => {
    await make(request, "ui-mobile-lista");
    await page.setViewportSize({ width: 375, height: 812 });
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-mobile-lista"));
    const card = page.getByTestId("video-page-card").filter({ hasText: tagged("ui-mobile-lista") });
    await expect(card).toBeVisible();
    const view = card.getByTestId("video-page-card-view");
    const edit = card.getByTestId("video-page-card-edit");
    const [a, b] = [await view.boundingBox(), await edit.boundingBox()];
    expect(a && b).toBeTruthy();
    expect(Math.abs(a!.x - b!.x), "Ver/Editar com x desalinhado").toBeLessThanOrEqual(1);
    expect(Math.abs(a!.width - b!.width), "Ver/Editar com larguras diferentes").toBeLessThanOrEqual(1);
    expect(a!.width).toBeGreaterThan(280);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("@mobile criar galeria em 375px: sem rolagem horizontal, alvos de toque >= 44px e gravação no banco", async ({ page }) => {
    const title = tagged("ui-mobile");
    await seedBrowserSession(page, admin);
    await openCreator(page, "page-template-card-videos");
    await fillBasics(page, title, "Criada em 375px");
    await addLinkVideo(page, "Vídeo mobile");

    const noHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noHorizontalScroll).toBe(true);
    for (const id of ["video-form-submit", "video-page-creator-save"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box?.height ?? 0, `${id} abaixo de 44px`).toBeGreaterThanOrEqual(44);
    }

    const actionIds = ["video-page-creator-cancel", "video-page-creator-save"];
    const boxes = [];
    for (const id of actionIds) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box, `${id} sem caixa`).not.toBeNull();
      boxes.push(box!);
    }
    const ordered = [...boxes].sort((a, b) => a.y - b.y);
    for (let i = 1; i < ordered.length; i += 1) {
      expect(ordered[i].y, "ações devem ficar empilhadas, sem sobreposição").toBeGreaterThanOrEqual(ordered[i - 1].y + ordered[i - 1].height - 1);
    }
    for (const box of boxes) {
      expect(box.width, "botão de ação deve ocupar a largura do formulário").toBeGreaterThan(280);
      expect(box.height, "texto do botão não pode quebrar em várias linhas").toBeLessThan(80);
    }

    const posted = page.waitForResponse((r) => r.url().endsWith("/video-pages") && r.request().method() === "POST");
    await page.getByTestId("video-page-creator-save").click();
    const response = await posted;
    expect(response.status()).toBe(201);
    const body = (await response.json()) as VideoPageBody;
    created.push(body.id);
    expect((await pageRow(body.id))?.name).toBe(title);
    await expect(page.getByTestId("video-page-view")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("upload de arquivo pelo criador: objeto no bucket, linha aponta para ele; a recusa de tipo inválido não grava", async ({ page }) => {
    const title = tagged("ui-upload");
    await seedBrowserSession(page, admin);
    await openCreator(page, "page-template-card-videos");
    await fillBasics(page, title, "Com arquivo");
    await page.getByTestId("video-form-title").fill("Arquivo");
    await page.getByTestId("video-form-description").fill("Vídeo enviado");
    await page.getByTestId("video-form-type").click();
    await page.getByTestId("video-form-type-upload").click();
    await page.getByTestId("video-form-file").setInputFiles({
      name: "clipe.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex"),
    });
    await expect(page.getByTestId("video-form-file-name")).toHaveText("clipe.mp4");
    await expect(async () => {
      await page.getByTestId("video-form-submit").click();
      await expect(page.getByTestId("video-list-item")).toHaveCount(1, { timeout: 1500 });
    }).toPass();

    const posted = page.waitForResponse((r) => r.url().endsWith("/video-pages") && r.request().method() === "POST");
    await page.getByTestId("video-page-creator-save").click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as VideoPageBody;
    created.push(body.id);

    const [row] = await mediaRows(body.id);
    expect(row.isLocalFile).toBe(1);
    expect(row.storageKey).toMatch(/\/VideosPage\/.+\.mp4$/);
    const headers = authHeaders(admin.accessToken);
    expect((await (await page.request.get(`${API_URL}/video-pages/${body.id}`, { headers })).json() as VideoPageBody).videos[0].url).toBe(row.url);
  });
});
