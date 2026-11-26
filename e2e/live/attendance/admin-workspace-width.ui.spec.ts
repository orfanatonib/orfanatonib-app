import type { Page } from "@playwright/test";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Largura útil das telas do fluxo abrigo → agendamento → presença: 95% da área ao
 * lado da gaveta no desktop e 98% da tela no celular, sem rolagem horizontal.
 */
const SCREENS = [
  { name: "abrigos", path: "/adm/abrigos", content: "shelters-manager-frame" },
  { name: "agendamentos", path: "/adm/agendamentos", content: "shelter-schedule-manager-frame" },
  { name: "presença · lançar", path: "/adm/presenca/lancar", content: "attendance-content" },
  { name: "presença · consultar", path: "/adm/presenca/consultar", content: "attendance-content" },
  { name: "presença · pendências", path: "/adm/presenca/pendencias", content: "attendance-content" },
  { name: "relatórios das visitas", path: "/adm/relatorios-visita", content: "visit-reports-manager-frame" },
  { name: "relatórios · pendências", path: "/adm/relatorios/pendencias", content: "visit-reports-pendings-page" },
] as const;

type Box = { contentWidth: number; areaWidth: number; overflow: boolean };

async function measure(page: Page, testId: string): Promise<Box> {
  return page.evaluate((id): Box => {
    const content = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    const main = document.querySelector<HTMLElement>('[data-testid="admin-main"]');
    if (!content || !main) throw new Error(`faltou ${id} ou admin-main`);
    return {
      contentWidth: content.getBoundingClientRect().width,
      areaWidth: main.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, testId);
}

test.describe("Largura das telas do fluxo de presença", () => {
  for (const screen of SCREENS) {
    test(`desktop: ${screen.name} ocupa 95% da área`, async ({ page, request }) => {
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(screen.path);
      await expect(page.getByTestId(screen.content)).toBeVisible({ timeout: 20_000 });
      const box = await measure(page, screen.content);
      expect(box.contentWidth / box.areaWidth).toBeGreaterThan(0.945);
      expect(box.contentWidth / box.areaWidth).toBeLessThan(0.955);
      expect(box.overflow).toBe(false);
    });

    test(`@mobile ${screen.name} ocupa 98% da tela sem rolagem lateral`, async ({ page, request }) => {
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.goto(screen.path);
      await expect(page.getByTestId(screen.content)).toBeVisible({ timeout: 20_000 });
      const box = await measure(page, screen.content);
      expect(box.contentWidth / box.areaWidth).toBeGreaterThan(0.975);
      expect(box.contentWidth / box.areaWidth).toBeLessThan(0.985);
      expect(box.overflow).toBe(false);
    });
  }
});
