import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { s3Config } from "../support/env";
import { expectCardActionsAligned } from "../support/card-layout";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { captureFormData, openCreator, readCapturedForm } from "../page-creator/support";
import { expectNoBrokenRefs, expectNoOrphans, objectExists } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import {
  createPage,
  deletePageApi,
  mediaRows,
  pageRow,
  pagesWithTag,
  png,
  routeRows,
  sectionRows,
  sectionsWithTag,
  snapshotDb,
  type ImagePageBody,
} from "./support";

/**
 * Telas de galerias de imagens (plano 33) de ponta a ponta: UI -> API -> MySQL (-> LocalStack). Os dados nascem pela API
 * (prefixo RUN_TAG); a prova de cada efeito é um SELECT; recusas provam banco inalterado e bucket sem órfãos.
 */
const FLAG_KEYS = ["page_management", "public_galleries"] as const;

test.describe.serial("Galerias de imagens — UI ao vivo", () => {
  let admin: LoginResult;
  let leader: LoginResult;
  let member: LoginResult;
  const created: string[] = [];

  const make = async (
    request: APIRequestContext,
    label: string,
    options: { isPublic?: boolean; sections?: number; uploads?: boolean } = {},
  ): Promise<ImagePageBody> => {
    const count = options.sections ?? 1;
    const page = await createPage(request, admin.accessToken, {
      title: tagged(label),
      isPublic: options.isPublic ?? true,
      sections: Array.from({ length: count }, (_, i) => ({
        caption: tagged(`${label}-sec${i + 1}`),
        media: [options.uploads ? { file: png(`${label}-${i}.png`) } : { title: `Foto ${i + 1}` }],
      })),
    });
    created.push(page.id);
    return page;
  };

  const openManager = async (page: Page, search: string): Promise<void> => {
    await page.goto("/adm/paginas-fotos");
    await expect(page.getByTestId("image-pages-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("image-pages-search").fill(search);
  };

  const card = (page: Page, id: string) => page.getByTestId(`image-page-card-${id}`);

  /** Preenche o criador: dados da galeria + uma seção com um arquivo enviado pela janela de imagens. */
  const fillCreator = async (page: Page, title: string, caption: string, fileName: string): Promise<void> => {
    await page.getByTestId("image-page-creator-title").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill(title);
    await page.getByTestId("image-page-creator-description").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill("Descrição criada pela tela");
    await page.getByTestId("image-page-creator-add-section").click();
    await page.getByTestId("image-section-editor-caption").fill(caption);
    await page.getByTestId("image-section-editor-description").fill("Descrição da seção");
    await page.getByTestId("image-section-editor-add-media").click();
    await page.getByTestId("add-image-file-input").setInputFiles(png(fileName));
    await page.getByTestId("add-image-submit").click();
    await expect(page.getByTestId("image-item-preview")).toHaveCount(1);
  };

  const keyOf = (url: string): string => {
    const key = keyFromUrl(url, s3Config().bucket);
    if (!key) throw new Error(`URL fora do bucket: ${url}`);
    return key;
  };

  const withFlagsOff = async (request: APIRequestContext, keys: readonly string[], work: () => Promise<void>): Promise<void> => {
    const initial: Record<string, boolean> = {};
    for (const key of keys) {
      initial[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
    }
    try {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: false } });
      }
      await work();
    } finally {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: initial[key] } });
      }
    }
  };

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    leader = await loginAs(request, "leader");
    member = await loginAs(request, "member");
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin.accessToken, id);
    expect(await pagesWithTag(RUN_TAG), "a limpeza deixou galerias do E2E").toBe(0);
    expect(await sectionsWithTag(RUN_TAG), "a limpeza deixou seções do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  test("1. Autenticação e acesso a /adm/paginas-fotos", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/paginas-fotos");
    await expect(page.getByTestId("image-pages-manager")).toBeVisible({ timeout: 20_000 });
  });

  test("2. Autenticação e acesso a /adm/fotos-abrigos", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/fotos-abrigos");
    await expect(page.getByTestId("image-sections-manager")).toBeVisible({ timeout: 20_000 });
  });

  test("[image-page.get.image-pages#feliz] [image-page.get.image-pages#perfil-admin] o painel lista exatamente as galerias do banco, com título e visibilidade", async ({
    page,
    request,
  }) => {
    const pub = await make(request, "ui-lista-a", { isPublic: true });
    const priv = await make(request, "ui-lista-b", { isPublic: false });
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-lista"));

    await expect(page.getByTestId("image-pages-list").locator('[data-testid^="image-page-card-"]')).toHaveCount(
      await pagesWithTag(tagged("ui-lista")),
    );
    await expect(page.getByTestId(`image-page-visibility-${pub.id}`)).toHaveText("Pública");
    await expect(page.getByTestId(`image-page-visibility-${priv.id}`)).toHaveText("Privada");
    await expect(page.getByTestId(`image-page-title-${pub.id}`)).toHaveText((await pageRow(pub.id))?.name ?? "");
    expect((await pageRow(priv.id))?.public).toBe(0);
  });

  test("lista vazia: busca sem resultado mostra o estado vazio e não muda o banco", async ({ page }) => {
    const before = await snapshotDb();
    await seedBrowserSession(page, admin);
    await openManager(page, `nao-existe-${RUN_TAG}`);
    await expect(page.getByTestId("image-pages-empty")).toBeVisible();
    expect(await snapshotDb()).toEqual(before);
  });

  test("detalhes: o modal mostra a galeria e abre a página pública", async ({ page, request }) => {
    const source = await make(request, "ui-detalhes");
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-detalhes"));
    await page.getByTestId(`image-page-details-${source.id}`).click();
    await expect(page.getByTestId("image-page-details-modal")).toBeVisible();
    await page.getByTestId("image-page-details-open").click();
    await expect(page).toHaveURL(new RegExp(`/${source.route.path}$`));
    await expect(page.getByTestId("image-page-view")).toBeVisible({ timeout: 20_000 });
  });

  test("[image-page.post.image-pages#validacao] criador: campos obrigatórios bloqueiam o envio e nada é gravado", async ({ page }) => {
    await seedBrowserSession(page, admin);
    const before = await snapshotDb();
    let posts = 0;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/image-pages")) posts += 1;
    });
    await openCreator(page, "page-template-card-gallery");

    const feedback = page.getByTestId("image-page-creator-error");
    await page.getByTestId("image-page-creator-save").click();
    await expect(feedback).toContainText("O título da galeria é obrigatório.");
    await page.getByTestId("image-page-creator-title").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill(tagged("ui-validacao"));
    await page.getByTestId("image-page-creator-save").click();
    await expect(feedback).toContainText("A descrição da galeria é obrigatória.");
    await page.getByTestId("image-page-creator-description").locator("input:not([aria-hidden]), textarea:not([aria-hidden])").fill("d");
    await page.getByTestId("image-page-creator-save").click();
    await expect(feedback).toContainText("Adicione pelo menos uma seção.");
    await page.getByTestId("image-page-creator-add-section").click();
    await page.getByTestId("image-page-creator-save").click();
    await expect(feedback).toContainText("A seção 1 precisa de um título.");
    await page.getByTestId("image-section-editor-caption").fill("c");
    await page.getByTestId("image-section-editor-description").fill("d");
    await page.getByTestId("image-page-creator-save").click();
    await expect(feedback).toContainText("A seção 1 precisa conter pelo menos uma mídia.");
    await expect(page.getByTestId("image-item-empty")).toBeVisible();

    expect(posts).toBe(0);
    expect(await snapshotDb()).toEqual(before);
    expect(await pagesWithTag(tagged("ui-validacao"))).toBe(0);
  });

  test("[image-page.post.image-pages#feliz] [image-page.post.image-pages#perfil-admin] [image-page.post.image-pages#s3-sem-orfao] criador: admin cria pela tela com upload, o banco e o bucket confirmam e a galeria abre com o mesmo dado", async ({
    page,
  }) => {
    const title = tagged("ui-criar");
    await seedBrowserSession(page, admin);
    await captureFormData(page);
    await openCreator(page, "page-template-card-gallery");
    await fillCreator(page, title, tagged("ui-criar-sec"), "criada.png");

    const posted = page.waitForResponse((r) => r.url().endsWith("/image-pages") && r.request().method() === "POST");
    await page.getByTestId("image-page-creator-save").click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as ImagePageBody;
    created.push(body.id);

    const form = await readCapturedForm(page);
    expect(JSON.parse(form.fields.imageData) as { title: string }).toMatchObject({ title });
    expect(form.files).toHaveLength(1);
    expect(await pageRow(body.id)).toMatchObject({ name: title, description: "Descrição criada pela tela", public: 1 });
    expect(await sectionRows(body.id)).toHaveLength(1);
    expect(await routeRows(body.id)).toHaveLength(1);
    const [row] = await mediaRows(body.id);
    expect(row.isLocalFile).toBe(1);
    expect(await objectExists(keyOf(row.url))).toBe(true);
    await expectNoOrphans();
    await expectNoBrokenRefs();

    await expect(page.getByTestId("image-page-header")).toContainText(title, { timeout: 20_000 });
    await page.reload();
    await expect(page.getByTestId("image-page-header")).toContainText((await pageRow(body.id))?.name ?? "");
    await expect(page.getByTestId("image-section-card")).toHaveCount(1);
  });

  test("[image-page.post.image-pages#perfil-lider] líder não alcança o criador pela tela e o banco não muda", async ({ page }) => {
    await seedBrowserSession(page, leader);
    const before = await snapshotDb();
    await page.goto("/adm/criar-pagina");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("page-template-card-gallery")).toHaveCount(0);
    await expect(page.getByTestId("image-page-creator")).toHaveCount(0);
    expect(await snapshotDb()).toEqual(before);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[image-page.patch.image-pages-id#feliz] [image-page.patch.image-pages-id#perfil-admin] editar: a tela carrega os dados do banco e salva a alteração", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-editar", { sections: 2 });
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-editar"));
    await card(page, source.id).getByTestId(`image-page-edit-${source.id}`).click();

    await expect(page).toHaveURL(/\/adm\/editar-pagina-imagens$/);
    const titleInput = page.getByTestId("image-page-creator-title").locator("input");
    await expect(titleInput).toHaveValue((await pageRow(source.id))?.name ?? "");
    await expect(page.getByTestId("image-section-editor")).toHaveCount((await sectionRows(source.id)).length);

    const newTitle = tagged("ui-editar-novo");
    await titleInput.fill(newTitle);
    const patched = page.waitForResponse((r) => r.url().endsWith(`/image-pages/${source.id}`) && r.request().method() === "PATCH");
    await page.getByTestId("image-page-creator-save").click();
    expect((await patched).status()).toBe(200);
    expect((await pageRow(source.id))?.name).toBe(newTitle);
    expect(await sectionRows(source.id)).toHaveLength(2);
    expect(await mediaRows(source.id)).toHaveLength(2);
    expect(await routeRows(source.id)).toHaveLength(1);
  });

  test("[image-page.patch.image-pages-id#s3-sem-orfao] editar trocando o arquivo pela tela: novo objeto existe, o antigo some e nada fica órfão", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-troca", { uploads: true });
    const [oldRow] = await mediaRows(source.id);
    const oldKey = keyOf(oldRow.url);
    expect(await objectExists(oldKey)).toBe(true);

    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-troca"));
    await card(page, source.id).getByTestId(`image-page-edit-${source.id}`).click();
    await expect(page.getByTestId("image-item-preview")).toHaveCount(1);

    await page.getByTestId("image-item-remove").click();
    await page.getByTestId("delete-confirmation-modal-confirm").click();
    await expect(page.getByTestId("image-item-empty")).toBeVisible();
    await page.getByTestId("image-section-editor-add-media").click();
    await page.getByTestId("add-image-file-input").setInputFiles(png("nova.png"));
    await page.getByTestId("add-image-submit").click();
    await expect(page.getByTestId("image-item-preview")).toHaveCount(1);

    const patched = page.waitForResponse((r) => r.url().endsWith(`/image-pages/${source.id}`) && r.request().method() === "PATCH");
    await page.getByTestId("image-page-creator-save").click();
    expect((await patched).status()).toBe(200);

    const rows = await mediaRows(source.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).not.toBe(oldRow.id);
    const newKey = keyOf(rows[0].url);
    expect(newKey).not.toBe(oldKey);
    expect(await objectExists(newKey)).toBe(true);
    await expect.poll(() => objectExists(oldKey)).toBe(false);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[image-page.patch.image-pages-id#nao-encontrado] editar uma galeria já apagada: a API recusa, a tela avisa e nada é recriado", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-fantasma");
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-fantasma"));
    await card(page, source.id).getByTestId(`image-page-edit-${source.id}`).click();
    await expect(page.getByTestId("image-page-creator-title").locator("input")).toHaveValue((await pageRow(source.id))?.name ?? "");

    await deletePageApi(request, admin.accessToken, source.id);
    const before = await snapshotDb();
    const patched = page.waitForResponse((r) => r.url().endsWith(`/image-pages/${source.id}`) && r.request().method() === "PATCH");
    await page.getByTestId("image-page-creator-save").click();
    expect((await patched).status()).toBe(404);
    await expect(page.getByTestId("image-page-creator-error")).toContainText("Erro ao enviar dados.");
    expect(await snapshotDb()).toEqual(before);
    expect(await pageRow(source.id)).toBeNull();
  });

  test("editar sem escolher a galeria volta para o painel (nunca para o feed)", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/editar-pagina-imagens");
    await expect(page).toHaveURL(/\/adm\/paginas-fotos$/);
    await expect(page.getByTestId("image-pages-manager")).toBeVisible();
  });

  test("[image-page.delete.image-pages-id#feliz] [image-page.delete.image-pages-id#perfil-admin] [image-page.delete.image-pages-id#s3-sem-orfao] excluir pelo painel: página, seções, rota, mídia e objetos somem", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-excluir", { sections: 2, uploads: true });
    const keys = (await mediaRows(source.id)).map((row) => keyOf(row.url));
    expect(keys).toHaveLength(2);
    for (const key of keys) expect(await objectExists(key)).toBe(true);

    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-excluir"));
    await page.getByTestId(`image-page-delete-${source.id}`).click();
    const deleted = page.waitForResponse((r) => r.url().endsWith(`/image-pages/${source.id}`) && r.request().method() === "DELETE");
    await page.getByTestId("image-page-delete-dialog-confirm").click();
    expect((await deleted).status()).toBe(200);
    await expect(card(page, source.id)).toHaveCount(0);

    expect(await pageRow(source.id)).toBeNull();
    expect(await sectionRows(source.id)).toHaveLength(0);
    expect(await routeRows(source.id)).toHaveLength(0);
    expect(await mediaRows(source.id)).toHaveLength(0);
    for (const key of keys) await expect.poll(() => objectExists(key)).toBe(false);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[image-page.delete.image-pages-id#nao-encontrado] excluir uma galeria já apagada: a API recusa, a tela avisa e o banco não muda", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-excluida");
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-excluida"));
    await expect(card(page, source.id)).toBeVisible();
    await deletePageApi(request, admin.accessToken, source.id);
    const before = await snapshotDb();

    await page.getByTestId(`image-page-delete-${source.id}`).click();
    const denied = page.waitForResponse((r) => r.url().endsWith(`/image-pages/${source.id}`) && r.request().method() === "DELETE");
    await page.getByTestId("image-page-delete-dialog-confirm").click();
    expect((await denied).status()).toBe(404);
    await expect(card(page, source.id)).toHaveCount(0);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[image-page.delete.image-pages-id#perfil-lider] líder não alcança o painel pela tela e a galeria segue no banco", async ({ page, request }) => {
    const source = await make(request, "ui-lider");
    await seedBrowserSession(page, leader);
    const before = await snapshotDb();
    await page.goto("/adm/paginas-fotos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("image-pages-manager")).toHaveCount(0);
    expect(await snapshotDb()).toEqual(before);
    expect(await pageRow(source.id)).not.toBeNull();
  });

  test("[image-page.post.image-pages#perfil-membro] [image-page.patch.image-pages-id#perfil-membro] membro não alcança o painel nem o criador, e o banco não muda", async ({
    page,
  }) => {
    const before = await snapshotDb();
    await seedBrowserSession(page, member);
    for (const path of ["/adm/paginas-fotos", "/adm/criar-pagina", "/adm/editar-pagina-imagens"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL(/\/adm\//);
      await expect(page.getByTestId("image-pages-manager")).toHaveCount(0);
      await expect(page.getByTestId("image-page-creator")).toHaveCount(0);
    }
    expect(await snapshotDb()).toEqual(before);
  });

  test("[image-page.post.image-pages#perfil-anonimo] [image-page.delete.image-pages-id#perfil-anonimo] visitante é mandado para fora do painel e nada muda", async ({
    page,
  }) => {
    const before = await snapshotDb();
    await page.goto("/adm/paginas-fotos");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/adm\//);
    await expect(page.getByTestId("image-pages-manager")).toHaveCount(0);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[image-page.get.image-pages-id-sections#feliz] [image-page.get.image-pages-id#feliz] [image-page.get.image-pages-id-sections#perfil-anonimo] visitante abre a galeria pública: título e seções vêm do banco", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-publica", { sections: 2 });
    await page.goto(`/${source.route.path}`);
    await expect(page.getByTestId("image-page-view")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("image-page-header")).toContainText((await pageRow(source.id))?.name ?? "");
    await expect(page.getByTestId("image-section-card")).toHaveCount((await sectionRows(source.id)).length);
    await expect(page.getByTestId("image-section-header").first()).toBeVisible();
    await expect(page.getByTestId("image-section-hero").first()).toBeVisible();
  });

  test("galeria sem seções mostra o estado vazio", async ({ page, request }) => {
    const source = await createPage(request, admin.accessToken, { title: tagged("ui-vazia"), sections: [] });
    created.push(source.id);
    expect(await sectionRows(source.id)).toHaveLength(0);
    await page.goto(`/${source.route.path}`);
    await expect(page.getByTestId("image-page-empty")).toBeVisible({ timeout: 20_000 });
  });

  test("[image-page.get.image-pages-id#escopo-proprio-x-outro] [image-page.get.image-pages-id-sections#escopo-proprio-x-outro] galeria não pública: o visitante não a vê na tela", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-privada", { isPublic: false });
    await page.goto(`/${source.route.path}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("image-page-view")).toHaveCount(0);
    await expect(page.getByTestId("image-section-card")).toHaveCount(0);
    expect((await pageRow(source.id))?.public).toBe(0);
  });

  test("[image-page.post.image-pages#flag-desligada] [image-page.get.image-pages#flag-desligada] flag desligada: painel, criador e galeria pública somem da tela e o banco não muda", async ({
    page,
    request,
  }) => {
    const source = await make(request, "ui-flag");
    await withFlagsOff(request, FLAG_KEYS, async () => {
      const before = await snapshotDb();
      await seedBrowserSession(page, admin);
      for (const path of ["/adm/paginas-fotos", "/adm/criar-pagina", "/adm/editar-pagina-imagens"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page).not.toHaveURL(/\/adm\//);
        await expect(page.getByTestId("image-pages-manager")).toHaveCount(0);
        await expect(page.getByTestId("image-page-creator")).toHaveCount(0);
      }
      await page.goto(`/${source.route.path}`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("image-page-view")).toHaveCount(0);
      expect(await snapshotDb()).toEqual(before);
    });

    await page.goto("/adm/paginas-fotos");
    await expect(page.getByTestId("image-pages-manager")).toBeVisible({ timeout: 20_000 });
  });

  test("@mobile painel de galerias em 375px: cards sem rolagem horizontal e Ver/Editar alinhados", async ({ page, request }) => {
    const source = await make(request, "ui-mobile-lista");
    await page.setViewportSize({ width: 375, height: 812 });
    await seedBrowserSession(page, admin);
    await openManager(page, tagged("ui-mobile-lista"));
    await expect(card(page, source.id)).toBeVisible();
    await expectCardActionsAligned(page, [`image-page-details-${source.id}`, `image-page-edit-${source.id}`]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("@mobile criar galeria em 375px: sem rolagem horizontal, alvos de toque >= 44px e gravação no banco", async ({ page }) => {
    const title = tagged("ui-mobile");
    await seedBrowserSession(page, admin);
    await openCreator(page, "page-template-card-gallery");
    await fillCreator(page, title, tagged("ui-mobile-sec"), "mobile.png");

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const actionIds = ["image-page-creator-cancel", "image-page-creator-add-section", "image-page-creator-save"];
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
    for (const id of ["image-section-editor-add-media", "image-page-creator-save", "image-page-creator-add-section"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box?.height ?? 0, `${id} abaixo de 44px`).toBeGreaterThanOrEqual(44);
    }

    const posted = page.waitForResponse((r) => r.url().endsWith("/image-pages") && r.request().method() === "POST");
    await page.getByTestId("image-page-creator-save").click();
    const response = await posted;
    expect(response.status()).toBe(201);
    const body = (await response.json()) as ImagePageBody;
    created.push(body.id);
    expect((await pageRow(body.id))?.name).toBe(title);
    await expect(page.getByTestId("image-page-view")).toBeVisible({ timeout: 20_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
