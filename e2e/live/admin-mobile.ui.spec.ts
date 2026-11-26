import { expect, loginAs, seedBrowserSession, test } from "./support/live";

/**
 * Mobile first no painel admin (375×812): em cada tela, o topo não fica atrás da barra fixa "Administração",
 * não há rolagem horizontal e todo alvo de toque tem pelo menos 44 px de altura. O piso vem do tema
 * (`theme/mobileTouchTheme.ts`); este teste pega a tela que o furar com um tamanho fixo.
 * As telas do Estúdio têm o próprio teste (`content-studio/mobile-layout.ui.spec.ts`).
 */
const PATHS = [
  "",
  "presenca",
  "presenca/pendencias",
  "meditacoes",
  "comentarios",
  "documentos",
  "informativos",
  "feedbacks",
  "contatos",
  "paginas-materiais-visita",
  "paginas-fotos",
  "fotos-abrigos",
  "ideias-compartilhadas",
  "paginas-videos",
  "paginas-ideias",
  "criar-pagina",
  "usuarios",
  "perfis",
  "lideres",
  "membros",
  "acolhidos",
  "abrigos",
  "abrigos/novo",
  "pagelas",
  "agendamentos",
  "antecedentes",
  "observabilidade-auditoria",
  "feature-flags",
  "editar-meditacao",
  "editar-pagina-visita",
  "editar-pagina-ideias",
  "editar-imagens-shelter",
  "editar-ideias-compartilhadas",
  "relatorios-visita",
  "relatorios/pendencias",
];
// Um lote por teste: o navegador do teste perde recursos se uma única página visita dezenas de telas.
const BATCHES = 5;

for (let batch = 0; batch < BATCHES; batch++) {
  const paths = PATHS.filter((_, index) => index % BATCHES === batch);
  test(`painel admin no celular — lote ${batch + 1}/${BATCHES}`, async ({ page, request }) => {
    test.setTimeout(300_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    const problems: string[] = [];

    for (const path of paths) {
      const url = `/adm${path ? `/${path}` : ""}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      const result = await page.evaluate(() => {
        const bar = document.querySelector(".MuiAppBar-root.MuiAppBar-positionFixed")?.getBoundingClientRect().bottom ?? 0;
        const main = document.querySelector("main");
        const first = main?.querySelector<HTMLElement>("h1,h2,h3,h4,h5,h6,button,a[href],input");
        const small: string[] = [];
        const selector = "button, a[href], [role=button], [role=tab], [role=combobox], [role=switch], [role=menuitem]";
        for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.width === 0 || rect.height === 0 || style.visibility === "hidden" || style.display === "none") continue;
          if (rect.left > innerWidth || rect.right < 0 || el.closest(".MuiTabs-scroller")) continue; // abas roláveis
          if (rect.height < 43.5) small.push(`${el.tagName} ${Math.round(rect.width)}x${Math.round(rect.height)} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28)}"`);
        }
        return {
          path: location.pathname,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          covered: first ? first.getBoundingClientRect().top < bar - 1 : false,
          small: small.slice(0, 8),
        };
      });
      if (!result.path.startsWith("/adm")) continue; // sem item selecionado a tela redireciona para fora do painel
      if (result.overflow > 0) problems.push(`${url}: rolagem horizontal de ${result.overflow}px`);
      if (result.covered) problems.push(`${url}: topo coberto pela barra fixa`);
      if (result.small.length) problems.push(`${url}: alvos pequenos → ${result.small.join("; ")}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
