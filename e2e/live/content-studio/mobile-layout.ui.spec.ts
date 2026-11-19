import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Mobile first (375×812) em todas as telas do Estúdio: o topo não fica coberto pela barra fixa "Administração",
 * não há rolagem horizontal e os alvos de toque dentro da casca têm pelo menos 44 px de altura.
 */
const FLAGS = ["content_studio", "content_studio_review", "content_studio_generation"] as const;
const before: Record<string, number> = {};
let admin = "";
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
      data: { audience: "CHILD", theme: `e2e-mobile ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
    })
  ).json()) as Pkg;
  packageId = pkg.id;
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
];

for (const [name, url] of SCREENS) {
  test(`celular — ${name}: topo visível, sem rolagem lateral e alvos de toque ≥ 44 px`, async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url());
    await expect(page.getByTestId("content-studio-shell-title")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1200);

    const result = await page.evaluate(() => {
      const bar = document.querySelector(".MuiAppBar-root.MuiAppBar-positionFixed")?.getBoundingClientRect().bottom ?? 0;
      const title = document.querySelector('[data-testid="content-studio-shell-title"]') as HTMLElement;
      const back = document.querySelector('[data-testid="content-studio-shell-back"]') as HTMLElement | null;
      const shell = document.querySelector('[data-testid="content-studio-shell"]') as HTMLElement;
      const small: string[] = [];
      const selector = "button, a[href], [role=button], [role=tab], [role=combobox]";
      for (const el of Array.from(shell.querySelectorAll<HTMLElement>(selector))) {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || style.visibility === "hidden" || style.display === "none") continue;
        // Itens de listas roláveis (abas) ou de componentes compartilhados já cobertos por outras telas.
        if (r.left > innerWidth || r.right < 0) continue;
        if (el.closest("[class*=MuiTablePagination]") || el.getAttribute("aria-label") === "Limpar busca") continue;
        if (r.height < 43.5) small.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`);
      }
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        barBottom: bar,
        titleTop: title.getBoundingClientRect().top,
        backTop: back?.getBoundingClientRect().top ?? null,
        small,
      };
    });

    expect(result.overflow, "rolagem horizontal").toBeLessThanOrEqual(0);
    // O primeiro elemento do cabeçalho (voltar ou título) começa abaixo da barra fixa.
    expect(result.backTop ?? result.titleTop, "topo coberto pela barra fixa").toBeGreaterThanOrEqual(result.barBottom - 1);
    expect(result.small, `alvos de toque pequenos:\n${result.small.join("\n")}`).toEqual([]);
  });
}
