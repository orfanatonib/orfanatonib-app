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
});
