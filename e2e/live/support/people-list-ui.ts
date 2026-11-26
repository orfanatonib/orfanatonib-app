import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Apoio dos E2E de UI das telas de pessoas (acolhidos, membros): ids visíveis, resumo da paginação,
 * medidas da casca (largura e estabilidade) e observador de esqueleto. Só lê o DOM real.
 */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** Ids (UUID) dos itens visíveis: linhas da tabela (`rowPrefix-<id>`) e cartões (`cardPrefix-<id>`). */
export async function visibleIds(page: Page, kind: "row" | "card", prefix: string): Promise<string[]> {
  const pattern = `^${prefix}-${kind}-(${UUID})$`;
  return page.evaluate((source) => {
    const re = new RegExp(source);
    return Array.from(document.querySelectorAll("[data-testid]"))
      .map((el) => re.exec(el.getAttribute("data-testid") ?? "")?.[1])
      .filter((id): id is string => Boolean(id));
  }, pattern);
}


export const summaryOf = (page: Page, prefix: string): Locator => page.getByTestId(`${prefix}-pagination-summary`);

/** "13–14 de 14" -> 14. */
export async function totalFromSummary(page: Page, prefix: string): Promise<number> {
  const text = (await summaryOf(page, prefix).textContent()) ?? "";
  const match = /(\d+)\s*(?:itens)?$/.exec(text.trim());
  return match ? Number(match[1]) : 0;
}

export const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

/** Troca de filtro seleciona a opção de um `AdminListToolbar` select (`<prefix>-filter-<key>`). */
export async function pickFilter(page: Page, prefix: string, key: string, value: string): Promise<void> {
  await page.getByTestId(`${prefix}-filter-${key}`).locator("xpath=..").getByRole("combobox").click();
  await page.getByTestId(`${prefix}-filter-${key}-option-${value === "" ? "all" : value}`).click();
}

/** Abre o painel de filtros no celular (no desktop os campos já estão visíveis). */
export async function openFiltersIfMobile(page: Page, prefix: string): Promise<void> {
  const toggle = page.getByTestId(`${prefix}-toolbar-toggle-filters`);
  if ((await toggle.count()) > 0 && (await toggle.isVisible())) {
    const sample = page.getByTestId(`${prefix}-toolbar-clear-filters`);
    if (!(await sample.isVisible())) await toggle.click();
    await expect(sample).toBeVisible();
  }
}

export type ShellBox = {
  frame: { x: number; y: number; width: number };
  toolbar: { x: number; y: number; width: number; height: number };
};

export async function measureShell(page: Page, prefix: string): Promise<ShellBox> {
  // Posição de layout, independente da rolagem: paginar rola a tela, e isso não é "dança" do layout.
  return page.evaluate((id): ShellBox => {
    const rect = (testId: string) => {
      const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
      if (!el) throw new Error(`faltou ${testId}`);
      const box = el.getBoundingClientRect();
      // offsetTop/Left somam a posição de layout (sem rolagem), mesmo se a rolagem for de um contêiner interno.
      let x = 0;
      let y = 0;
      for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
        x += node.offsetLeft;
        y += node.offsetTop;
      }
      return { x, y, width: box.width, height: box.height };
    };
    const frame = rect(`${id}-manager-frame`);
    const toolbar = rect(`${id}-toolbar`);
    return { frame: { x: frame.x, y: frame.y, width: frame.width }, toolbar };
  }, prefix);
}

/** Tolerância de 1px entre duas medidas da casca (tela não pode "dançar"). */
export function expectSameShell(actual: ShellBox, expected: ShellBox, label: string): void {
  for (const key of ["x", "y", "width"] as const) {
    expect(Math.abs(actual.frame[key] - expected.frame[key]), `${label}: frame.${key}`).toBeLessThanOrEqual(1);
  }
  for (const key of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(actual.toolbar[key] - expected.toolbar[key]), `${label}: toolbar.${key}`).toBeLessThanOrEqual(1);
  }
}

/**
 * Razão entre a largura do frame da tela e a de `admin-main` inteiro (95% no desktop, 98% no mobile).
 */
export async function widthRatio(page: Page, prefix: string): Promise<{ ratio: number; overflow: boolean }> {
  return page.evaluate((id) => {
    const frame = document.querySelector<HTMLElement>(`[data-testid="${id}-manager-frame"]`);
    const main = document.querySelector<HTMLElement>('[data-testid="admin-main"]');
    if (!frame || !main) throw new Error(`faltou ${id}-manager-frame ou admin-main`);
    return {
      ratio: frame.getBoundingClientRect().width / main.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, prefix);
}

/**
 * Observa o DOM desde o primeiro quadro e conta quantas vezes o esqueleto (`<prefix>-loading`) apareceu.
 * Instalar ANTES do `goto`; `resetSkeletonCount` zera depois da carga inicial.
 */
export async function watchSkeleton(page: Page, prefix: string): Promise<void> {
  await page.addInitScript((id) => {
    const w = window as unknown as { __skeletonSeen: number };
    w.__skeletonSeen = 0;
    const selector = `[data-testid="${id}-loading"]`;
    let present = false;
    const check = () => {
      const now = Boolean(document.querySelector(selector));
      if (now && !present) w.__skeletonSeen += 1;
      present = now;
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true });
  }, prefix);
}

export const skeletonCount = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as { __skeletonSeen?: number }).__skeletonSeen ?? 0);

export const resetSkeletonCount = (page: Page): Promise<void> =>
  page.evaluate(() => {
    (window as unknown as { __skeletonSeen: number }).__skeletonSeen = 0;
  });

/** Overflow horizontal da página (qualquer rolagem lateral). */
export const hasHorizontalOverflow = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
