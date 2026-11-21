import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { closeDb, countRows, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Erro REAL da API exibido ao usuário (plano 04): o admin abre a edição de um
 * abrigo que não existe, a API responde 404 de verdade (nada é interceptado ou
 * simulado) e o aviso da tela mostra o `requestId` — que tem de ser o mesmo do
 * cabeçalho `X-Request-Id` e do corpo da resposta. O banco não muda.
 */
const REQUEST_ID_RE = /^[0-9a-f-]{36}$/;

test.afterAll(async () => closeDb());

async function openMissingShelter(page: Page) {
  const missingId = randomUUID();
  const response = page.waitForResponse(
    (res) => res.url().includes(`/shelters/${missingId}`) && res.request().method() === "GET",
  );
  await page.goto(`/adm/abrigos/${missingId}/edit`);
  return { missingId, res: await response };
}

async function assertToastShowsServerRequestId(page: Page, res: Awaited<ReturnType<Page["waitForResponse"]>>) {
  expect(res.status()).toBe(404);
  const header = res.headers()["x-request-id"];
  expect(header).toMatch(REQUEST_ID_RE);
  const body = (await res.json()) as { requestId: string; category: string };
  expect(body.requestId, "corpo = cabeçalho").toBe(header);

  const description = page.getByTestId("global-notification-description").filter({ hasText: header });
  await expect(description.first()).toBeVisible({ timeout: 20_000 });
  await expect(description.first()).toContainText(`Código do erro: ${header}`);
  return header;
}

test("[http-errors-observability.ui.shelters-id#codigo-do-erro-na-tela] 404 real: a tela mostra o requestId do cabeçalho e o banco não muda", async ({
  page,
  request,
}) => {
  const before = await countRows("shelters");
  await seedBrowserSession(page, await loginAs(request, "admin"));

  const { missingId, res } = await openMissingShelter(page);
  await assertToastShowsServerRequestId(page, res);
  await expect(page.getByTestId("global-notification-title").first()).toHaveText("Não encontrado");

  expect(await countRows("shelters")).toBe(before);
  expect(await queryOne("SELECT id FROM shelters WHERE id = ?", [missingId])).toBeFalsy();
});

test("[http-errors-observability.ui.shelters-id#codigo-do-erro-mobile] @mobile 375×812: o aviso com o requestId cabe na tela, sem rolagem horizontal, e fecha com alvo de 44 px", async ({
  page,
  request,
}) => {
  const before = await countRows("shelters");
  await seedBrowserSession(page, await loginAs(request, "admin"));

  const { res } = await openMissingShelter(page);
  await assertToastShowsServerRequestId(page, res);

  const toast = page.getByTestId("global-notification").first();
  const box = await toast.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const close = page.getByTestId("global-notification-close").first();
  const closeBox = await close.boundingBox();
  expect(closeBox!.width).toBeGreaterThanOrEqual(44);
  expect(closeBox!.height).toBeGreaterThanOrEqual(44);
  const shownBefore = await page.getByTestId("global-notification").count();
  await close.click();
  // Fechar remove exatamente o aviso clicado (a tela pode ter disparado mais de uma leitura).
  await expect(page.getByTestId("global-notification")).toHaveCount(shownBefore - 1);

  expect(await countRows("shelters")).toBe(before);
});
