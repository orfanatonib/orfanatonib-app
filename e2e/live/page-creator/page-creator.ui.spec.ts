import { countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  PNG_1X1,
  captureFormData,
  deletePage,
  openCreator,
  parseJsonField,
  readCapturedForm,
} from "./support";

/**
 * Rede de segurança do refactor dos criadores de página (plano 40): cria cada
 * tipo pelo formulário real, confere o request e o banco e limpa depois.
 */
test.describe.serial("Criadores de página (admin) — criação pelo formulário", () => {
  test.beforeEach(async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await captureFormData(page);
  });

  test("galeria de fotos: valida, cria com uma imagem enviada e grava no banco", async ({ page, request }) => {
    const title = `Galeria ${RUN_TAG}`;
    await openCreator(page, "page-template-card-gallery");

    // Validação: salvar vazio mostra o aviso e não envia nada.
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("O título da galeria é obrigatório.")).toBeVisible();

    await page.getByLabel("Título da Galeria").fill(title);
    await page.getByLabel("Descrição da Galeria").fill("Descrição da galeria do cenário");
    await page.getByRole("button", { name: "+ Nova Seção" }).click();
    await page.getByLabel("Título/Legenda da seção").fill("Seção do cenário");
    await page.getByLabel("Descrição da seção").fill("Descrição da seção do cenário");
    await page.getByRole("button", { name: "+ Adicionar Imagem" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "foto.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(dialog.getByAltText("Preview 1")).toBeVisible();
    await dialog.getByRole("button", { name: "Adicionar" }).click();

    const posted = page.waitForResponse(
      (r) => r.url().endsWith("/image-pages") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Salvar" }).click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };

    try {
      const form = await readCapturedForm(page);
      const payload = parseJsonField<{
        title: string;
        public: boolean;
        sections: Array<{ caption: string; mediaItems: Array<{ fieldKey: string; mediaType: string }> }>;
      }>(form, "imageData");
      expect(payload.title).toBe(title);
      expect(payload.public).toBe(true);
      expect(payload.sections).toHaveLength(1);
      expect(payload.sections[0].caption).toBe("Seção do cenário");
      expect(payload.sections[0].mediaItems[0]).toMatchObject({
        fieldKey: "file_sec0_mid0",
        mediaType: "image",
      });
      expect(form.files).toEqual(["file_sec0_mid0"]);
      await expect.poll(() => countRows("image_pages", { name: title })).toBe(1);
    } finally {
      await deletePage(request, "image-pages", body.id);
    }
    await expect.poll(() => countRows("image_pages", { name: title })).toBe(0);
  });

  test("galeria de vídeos: valida, cria com um link e grava no banco", async ({ page, request }) => {
    const title = `Vídeos ${RUN_TAG}`;
    await openCreator(page, "page-template-card-videos");

    await page.getByRole("button", { name: "Salvar Página" }).click();
    await expect(page.getByText("O título da galeria é obrigatório.")).toBeVisible();

    await page.getByLabel("Título da Galeria").fill(title);
    await page.getByLabel("Descrição da Galeria").fill("Descrição dos vídeos do cenário");
    await page.getByRole("button", { name: "Adicionar Vídeo" }).click();
    await expect(page.getByText("Campo obrigatório").first()).toBeVisible();

    await page.getByLabel("Título do Vídeo").fill("Vídeo do cenário");
    await page.getByLabel("Descrição do Vídeo").fill("Descrição do vídeo");
    await page.getByLabel(/URL do Vídeo/).fill("https://example.com/nao-youtube");
    await expect(page.getByLabel(/URL do Vídeo/)).toHaveValue("https://example.com/nao-youtube");
    // O blur do campo desloca o layout e pode engolir o primeiro clique: repete até agir.
    await expect(async () => {
      await page.getByRole("button", { name: "Adicionar Vídeo" }).click();
      await expect(page.getByText("URL inválida para a plataforma selecionada.")).toBeVisible({ timeout: 1500 });
    }).toPass();
    await page.getByLabel(/URL do Vídeo/).fill("https://youtu.be/abc123");
    await expect(async () => {
      await page.getByRole("button", { name: "Adicionar Vídeo" }).click();
      await expect(page.getByRole("heading", { name: /Vídeos Adicionados|Vídeo do cenário/ }).first()).toBeVisible({ timeout: 1500 });
    }).toPass();

    const posted = page.waitForResponse(
      (r) => r.url().endsWith("/video-pages") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Salvar Página" }).click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };

    try {
      const form = await readCapturedForm(page);
      const payload = parseJsonField<{
        title: string;
        public: boolean;
        videos: Array<Record<string, unknown>>;
      }>(form, "videosPageData");
      expect(payload.title).toBe(title);
      expect(payload.public).toBe(true);
      expect(payload.videos).toHaveLength(1);
      expect(payload.videos[0]).toMatchObject({
        title: "Vídeo do cenário",
        uploadType: "link",
        isLocalFile: false,
        url: "https://youtu.be/abc123",
        platformType: "youtube",
        mediaType: "video",
      });
      expect(form.files).toEqual([]);
      await expect.poll(() => countRows("videos_pages", { name: title })).toBe(1);
    } finally {
      await deletePage(request, "video-pages", body.id);
    }
    await expect.poll(() => countRows("videos_pages", { name: title })).toBe(0);
  });

  test("meditação da semana: valida, cria com 5 dias e um link e grava no banco", async ({ page, request }) => {
    const topic = `Meditação ${RUN_TAG}`;
    await openCreator(page, "page-template-card-meditation");

    await page.getByRole("button", { name: "Salvar Meditação" }).click();
    await expect(page.getByText("Informe tema, data de início e fim.")).toBeVisible();

    await page.getByLabel("Tema da Meditação").fill(topic);
    await page.getByLabel("Data de Início").fill("2099-01-06");
    await page.getByLabel("Data de Término").fill("2099-01-09");
    await page.getByRole("button", { name: "Salvar Meditação" }).click();
    await expect(page.getByText("A data de início deve ser uma segunda-feira.")).toBeVisible();
    await page.getByLabel("Data de Início").fill("2099-01-05");

    const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
    for (const [index, day] of days.entries()) {
      await page.getByLabel("Dia da Semana").click();
      await page.getByRole("option", { name: day }).click();
      await page.getByLabel("Tema *").fill(`Tema ${index + 1}`);
      await page.getByLabel("Versículo *").fill(`Versículo ${index + 1}`);
      await page.getByRole("button", { name: "Adicionar Dia" }).click();
    }

    await page.getByRole("button", { name: "Salvar Meditação" }).click();
    await expect(page.getByText("Informe um link válido ou envie um arquivo.")).toBeVisible();

    await page.getByRole("button", { name: "Adicionar Doc da meditação" }).click();
    await page.getByLabel("Insira o link").fill("https://example.com/meditacao.pdf");

    const posted = page.waitForResponse(
      (r) => r.url().endsWith("/meditations") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Salvar Meditação" }).click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };

    try {
      const form = await readCapturedForm(page);
      const payload = parseJsonField<{
        topic: string;
        startDate: string;
        endDate: string;
        media: Record<string, unknown>;
        days: Array<{ day: string; topic: string; verse: string }>;
      }>(form, "meditationData");
      expect(payload).toMatchObject({ topic, startDate: "2099-01-05", endDate: "2099-01-09" });
      expect(payload.days.map((d) => d.day)).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
      expect(payload.media).toMatchObject({
        title: topic,
        mediaType: "document",
        uploadType: "link",
        url: "https://example.com/meditacao.pdf",
        isLocalFile: false,
        platformType: "ANY",
      });
      expect(form.files).toEqual([]);
      await expect.poll(() => countRows("meditations", { topic })).toBe(1);
      await expect(page).toHaveURL(/\/adm\/meditacoes$/);
    } finally {
      await deletePage(request, "meditations", body.id);
    }
    await expect.poll(() => countRows("meditations", { topic })).toBe(0);
  });

  test("material de visita: valida, cria sem mídia e grava no banco", async ({ page, request }) => {
    const title = `Material ${RUN_TAG}`;
    await openCreator(page, "page-template-card-visit-materials");

    await page.getByRole("button", { name: "Salvar Página" }).click();
    await expect(page.getByText("Preencha todos os campos obrigatórios.")).toBeVisible();

    await page.getByRole("textbox", { name: /Título da Página/ }).fill(title);
    await page.getByRole("textbox", { name: /Subtítulo da Página/ }).fill("Subtítulo do cenário");
    await page.getByRole("textbox", { name: /Descrição da Página/ }).fill("Descrição do cenário");
    await page.getByTestId("visit-material-page-editor-testament").getByRole("combobox").click();
    await page.getByRole("option", { name: /Novo Testamento/ }).click();

    const posted = page.waitForResponse(
      (r) => r.url().endsWith("/visit-material-pages") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Salvar Página" }).click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };

    try {
      const form = await readCapturedForm(page);
      const payload = parseJsonField<Record<string, unknown>>(form, "visitMaterialsPageData");
      expect(payload).toMatchObject({
        pageTitle: title,
        pageSubtitle: "Subtítulo do cenário",
        pageDescription: "Descrição do cenário",
        testament: "NEW_TESTAMENT",
      });
      expect(form.files).toEqual([]);
      await expect.poll(() => countRows("visit_material_pages", { title })).toBe(1);
    } finally {
      await deletePage(request, "visit-material-pages", body.id);
    }
    await expect.poll(() => countRows("visit_material_pages", { title })).toBe(0);
  });

  test("página de ideias: valida, cria com uma seção e grava no banco", async ({ page, request }) => {
    const title = `Ideias ${RUN_TAG}`;
    await openCreator(page, "page-template-card-ideas");

    await page.getByRole("button", { name: "Salvar Página" }).click();
    await expect(
      page.getByText("Preencha todos os campos obrigatórios e adicione pelo menos uma seção."),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /Título da Página/ }).fill(title);
    await page.getByRole("textbox", { name: /Descrição da Página/ }).fill("Descrição do cenário");
    await page.getByRole("button", { name: "Adicionar Seção" }).click();
    await page.getByRole("textbox", { name: "Título da Seção" }).fill("Seção do cenário");
    await page.getByRole("textbox", { name: "Descrição da Seção" }).fill("Descrição da seção");

    const posted = page.waitForResponse(
      (r) => r.url().endsWith("/ideas-pages") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Salvar Página" }).click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };

    try {
      const form = await readCapturedForm(page);
      const payload = parseJsonField<{
        title: string;
        description: string;
        sections: Array<{ title: string; description: string; medias: unknown[] }>;
      }>(form, "ideasMaterialsPageData");
      expect(payload.title).toBe(title);
      expect(payload.sections).toEqual([{ title: "Seção do cenário", description: "Descrição da seção", medias: [] }]);
      expect(form.files).toEqual([]);
      await expect.poll(() => countRows("ideas_pages", { title })).toBe(1);
    } finally {
      await deletePage(request, "ideas-pages", body.id);
    }
    await expect.poll(() => countRows("ideas_pages", { title })).toBe(0);
  });
});
