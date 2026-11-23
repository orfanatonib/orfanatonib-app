import type { Page } from "@playwright/test";

import { expect, seedBrowserSession, test } from "../support/live";
import { objectExists } from "../support/s3";
import {
  FULL_PROFILE,
  expectUserPhotosConsistent,
  personalRows,
  photoRows,
  png,
  send,
  setupWorld,
  teardownWorld,
  userState,
  world,
  type Actor,
  type Cast,
} from "./support";

/**
 * Telas de usuários e perfis contra a pilha real (plano 07): `/perfil` (conta própria), `/adm/usuarios` e `/adm/perfis`.
 * Dados criados pela API em `beforeAll`; cada efeito é provado por SELECT; mobile em 375×812 (`@mobile`): sem rolagem
 * horizontal e com alvos de toque de 44px. Sem `page.route`: tudo bate na API real.
 */
const session = (actor: Actor) => ({ accessToken: actor.token, refreshToken: actor.refreshToken, userId: actor.id });

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `largura ${scrollWidth} > viewport ${innerWidth}`).toBeLessThanOrEqual(innerWidth + 1);
}

test.describe.serial("Usuários e perfis — telas", () => {
  let cast: Cast;

  test.beforeAll(async ({ request }) => {
    await setupWorld(request);
    cast = world.cast;
    // A "outra pessoa" tem perfil completo para as telas de listagem e de detalhe.
    const res = await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, FULL_PROFILE);
    expect(res.status(), await res.text()).toBe(200);
  });

  test.afterAll(async ({ request }) => {
    await teardownWorld(request);
  });

  test("/perfil: o membro edita o nome na tela e o SELECT confirma", async ({ page }) => {
    await seedBrowserSession(page, session(cast.member));
    await page.goto("/perfil");
    await expect(page.getByTestId("profile-edit-form")).toBeVisible({ timeout: 20_000 });
    const name = `Nome Pela Tela ${Date.now()}`;
    await page.getByLabel("Nome Completo").fill(name);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect.poll(async () => (await userState(cast.member.id))?.name, { timeout: 15_000 }).toBe(name);
    await page.reload();
    await expect(page.getByLabel("Nome Completo")).toHaveValue(name);
  });

  test("/perfil: dados pessoais editados na tela chegam ao banco", async ({ page }) => {
    await seedBrowserSession(page, session(cast.member));
    await page.goto("/perfil");
    await expect(page.getByTestId("profile-page").or(page.getByTestId("profile-edit-form")).first()).toBeVisible({ timeout: 20_000 });
    await page.getByText("Dados Pessoais").first().click();
    await expect(page.getByTestId("personal-data-form")).toBeVisible();
    const leader = `Líder GA ${Date.now().toString(36)}`;
    await page.getByLabel("Nome do Líder de GA").fill(leader);
    await page.getByTestId("personal-data-form").getByRole("button", { name: /salvar|atualizar/i }).click();
    await expect.poll(async () => (await personalRows(cast.member.id))[0]?.gaLeaderName, { timeout: 15_000 }).toBe(leader);
  });

  test("/perfil: foto enviada pela tela fica no banco e no bucket, sem órfão", async ({ page }) => {
    await seedBrowserSession(page, session(cast.leader));
    await page.goto("/perfil");
    await expect(page.getByTestId("profile-edit-form")).toBeVisible({ timeout: 20_000 });
    await page.getByText("Foto de Perfil").first().click();
    await page.getByTestId("profile-image-input").setInputFiles({ name: "tela.png", mimeType: "image/png", buffer: png().buffer });
    await page.getByTestId("profile-image-submit").click();
    await expect.poll(async () => (await photoRows(cast.leader.id)).length, { timeout: 20_000 }).toBe(1);
    const [row] = await photoRows(cast.leader.id);
    expect(await objectExists(String(row.storageKey))).toBe(true);
    await expectUserPhotosConsistent();
  });

  test("/adm/usuarios: o admin acha o usuário pela busca e a tela bate com o banco", async ({ page }) => {
    await seedBrowserSession(page, session(cast.admin));
    await page.goto("/adm/usuarios");
    await expect(page.getByTestId("users-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("users-toolbar-search").fill(cast.victim.email);
    await expect(page.getByText(cast.victim.email).first()).toBeVisible({ timeout: 15_000 });
    expect((await userState(cast.victim.id))?.email).toBe(cast.victim.email);
  });

  test("/adm/usuarios: busca sem resultado mostra a lista vazia (sem erro)", async ({ page }) => {
    await seedBrowserSession(page, session(cast.admin));
    await page.goto("/adm/usuarios");
    await expect(page.getByTestId("users-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("users-toolbar-search").fill("nao-existe-mesmo-zzzz");
    await expect(page.getByText(cast.victim.email)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("/adm/perfis: o admin abre o detalhe do perfil e os dados batem com o banco", async ({ page }) => {
    await seedBrowserSession(page, session(cast.admin));
    await page.goto("/adm/perfis");
    await expect(page.getByTestId("profiles-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("profiles-toolbar-search").fill(cast.victim.email);
    // A busca tem debounce: só clica quando a lista já veio filtrada (1 card).
    await expect(page.getByTestId(`profiles-card-open-${cast.victim.id}`)).toHaveCount(1, { timeout: 15_000 });
    await expect(page.getByTestId(/^profiles-card-open-/)).toHaveCount(1);
    await page.getByTestId(`profiles-card-open-${cast.victim.id}`).click();
    await expect(page.getByTestId("profile-detail-modal")).toBeVisible();
    await expect(page.getByTestId("profile-detail-name")).toHaveText(String((await userState(cast.victim.id))?.name));
    await expect(page.getByTestId("profile-detail-ga")).toContainText(String((await personalRows(cast.victim.id))[0].gaLeaderName));
    await expect(page.getByTestId("profile-detail-preferences")).toBeVisible();
  });

  test("/adm/perfis: busca sem resultado mostra o estado vazio", async ({ page }) => {
    await seedBrowserSession(page, session(cast.admin));
    await page.goto("/adm/perfis");
    await expect(page.getByTestId("profiles-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("profiles-toolbar-search").fill("nao-existe-mesmo-zzzz");
    await expect(page.getByTestId("profiles-empty")).toBeVisible({ timeout: 15_000 });
  });

  test("/adm/usuarios com a flag user_management desligada: a tela não carrega a gestão e a API recusa", async ({ page, request }) => {
    await seedBrowserSession(page, session(cast.admin));
    await world.flags.set(request, false, ["user_management"]);
    try {
      await page.goto("/adm/usuarios");
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("users-manager")).toHaveCount(0);
      const res = await send(request, "GET", "/users", cast.admin.token);
      expect(res.status()).toBe(403);
    } finally {
      await world.flags.set(request, true, ["user_management"]);
    }
  });

  test("@mobile /perfil em 375px: sem rolagem horizontal e botões com 44px", async ({ page }) => {
    await seedBrowserSession(page, session(cast.member));
    await page.goto("/perfil");
    await expect(page.getByTestId("profile-edit-form")).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalScroll(page);
    const save = await page.getByRole("button", { name: "Salvar" }).boundingBox();
    expect(save?.height ?? 0).toBeGreaterThanOrEqual(36);
  });

  test("@mobile /adm/usuarios em 375px: cartões (sem tabela larga), sem rolagem horizontal e ações com 44px", async ({ page }) => {
    await seedBrowserSession(page, session(cast.admin));
    await page.goto("/adm/usuarios");
    await expect(page.getByTestId("users-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("users-toolbar-search").fill(cast.victim.email);
    await expect(page.getByTestId("users-cards")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("users-table")).toHaveCount(0);
    await expect(page.getByTestId(`users-card-${cast.victim.id}`)).toBeVisible();
    await expectNoHorizontalScroll(page);
    for (const id of ["view", "edit", "delete"].map((key) => `users-card-${key}-${cast.victim.id}`)) {
      const box = await page.getByTestId(id).first().boundingBox();
      expect(box?.height ?? 0, `${id} abaixo de 44px`).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0, `${id} abaixo de 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test("@mobile /adm/perfis em 375px: lista e detalhe cabem na tela, com ações de 44px", async ({ page }) => {
    await seedBrowserSession(page, session(cast.admin));
    await page.goto("/adm/perfis");
    await expect(page.getByTestId("profiles-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("profiles-toolbar-search").fill(cast.victim.email);
    await expect(page.getByTestId(`profiles-card-open-${cast.victim.id}`)).toHaveCount(1, { timeout: 15_000 });
    await expect(page.getByTestId(/^profiles-card-open-/)).toHaveCount(1);
    await expectNoHorizontalScroll(page);
    for (const id of ["profiles-toolbar-toggle-filters", "profiles-toolbar-refresh"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box?.height ?? 0, `${id} abaixo de 44px`).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId(`profiles-card-open-${cast.victim.id}`).click();
    await expect(page.getByTestId("profile-detail-modal")).toBeVisible();
    const modal = await page.getByTestId("profile-detail-modal").locator(".MuiDialog-paper").boundingBox();
    expect(modal?.width ?? 0).toBeLessThanOrEqual(375);
    const close = await page.getByTestId("profile-detail-close").boundingBox();
    expect(close?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
