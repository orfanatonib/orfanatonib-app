import type { Locator, Page } from "@playwright/test";

import { SHELTER_FEED_PATH } from "../../../src/features/shelter-feed/routes";
import { RUN_TAG } from "../support/factory";
import { closeDb, countRows } from "../support/db";
import { expect, loginAs, test } from "../support/live";
import { createFeedSection, createGallery, removeGallery, removeSection } from "./feed-fixtures";

/**
 * "Momentos em destaque — <mês>": só o mês corrente, mini carrossel infinito que
 * avança a cada 5 s. O tempo é controlado por `page.clock` (nada de esperar 5 s de verdade).
 * Galerias próprias: UMA, DUAS e CINCO publicações (todas criadas agora = mês corrente).
 */
const STEP_MS = 5000;

test.describe.serial("Feed — destaques do mês", () => {
  test.describe.configure({ timeout: 240_000 });
  let admin: string;
  const galleries: Record<"one" | "two" | "five", string> = { one: "", two: "", five: "" };
  const extraSections: string[] = [];
  const tag = `${RUN_TAG} destaques`;

  const track = (page: Page) => page.getByTestId("shelter-feed-highlights-track");
  const first = (page: Page): Locator => track(page).locator("> *").first();
  const firstId = (page: Page) => first(page).getAttribute("data-section-id");
  /** Abre o feed; com `frozen` o relógio simulado para de correr sozinho (só avança com `runFor`). */
  const open = async (page: Page, key: keyof typeof galleries, frozen = false) => {
    await page.goto(`${SHELTER_FEED_PATH}?galeria=${galleries[key]}`);
    await expect(page.getByTestId("shelter-feed-highlights")).toBeVisible({ timeout: 60_000 });
    if (frozen) {
      const pageNow = await page.evaluate(() => Date.now());
      await page.clock.pauseAt(new Date(pageNow + 1000));
    }
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    const member = await loginAs(request, "member");
    const one = await createGallery(request, admin, `${tag} um`, `${tag} um-legada`);
    const two = await createGallery(request, admin, `${tag} dois`, `${tag} dois-legada`);
    const five = await createGallery(request, admin, `${tag} cinco`, `${tag} cinco-legada`);
    galleries.one = one.pageId;
    galleries.two = two.pageId;
    galleries.five = five.pageId;
    extraSections.push(await createFeedSection(request, member.accessToken, admin, two.pageId, `${tag} dois-b`, true));
    for (let n = 1; n <= 4; n += 1) {
      extraSections.push(await createFeedSection(request, member.accessToken, admin, five.pageId, `${tag} cinco-${n}`, true));
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of extraSections) await removeSection(request, admin, id);
    for (const id of Object.values(galleries)) if (id) await removeGallery(request, admin, id);
    for (const id of Object.values(galleries)) expect(await countRows("image_pages", { id })).toBe(0);
    for (const id of extraSections) expect(await countRows("image_sections", { id })).toBe(0);
    await closeDb();
  });

  test("[shelter-feed.highlights#mes] só publicações do mês corrente, com o mês no título", async ({ page }) => {
    await open(page, "five");
    const label = await page.evaluate(() => {
      const now = new Date();
      return `${now.toLocaleString("pt-BR", { month: "long" })} de ${now.getFullYear()}`;
    });
    await expect(page.getByTestId("shelter-feed-highlights-title")).toHaveText(`Momentos em destaque — ${label}`);
    await expect(page.locator('[data-testid^="shelter-feed-highlights-dot-"]')).toHaveCount(5);
  });

  test("[shelter-feed.highlights#virada-de-mes] com o relógio dois meses à frente nada é do mês: o bloco some e o feed continua", async ({ page }) => {
    await page.clock.install({ time: new Date(Date.now() + 70 * 24 * 3600 * 1000) });
    await page.goto(`${SHELTER_FEED_PATH}?galeria=${galleries.five}`);
    await expect(page.getByTestId("shelter-feed-timeline-stream")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("shelter-feed-highlights-empty")).toBeHidden();
    await expect(page.getByTestId("shelter-feed-highlights")).toHaveCount(0);
  });

  test("[shelter-feed.highlights#avanca-5s] avança sozinho a cada 5 s e dá a volta no fim", async ({ page }) => {
    await page.clock.install();
    await open(page, "five", true);
    const order: Array<string | null> = [await firstId(page)];
    for (let step = 0; step < 6; step += 1) {
      await page.clock.runFor(STEP_MS);
      order.push(await firstId(page));
    }
    const distinct = new Set(order.slice(0, 5));
    expect(distinct.size).toBe(5);
    expect(order[5]).toBe(order[0]);
    expect(order[6]).toBe(order[1]);

  });

  test("[shelter-feed.highlights#pausa] pausa com mouse e com foco, e retoma ao sair", async ({ page }) => {
    await page.clock.install();
    await open(page, "five", true);
    const start = await firstId(page);
    await page.getByTestId("shelter-feed-highlights").hover();
    await expect(page.getByTestId("shelter-feed-highlights")).toHaveAttribute("data-paused", "true");
    await page.clock.runFor(STEP_MS * 3);
    expect(await firstId(page)).toBe(start);

    await page.mouse.move(2, 2);
    await expect(page.getByTestId("shelter-feed-highlights")).toHaveAttribute("data-paused", "false");
    await page.clock.runFor(STEP_MS);
    expect(await firstId(page)).not.toBe(start);

    const current = await firstId(page);
    await page.getByTestId("shelter-feed-highlights-next").focus();
    await expect(page.getByTestId("shelter-feed-highlights")).toHaveAttribute("data-paused", "true");
    await page.clock.runFor(STEP_MS * 2);
    expect(await firstId(page)).toBe(current);
  });

  test("[shelter-feed.highlights#botoes-e-pontos] anterior/próximo/pontos navegam; leitor de tela é avisado só na navegação manual", async ({ page }) => {
    await page.clock.install();
    await open(page, "five", true);
    const live = page.getByTestId("shelter-feed-highlights-live");
    await expect(live).toHaveText("");
    await page.clock.runFor(STEP_MS);
    await expect(live).toHaveText("");

    const dot = (n: number) => page.locator('[data-testid^="shelter-feed-highlights-dot-"]').nth(n);
    await dot(2).click();
    await expect(dot(2)).toHaveAttribute("aria-current", "true");
    await expect(live).toContainText("Destaque 3 de 5");
    const third = await firstId(page);
    await page.getByTestId("shelter-feed-highlights-prev").click();
    await expect(dot(1)).toHaveAttribute("aria-current", "true");
    await page.getByTestId("shelter-feed-highlights-next").click();
    expect(await firstId(page)).toBe(third);
    for (const button of ["shelter-feed-highlights-prev", "shelter-feed-highlights-next"]) {
      const box = await page.getByTestId(button).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(43.9);
      expect(box!.height).toBeGreaterThanOrEqual(43.9);
    }
  });

  test("[shelter-feed.highlights#poucos-itens] com 1 e com 2 publicações o loop continua sem vazio nem pulo", async ({ page }) => {
    await page.clock.install();
    await open(page, "one", true);
    await expect(page.locator('[data-testid^="shelter-feed-highlights-dot-"]')).toHaveCount(1);
    const sectionOf = async () => (await firstId(page))!;
    const only = await sectionOf();
    expect(await first(page).getAttribute("data-testid")).not.toContain("-copy-");
    await page.clock.runFor(STEP_MS);
    expect(await sectionOf()).toBe(only);
    expect(await first(page).getAttribute("data-testid")).toContain("-copy-1");
    await page.clock.runFor(STEP_MS * 10);
    await expect(track(page).locator("> *").first()).toBeVisible();
    expect(await track(page).locator("> *").count()).toBeGreaterThanOrEqual(6);

    await page.clock.resume(); // o relógio parado também congelaria o carregamento da próxima galeria
    await open(page, "two", true);
    const a = await sectionOf();
    await page.clock.runFor(STEP_MS);
    const b = await sectionOf();
    expect(b).not.toBe(a);
    await page.clock.runFor(STEP_MS);
    expect(await sectionOf()).toBe(a);
  });

  test("[shelter-feed.highlights#movimento-reduzido] com prefers-reduced-motion não gira sozinho; os botões funcionam", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await open(page, "five", true);
    const start = await firstId(page);
    await page.clock.runFor(STEP_MS * 3);
    expect(await firstId(page)).toBe(start);
    await expect(page.getByTestId("shelter-feed-highlights-state")).toContainText("botões");
    await page.getByTestId("shelter-feed-highlights-next").click();
    expect(await firstId(page)).not.toBe(start);
  });

  test("[shelter-feed.highlights#abrir] clicar no destaque abre o lightbox da publicação", async ({ page }) => {
    await open(page, "two");
    const target = await firstId(page);
    await first(page).click();
    const dialog = page.getByTestId("shelter-feed-lightbox-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("shelter-feed-lightbox-counter")).toHaveText("1 / 1");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(target).not.toBeNull();
  });

  test("[shelter-feed.highlights#mobile] @mobile 375×812: sem rolagem horizontal da página e toque pausa o carrossel", async ({ page }) => {
    await page.clock.install();
    await open(page, "five", true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    const box = await page.getByTestId("shelter-feed-highlights").boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    const start = await firstId(page);
    await page.getByTestId("shelter-feed-highlights").dispatchEvent("touchstart", { touches: [], changedTouches: [] });
    await expect(page.getByTestId("shelter-feed-highlights")).toHaveAttribute("data-paused", "true");
    await page.clock.runFor(STEP_MS * 2);
    expect(await firstId(page)).toBe(start);
    await page.getByTestId("shelter-feed-highlights").dispatchEvent("touchend", { touches: [], changedTouches: [] });
    await page.clock.runFor(4100);
    await expect(page.getByTestId("shelter-feed-highlights")).toHaveAttribute("data-paused", "false");
    await page.clock.runFor(STEP_MS);
    expect(await firstId(page)).not.toBe(start);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
