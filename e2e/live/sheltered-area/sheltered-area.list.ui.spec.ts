import type { Page } from "@playwright/test";

import { queryAll } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { withFlagsOff } from "../support/flags";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  buildAreaWorld,
  cardIds,
  COUNT_A,
  disposeAreaWorld,
  noHorizontalScroll,
  openAs,
  P,
  PAGE_SIZE,
  pickSelect,
  type AreaWorld,
} from "./support";

/** Lista de /area-dos-acolhidos: carga, busca, filtros, paginação, ordem, vazio, erro real, escopo e layout. */
test.describe.serial("Área dos Acolhidos — lista (UI real)", () => {
  let w: AreaWorld;

  test.beforeAll(async ({ request }) => {
    w = await buildAreaWorld(request);
  });
  test.afterAll(async ({ request }) => {
    await disposeAreaWorld(request, w);
  });

  /** Ordem da API: ativos primeiro, depois id. Só o abrigo A. */
  const dbIds = async (where = "", params: Array<string | number> = []): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT s.id AS id FROM sheltered s WHERE s.shelter_id = ? ${where} ORDER BY s.active DESC, s.id ASC`,
        [w.shelterA.id, ...params],
      )
    ).map((r) => r.id);

  const ready = async (page: Page): Promise<void> => {
    await expect(page.getByTestId(`${P}-list`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-fetching`)).not.toBeVisible();
  };
  const settle = async (page: Page): Promise<void> => {
    await page.waitForLoadState("networkidle");
  };
  const expectIds = async (page: Page, expected: string[], ordered = false): Promise<void> => {
    await expect
      .poll(async () => (ordered ? (await cardIds(page)).join("|") : (await cardIds(page)).sort().join("|")), { timeout: 15_000 })
      .toBe(ordered ? expected.join("|") : [...expected].sort().join("|"));
  };

  test("carga inicial mostra o indicador de carregamento e depois a 1ª página na ordem da API", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __sawLoading?: boolean };
      new MutationObserver(() => {
        if (document.querySelector('[data-testid="sheltered-area-loading"]')) w.__sawLoading = true;
      }).observe(document, { childList: true, subtree: true });
    });
    await openAs(page, w.leader);
    await ready(page);
    expect(await page.evaluate(() => (window as unknown as { __sawLoading?: boolean }).__sawLoading)).toBe(true);
    const expected = (await dbIds()).slice(0, PAGE_SIZE);
    await expectIds(page, expected, true);
    await expect(page.getByTestId(`${P}-pagination-summary`)).toHaveText(`Mostrando ${PAGE_SIZE} de ${COUNT_A} acolhido(s)`);
    // dados do cartão
    const first = w.made[0];
    await expect(page.getByTestId(`${P}-card-name-${first.id}`)).toHaveText(first.name);
    await expect(page.getByTestId(`${P}-card-gender-${first.id}`)).toHaveText("M");
    await expect(page.getByTestId(`${P}-card-guardian-${first.id}`)).toContainText(`Resp ${RUN_TAG}`);
  });

  test("paginação: 2ª página traz o resto sem repetir e voltar à 1ª restaura", async ({ page }) => {
    await openAs(page, w.leader);
    await ready(page);
    const all = await dbIds();
    await page.getByTestId(`${P}-pages`).getByRole("button", { name: "Ir para a página 2" }).click();
    await expectIds(page, all.slice(PAGE_SIZE), true);
    await expect(page.getByTestId(`${P}-pagination-summary`)).toHaveText(`Mostrando ${COUNT_A - PAGE_SIZE} de ${COUNT_A} acolhido(s)`);
    await page.getByTestId(`${P}-pages`).getByRole("button", { name: "Ir para a página 1" }).click();
    await expectIds(page, all.slice(0, PAGE_SIZE), true);
  });

  test("busca por nome, responsável, telefone e nome do abrigo bate com o banco; limpar restaura", async ({ page }) => {
    await openAs(page, w.leader);
    await ready(page);
    const target = w.made[5];
    const search = page.getByTestId(`${P}-search`);

    await search.fill(target.name);
    await expectIds(page, [target.id]);

    await search.fill(`Resp ${RUN_TAG} 05`);
    await expectIds(page, [target.id]);

    const phone = (await queryAll<{ guardianPhone: string }>("SELECT guardianPhone FROM sheltered WHERE id = ?", [target.id]))[0].guardianPhone;
    await search.fill(phone);
    await expectIds(page, [target.id]);

    await search.fill(w.shelterA.name);
    await expect(page.getByTestId(`${P}-pagination-summary`)).toContainText(`de ${COUNT_A} acolhido(s)`);

    await search.fill("zzz-nao-existe-" + RUN_TAG);
    await expect(page.getByTestId(`${P}-empty`)).toContainText("Nenhum acolhido encontrado com os filtros aplicados");
    await expect(page.getByTestId(`${P}-empty-create`)).toHaveCount(0);

    await page.getByTestId(`${P}-clear-filters`).click();
    await expect(search).toHaveValue("");
    await ready(page);
    await expectIds(page, (await dbIds()).slice(0, PAGE_SIZE), true);
  });

  test("filtros 'aceitou Jesus' e 'status' (isolados e combinados) batem com o banco", async ({ page }) => {
    await openAs(page, w.leader);
    await ready(page);
    const acceptedSql = "AND EXISTS (SELECT 1 FROM accepted_christs ac WHERE ac.sheltered_id = s.id AND ac.decision IN ('ACCEPTED','RECONCILED'))";
    const notAcceptedSql = acceptedSql.replace("AND EXISTS", "AND NOT EXISTS");

    await pickSelect(page, `${P}-filter-accepted`, "accepted");
    await expectIds(page, await dbIds(acceptedSql));
    expect((await cardIds(page)).length).toBe(w.made.filter((m) => m.accepted).length);
    for (const m of w.made.filter((x) => x.accepted)) {
      await expect(page.getByTestId(`${P}-card-decision-${m.id}`)).toHaveAttribute("data-decided", "true");
    }

    await pickSelect(page, `${P}-filter-accepted`, "not-accepted");
    await expectIds(page, (await dbIds(notAcceptedSql)).slice(0, PAGE_SIZE), true);
    await pickSelect(page, `${P}-filter-accepted`, "all");

    await pickSelect(page, `${P}-filter-active`, "inactive");
    await expectIds(page, await dbIds("AND s.active = 0"));
    expect((await cardIds(page)).length).toBe(w.made.filter((m) => !m.active).length);

    await pickSelect(page, `${P}-filter-active`, "active");
    await expectIds(page, (await dbIds("AND s.active = 1")).slice(0, PAGE_SIZE), true);

    // combinados: ativos que aceitaram Jesus
    await pickSelect(page, `${P}-filter-accepted`, "accepted");
    await expectIds(page, await dbIds(`AND s.active = 1 ${acceptedSql}`));

    // vazio por filtro: inativos que aceitaram (nenhum), com o texto de filtros e sem o botão de cadastrar
    await pickSelect(page, `${P}-filter-active`, "inactive");
    await expect(page.getByTestId(`${P}-empty`)).toContainText("Nenhum acolhido encontrado com os filtros aplicados");
    await expect(page.getByTestId(`${P}-empty-create`)).toHaveCount(0);

    await page.getByTestId(`${P}-clear-filters`).click();
    await ready(page);
    await expectIds(page, (await dbIds()).slice(0, PAGE_SIZE), true);
  });

  test("escopo: líder e membro só veem o abrigo da equipe; acolhido alheio nunca aparece", async ({ page }) => {
    for (const actor of [w.leader, w.member]) {
      await openAs(page, actor);
      await ready(page);
      const search = page.getByTestId(`${P}-search`);
      await search.fill(RUN_TAG);
      await expect(page.getByTestId(`${P}-pagination-summary`)).toContainText(`de ${COUNT_A} acolhido(s)`);
      for (const f of w.foreign) await expect(page.getByTestId(`${P}-card-${f.id}`)).toHaveCount(0);
      await search.fill(w.foreign[0].name);
      await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
      expect(await cardIds(page)).toEqual([]);
    }
    // o membro de OUTRA equipe vê só o abrigo B
    await openAs(page, w.outsider);
    await ready(page);
    await page.getByTestId(`${P}-search`).fill(RUN_TAG);
    await expect.poll(async () => (await cardIds(page)).sort()).toEqual(w.foreign.map((f) => f.id).sort());
  });

  test("erro real: com a flag desligada depois da carga, a busca mostra o erro da API e some ao fechar", async ({ page, request }) => {
    await openAs(page, w.member);
    await ready(page);
    await withFlagsOff(request, w.admin, ["sheltered_area", "sheltered_management"], async () => {
      await page.getByTestId(`${P}-search`).fill(w.made[1].name);
      await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 15_000 });
    });
    await page.getByTestId(`${P}-error`).getByRole("button", { name: /close|fechar/i }).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0);
  });

  test("admin vê acolhidos de vários abrigos e o cartão traz as ações (decisão, editar, status)", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/area-dos-acolhidos");
    await expect(page.getByTestId(`${P}-search`)).toBeVisible({ timeout: 20_000 });
    await page.getByTestId(`${P}-search`).fill(RUN_TAG);
    await expect(page.getByTestId(`${P}-pagination-summary`)).toContainText(`de ${COUNT_A + w.foreign.length} acolhido(s)`);
    const first = (await cardIds(page))[0];
    for (const part of ["decision", "edit", "status"]) {
      await expect(page.getByTestId(`${P}-card-${part}-${first}`)).toBeVisible();
    }
  });

  test("@mobile 375px: cartões em coluna, alvos de 44px, sem rolagem horizontal e largura útil", async ({ page }) => {
    await openAs(page, w.leader);
    await ready(page);
    const ids = await cardIds(page);
    const boxes = await Promise.all(ids.map((id) => page.getByTestId(`${P}-card-${id}`).boundingBox()));
    for (const box of boxes) expect(box).not.toBeNull();
    const xs = new Set(boxes.map((b) => Math.round(b!.x)));
    expect(xs.size, "todos os cartões na mesma coluna").toBe(1);
    expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y + boxes[0]!.height - 2);
    expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(1);
    const vw = page.viewportSize()!.width;
    expect(boxes[0]!.width / vw).toBeGreaterThanOrEqual(0.9);

    const id = ids[0];
    for (const part of ["decision", "edit"]) {
      const box = await page.getByTestId(`${P}-card-${part}-${id}`).boundingBox();
      expect(box!.height, part).toBeGreaterThanOrEqual(43.5);
      expect(box!.width, part).toBeGreaterThanOrEqual(43.5);
    }
    const sw = await page.getByTestId(`${P}-card-status-${id}`).boundingBox();
    expect(sw!.height).toBeGreaterThanOrEqual(43.5);
    const fab = await page.getByTestId(`${P}-create-fab`).boundingBox();
    expect(fab!.height).toBeGreaterThanOrEqual(43.5);
    await settle(page);
  });
});
