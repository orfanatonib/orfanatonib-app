import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { PNG_1X1 } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans, listObjects, uploadsPrefix } from "../support/s3";

/**
 * Componente de upload da foto de perfil (`ProfileImageUpload`) contra a pilha real: front → API → MySQL → S3 (LocalStack).
 * Nada é interceptado: o erro de API vem de bytes inválidos de verdade, o progresso vem de um envio real (limitado
 * pela rede do navegador, não por mock). Cada cenário prova o efeito por SELECT e pela listagem do bucket; os negativos
 * provam banco e bucket inalterados e que NENHUMA requisição de upload saiu do navegador (validação no cliente).
 */
const MB = 1024 * 1024;
let userId: string;
let token: string;

const mediaRows = () =>
  queryAll<{ url: string; storageKey: string | null; isLocalFile: number }>(
    "SELECT url, storageKey, isLocalFile FROM media_items WHERE targetId = ? AND targetType = 'UserEntity' ORDER BY createdAt",
    [userId],
  );
const userObjects = () => listObjects(`${uploadsPrefix()}User/${userId}/`);

/** Conta as requisições `PATCH /profile/image` que o navegador de fato enviou. */
function trackUploads(page: Page): { count: () => number } {
  let sent = 0;
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes("/profile/image")) sent += 1;
  });
  return { count: () => sent };
}

async function openPhotoTab(page: Page): Promise<void> {
  await page.goto("/perfil#foto");
  await expect(page.getByTestId("profile-image-upload")).toBeVisible({ timeout: 20_000 });
}

/**
 * Envia e espera a resposta REAL da API. A mensagem de sucesso do componente não é asserida: o `App` mostra a tela
 * de carregamento enquanto recarrega o usuário (`loadingUser`) e remonta a aba (resíduo registrado no plano 05);
 * o resultado visível e estável é a foto nova no avatar.
 */
async function submitAndWaitForApi(page: Page): Promise<void> {
  const response = page.waitForResponse(
    (res) => res.request().method() === "PATCH" && res.url().includes("/profile/image"),
    { timeout: 60_000 },
  );
  await page.getByTestId("profile-image-submit").click();
  expect((await response).status()).toBe(200);
}

const pngFile = (name: string, size?: number) => ({
  name,
  mimeType: "image/png",
  buffer: size ? Buffer.concat([PNG_1X1, Buffer.alloc(size - PNG_1X1.length, 1)]) : PNG_1X1,
});

test.describe.serial("Upload de foto de perfil — UI full-stack", () => {
  test.beforeAll(async ({ request }) => {
    const login = await loginAs(request, "leader");
    userId = login.userId;
    token = login.accessToken;
  });

  test.beforeEach(async ({ page, request }) => {
    // O token do beforeAll pode ter expirado entre cenários longos: renova a sessão do navegador.
    const login = await loginAs(request, "leader");
    token = login.accessToken;
    await seedBrowserSession(page, login);
  });

  test.afterAll(async ({ request }) => {
    // Limpeza: troca a foto por um link (apaga o objeto) e confere 0 objetos do usuário no bucket.
    await request.patch(`${API_URL}/profile/image`, {
      headers: authHeaders(token),
      data: { title: "Link", url: "https://example.com/foto.png", uploadType: "link" },
    });
    expect(await userObjects()).toEqual([]);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  test("[media-upload.ui#vazio] sem arquivo escolhido: enviar fica desabilitado e nada é mostrado como selecionado", async ({ page }) => {
    await openPhotoTab(page);
    await expect(page.getByTestId("profile-image-submit")).toBeDisabled();
    await expect(page.getByTestId("profile-image-selected")).toHaveCount(0);
    await expect(page.getByTestId("profile-image-progress")).toHaveCount(0);
  });

  test("[media-upload.ui#validacao-tipo] PDF escolhido como foto: recusado no cliente, sem requisição, banco e bucket inalterados", async ({ page }) => {
    const uploads = trackUploads(page);
    const rowsBefore = await mediaRows();
    const objectsBefore = await userObjects();
    await openPhotoTab(page);

    await page.getByTestId("profile-image-input").setInputFiles({
      name: "documento.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 teste"),
    });

    await expect(page.getByTestId("profile-error")).toContainText("Formato não aceito para imagem");
    await expect(page.getByTestId("profile-error")).toContainText("JPG, PNG, WEBP, GIF");
    await expect(page.getByTestId("profile-image-selected")).toHaveCount(0);
    await expect(page.getByTestId("profile-image-submit")).toBeDisabled();
    expect(uploads.count()).toBe(0);
    expect(await mediaRows()).toEqual(rowsBefore);
    expect(await userObjects()).toEqual(objectsBefore);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[media-upload.ui#validacao-tamanho] imagem de 11 MB: recusada no cliente (limite 10 MB), sem requisição, banco e bucket inalterados", async ({ page }) => {
    const uploads = trackUploads(page);
    const rowsBefore = await mediaRows();
    const objectsBefore = await userObjects();
    await openPhotoTab(page);

    await page.getByTestId("profile-image-input").setInputFiles(pngFile("grande.png", 11 * MB));

    await expect(page.getByTestId("profile-error")).toContainText("máximo para imagem é 10 MB");
    await expect(page.getByTestId("profile-image-submit")).toBeDisabled();
    expect(uploads.count()).toBe(0);
    expect(await mediaRows()).toEqual(rowsBefore);
    expect(await userObjects()).toEqual(objectsBefore);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[media-upload.ui#erro-api-real] HTML disfarçado de PNG passa pelo cliente e a API recusa de verdade: mensagem visível, banco e bucket inalterados", async ({ page }) => {
    const uploads = trackUploads(page);
    const rowsBefore = await mediaRows();
    const objectsBefore = await userObjects();
    await openPhotoTab(page);

    await page.getByTestId("profile-image-input").setInputFiles({
      name: "falso.png",
      mimeType: "image/png",
      buffer: Buffer.from("<html><script>alert(1)</script></html>"),
    });
    await expect(page.getByTestId("profile-image-selected")).toContainText("falso.png");
    await page.getByTestId("profile-image-submit").click();

    await expect(page.getByTestId("profile-error")).toContainText("recusado");
    await expect(page.getByTestId("profile-image-success")).toHaveCount(0);
    expect(uploads.count()).toBe(1);
    expect(await mediaRows()).toEqual(rowsBefore);
    expect(await userObjects()).toEqual(objectsBefore);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[media-upload.ui#feliz] enviar a foto: foto nova no avatar, linha com storageKey, objeto no bucket e a mesma foto após recarregar", async ({ page }) => {
    await openPhotoTab(page);

    await page.getByTestId("profile-image-input").setInputFiles(pngFile("perfil.png"));
    await expect(page.getByTestId("profile-image-selected")).toContainText("perfil.png");
    await submitAndWaitForApi(page);

    const rows = await mediaRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(1);
    expect(rows[0].storageKey).toMatch(new RegExp(`/User/${userId}/[0-9a-f-]{36}\\.png$`));
    const objects = await userObjects();
    expect(objects).toEqual([rows[0].storageKey]);

    await expect(page.getByTestId("profile-image-avatar").locator("img")).toHaveAttribute("src", rows[0].url, { timeout: 20_000 });
    await page.reload();
    await expect(page.getByTestId("profile-image-upload")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("profile-image-avatar").locator("img")).toHaveAttribute("src", rows[0].url);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[media-upload.ui#progresso] envio de 8 MB com rede limitada: barra de progresso real com percentual e depois a resposta 200", async ({ page }) => {
    await openPhotoTab(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 20,
      downloadThroughput: -1,
      uploadThroughput: 1.2 * MB,
    });
    // Registra cada texto que o rótulo de progresso exibe durante o envio.
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __progressSeen: string[] }).__progressSeen = seen;
      new MutationObserver(() => {
        const label = document.querySelector('[data-testid="profile-image-progress-label"]');
        if (label?.textContent) seen.push(label.textContent);
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    await page.getByTestId("profile-image-input").setInputFiles(pngFile("grande-valida.png", 8 * MB));
    const done = submitAndWaitForApi(page);
    await expect(page.getByTestId("profile-image-progress")).toBeVisible();
    await done;

    const seen = await page.evaluate(() => (window as unknown as { __progressSeen: string[] }).__progressSeen);
    expect(seen.some((text) => /Enviando \d+%/.test(text)), `rótulos vistos: ${seen.join(" | ")}`).toBe(true);
    const rows = await mediaRows();
    expect(rows).toHaveLength(1);
    expect(await userObjects()).toEqual([rows[0].storageKey]);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[media-upload.ui#perfil-indevido] sem sessão: a tela de foto não abre e a API recusa o envio (401), banco e bucket inalterados", async ({ browser, request }) => {
    const rowsBefore = await mediaRows();
    const objectsBefore = await userObjects();
    const context = await browser.newContext();
    const anonymous = await context.newPage();
    await anonymous.goto("/perfil#foto");
    await expect(anonymous).toHaveURL(/login/, { timeout: 20_000 });
    await expect(anonymous.getByTestId("profile-image-upload")).toHaveCount(0);
    await context.close();

    const res = await request.patch(`${API_URL}/profile/image`, {
      multipart: {
        imageData: JSON.stringify({ title: "Foto", uploadType: "upload", fieldKey: "file" }),
        file: pngFile("anon.png"),
      },
    });
    expect(res.status()).toBe(401);
    expect(await mediaRows()).toEqual(rowsBefore);
    expect(await userObjects()).toEqual(objectsBefore);
  });

  test("[media-upload.ui#mobile] @mobile 375px: fluxo feliz sem rolagem horizontal e com alvos de toque >= 44px", async ({ page }) => {
    await openPhotoTab(page);
    const noHorizontalScroll = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await noHorizontalScroll()).toBe(true);

    await page.getByTestId("profile-image-input").setInputFiles(pngFile("mobile.png"));
    await expect(page.getByTestId("profile-image-selected")).toContainText("mobile.png");
    for (const id of ["profile-image-select", "profile-image-camera", "profile-image-remove", "profile-image-submit"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box, id).not.toBeNull();
      expect(box!.height, `${id} altura`).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width, `${id} cabe na tela`).toBeLessThanOrEqual(375);
    }

    await submitAndWaitForApi(page);
    await expect(page.getByTestId("profile-image-upload")).toBeVisible({ timeout: 20_000 });
    expect(await noHorizontalScroll()).toBe(true);

    const rows = await mediaRows();
    expect(rows).toHaveLength(1);
    expect(await userObjects()).toEqual([rows[0].storageKey]);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
