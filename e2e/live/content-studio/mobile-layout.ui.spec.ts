import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Mobile first (375×812) em todas as telas do Estúdio: o topo não fica coberto pela barra fixa "Administração",
 * não há rolagem horizontal e os alvos de toque dentro da casca têm pelo menos 44 px de altura.
 */
const FLAGS = ["content_studio", "content_studio_review", "content_studio_generation", "content_studio_provider_admin"] as const;
const before: Record<string, number> = {};
let admin = "";
let savedAudience = "";
let firstStage = "";
let packageId = "";
const CS = `${API_URL}/content-studio`;

type Pkg = { id: string; tracks: Array<{ stages: Array<{ id: string; stageType: string }> }> };

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
  const pkg = (await (
    await request.post(`${CS}/packages`, {
      headers: authHeaders(admin),
      data: { theme: `e2e-mobile ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
    })
  ).json()) as Pkg;
  packageId = pkg.id;
  savedAudience = pkg.tracks[0].audience;
  firstStage = pkg.tracks[0].stages[0].stageType;
  await request.patch(`${CS}/packages/${packageId}/stages/${pkg.tracks[0].stages[0].id}/content`, { headers: authHeaders(admin), data: { structuredContent: { title: "Deus cuida de nós" } } });
});

test.afterAll(async ({ request }) => {
  if (packageId) await request.post(`${CS}/packages/${packageId}/archive`, { headers: authHeaders(admin) });
  for (const key of FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  await closeDb();
});

const SCREENS: Array<[string, () => string]> = [
  ["visão geral", () => "/adm/estudio"],
  ["produção", () => "/adm/estudio/producao"],
  ["revisão", () => "/adm/estudio/revisao?recorte=ALL"],
  ["orientações", () => "/adm/estudio/orientacoes"],
  ["material", () => `/adm/estudio/pacotes/${packageId}`],
  ["provedores de IA", () => "/adm/config-provedores-ia"],
];

for (const [name, url] of SCREENS) {
  test(`celular — ${name}: topo visível, sem rolagem lateral e alvos de toque ≥ 44 px`, async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url());
    await expect(page.locator("main").locator("h1, h2, h3, h4, h5, h6").first()).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1200);

    const result = await page.evaluate(() => {
      const bar = document.querySelector(".MuiAppBar-root.MuiAppBar-positionFixed")?.getBoundingClientRect().bottom ?? 0;
      const first = document.querySelector("main")?.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6, [data-testid=content-studio-shell-back]");
      const small: string[] = [];
      const selector = "button, a[href], [role=button], [role=tab], [role=combobox], [role=switch]";
      // Página inteira: barra global, conteúdo e rodapé. Inputs de rádio/caixa ficam dentro de rótulos maiores.
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || style.visibility === "hidden" || style.display === "none") continue;
        if (r.left > innerWidth || r.right < 0) continue; // abas roláveis fora da tela
        if (r.height < 43.5) small.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`);
      }
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        barBottom: bar,
        titleTop: first?.getBoundingClientRect().top ?? 9999,
        backTop: null as number | null,
        small,
      };
    });

    expect(result.overflow, "rolagem horizontal").toBeLessThanOrEqual(0);
    // O primeiro elemento do cabeçalho (voltar ou título) começa abaixo da barra fixa.
    expect(result.backTop ?? result.titleTop, "topo coberto pela barra fixa").toBeGreaterThanOrEqual(result.barBottom - 1);
    expect(result.small, `alvos de toque pequenos:\n${result.small.join("\n")}`).toEqual([]);
  });
}

test("celular — PDF da etapa: em vez do iframe, botão para abrir no visualizador do aparelho", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/adm/estudio/pacotes/${packageId}?audience=${savedAudience}&stage=${firstStage}`);
  await page.getByTestId("content-studio-pdf-tab-button").click();
  await expect(page.getByTestId("content-studio-pdf-open")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("content-studio-pdf-frame")).toHaveCount(0);
  const [popup] = await Promise.all([page.waitForEvent("popup"), page.getByTestId("content-studio-pdf-open").click()]);
  // Sem visualizador de PDF (navegador de teste) a janela vira download; com ele, abre o blob. Nos dois casos abriu uma janela nova.
  expect(["about:blank", ""].includes(popup.url()) || popup.url().startsWith("blob:")).toBe(true);
});
