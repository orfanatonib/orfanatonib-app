import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll } from "../support/db";
import { authHeaders, expect, test } from "../support/live";
import { buildAreaWorld, disposeAreaWorld, noHorizontalScroll, openAs, PAGELA, PG, type AreaWorld } from "./support";
import { savePagela } from "./ui-actions";

interface PagelaRow extends Record<string, unknown> {
  id: string;
  year: number;
  visit: number;
  present: number;
  notes: string | null;
  member_profile_id: string;
  referenceDate: string;
}

const pagelasOf = (shelteredId: string): Promise<PagelaRow[]> =>
  queryAll<PagelaRow>(
    "SELECT id, year, visit, present, notes, member_profile_id, referenceDate FROM pagelas WHERE sheltered_id = ? ORDER BY year DESC, visit DESC",
    [shelteredId],
  );

const YEAR = 2026;

/** Pagelas semanais de um acolhido, lançadas e editadas pela UI de /area-dos-acolhidos como membro da equipe. */
test.describe.serial("Área dos Acolhidos — pagelas (UI real)", () => {
  let w: AreaWorld;
  let fresh: string; // acolhido sem pagelas: o lançamento começa daqui
  let busy: string; // acolhido com 11 semanas lançadas pela API (histórico paginado)
  let quick: string[]; // acolhidos do lançamento rápido

  const apiPagela = async (request: APIRequestContext, shelteredId: string, week: number, present: boolean, notes: string): Promise<void> => {
    const res = await request.post(`${API_URL}/pagelas`, {
      headers: authHeaders(w.admin),
      data: { shelteredId, memberProfileId: w.memberProfileId, referenceDate: `${YEAR}-03-${String(week).padStart(2, "0")}`, year: YEAR, visit: week, present, notes },
    });
    expect(res.status(), await res.text()).toBe(201);
  };

  test.beforeAll(async ({ request }) => {
    w = await buildAreaWorld(request);
    fresh = w.made[3].id;
    busy = w.made[4].id;
    quick = [w.made[5].id, w.made[6].id, w.made[7].id];
    for (let week = 1; week <= 11; week += 1) await apiPagela(request, busy, week, week % 2 === 1, `Semana ${week} do ${w.made[4].name}`);
  });
  test.afterAll(async ({ request }) => {
    await disposeAreaWorld(request, w);
  });

  const openChild = async (page: Page, id: string, actor = w.member): Promise<void> => {
    await openAs(page, actor, `/area-dos-acolhidos/${id}`);
    await expect(page.getByTestId(`${PG}-name`).first()).toBeVisible({ timeout: 20_000 });
  };

  test("abre a página pelo cartão com o cabeçalho do acolhido e histórico vazio", async ({ page }) => {
    await openAs(page, w.member);
    await page.getByTestId(`sheltered-area-card-open-${fresh}`).click();
    await expect(page).toHaveURL(new RegExp(`/area-dos-acolhidos/${fresh}$`));
    const child = w.made[3];
    await expect(page.getByTestId(`${PG}-name`).first()).toContainText(child.name);
    await expect(page.getByTestId(`${PG}-guardian`).first()).toContainText(`Resp ${child.name.split("-acolhido-")[0]}`);
    await expect(page.getByTestId(`${PAGELA}-empty`)).toBeVisible();
    await expect(page.getByTestId(`${PAGELA}-form`)).toHaveAttribute("data-mode", "create");
    await expect(page.getByTestId(`${PAGELA}-form-save`)).toBeDisabled();
  });

  test("lança a pagela da semana: cartão no histórico e linha no banco com o autor e a data de hoje", async ({ page }) => {
    await openChild(page, fresh);
    await savePagela(page, { year: YEAR, week: 10, present: true, notes: "Participou e recitou o versículo" });
    await expect(page.getByTestId(`${PG}-snackbar`)).toContainText("Pagela salva!");
    const rows = await pagelasOf(fresh);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ year: YEAR, visit: 10, present: 1, notes: "Participou e recitou o versículo", member_profile_id: w.memberProfileId });
    await expect(page.getByTestId(`${PAGELA}-card-${rows[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`${PAGELA}-card-present-${rows[0].id}`)).toHaveText("Presente");
    await expect(page.getByTestId(`${PAGELA}-card-notes-${rows[0].id}`)).toHaveText("Participou e recitou o versículo");
    await expect(page.getByTestId(`${PAGELA}-card-title-${rows[0].id}`)).toHaveText("Ano: 2026 Visita: 10");
  });

  test("mesma semana de novo vira edição (nunca duplica): o formulário carrega o registro e o salvar atualiza", async ({ page }) => {
    await openChild(page, fresh);
    await page.getByTestId(`${PAGELA}-form-year`).fill(String(YEAR));
    await page.getByTestId(`${PAGELA}-form-week`).fill("10");
    await expect(page.getByTestId(`${PAGELA}-form`)).toHaveAttribute("data-mode", "edit");
    await expect(page.getByTestId(`${PAGELA}-form-notes`)).toHaveValue("Participou e recitou o versículo");
    await expect(page.getByTestId(`${PAGELA}-form-present`)).toBeChecked();
    await savePagela(page, { year: YEAR, week: 10, present: false, notes: "Faltou; mãe avisou" });
    await expect(page.getByTestId(`${PG}-snackbar`)).toContainText("Pagela atualizada!");
    const rows = await pagelasOf(fresh);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ visit: 10, present: 0, notes: "Faltou; mãe avisou" });
  });

  test("editar pelo cartão carrega o registro no formulário; alterar só a observação mantém a presença", async ({ page }) => {
    await openChild(page, fresh);
    const row = (await pagelasOf(fresh))[0];
    await page.getByTestId(`${PAGELA}-card-edit-${row.id}`).click();
    await expect(page.getByTestId(`${PAGELA}-form`)).toHaveAttribute("data-mode", "edit");
    await expect(page.getByTestId(`${PAGELA}-form-week`)).toHaveValue("10");
    await page.getByTestId(`${PAGELA}-form-notes`).fill("Observação revisada");
    await page.getByTestId(`${PAGELA}-form-save`).click();
    await expect(page.getByTestId(`${PG}-snackbar`)).toContainText("Pagela atualizada!");
    expect((await pagelasOf(fresh))[0]).toMatchObject({ id: row.id, present: 0, notes: "Observação revisada" });
    await expect(page.getByTestId(`${PAGELA}-card-notes-${row.id}`)).toHaveText("Observação revisada");
  });

  test("semana de outra página do histórico: o servidor recusa o duplicado (409) e nada é gravado", async ({ page }) => {
    await openChild(page, busy);
    // 11 semanas, 9 por página no desktop: as semanas 1 e 2 estão na 2ª página, fora da lista carregada
    await expect(page.getByTestId(`${PAGELA}-card-title-${(await pagelasOf(busy))[0].id}`)).toBeVisible();
    await savePagela(page, { year: YEAR, week: 1, present: true, notes: "tentativa duplicada" });
    await expect(page.getByTestId(`${PG}-snackbar`)).toBeVisible({ timeout: 15_000 });
    const rows = await pagelasOf(busy);
    expect(rows.filter((r) => r.visit === 1)).toHaveLength(1);
    expect(rows.find((r) => r.visit === 1)?.notes).not.toBe("tentativa duplicada");
  });

  test("histórico: paginação, filtros de ano/semana/presença e limpar", async ({ page }) => {
    await openChild(page, busy);
    const all = await pagelasOf(busy);
    const visible = async (): Promise<string[]> =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid^="pagela-card-title-"]')).map((el) => el.getAttribute("data-testid")!.replace("pagela-card-title-", "")),
      );
    await expect.poll(async () => (await visible()).length).toBe(9);
    expect((await visible()).sort()).toEqual(all.slice(0, 9).map((r) => r.id).sort());
    await page.getByTestId(`${PAGELA}-pages`).getByRole("button", { name: "Ir para a página 2" }).click();
    await expect.poll(async () => (await visible()).sort()).toEqual(all.slice(9).map((r) => r.id).sort());
    await page.getByTestId(`${PAGELA}-pages`).getByRole("button", { name: "Ir para a página 1" }).click();

    await page.getByTestId(`${PAGELA}-filter-week`).fill("7");
    await expect.poll(async () => visible()).toEqual([all.find((r) => r.visit === 7)!.id]);
    await page.getByTestId(`${PAGELA}-filter-week`).fill("");
    await page.getByTestId(`${PAGELA}-filter-present`).getByRole("combobox").click();
    await page.getByTestId(`${PAGELA}-filter-present-option-no`).click();
    await expect.poll(async () => (await visible()).sort()).toEqual(all.filter((r) => r.present === 0).map((r) => r.id).sort());
    await page.getByTestId(`${PAGELA}-filter-year`).fill("2030");
    await expect(page.getByTestId(`${PAGELA}-empty`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`${PAGELA}-clear-filters`).click();
    await expect.poll(async () => (await visible()).length).toBe(9);
  });

  test("excluir: pede confirmação, cancelar mantém, confirmar remove do banco e da lista", async ({ page }) => {
    await openChild(page, fresh);
    const row = (await pagelasOf(fresh))[0];
    await page.getByTestId(`${PAGELA}-card-delete-${row.id}`).click();
    await page.getByTestId(`${PAGELA}-delete-dialog-${row.id}-cancel`).click();
    expect(await pagelasOf(fresh)).toHaveLength(1);
    await page.getByTestId(`${PAGELA}-card-delete-${row.id}`).click();
    await page.getByTestId(`${PAGELA}-delete-dialog-${row.id}-confirm`).click();
    await expect(page.getByTestId(`${PG}-snackbar`)).toContainText("Pagela excluída.");
    await expect(page.getByTestId(`${PAGELA}-card-${row.id}`)).toHaveCount(0);
    expect(await pagelasOf(fresh)).toHaveLength(0);
  });

  test("lançamento rápido para vários acolhidos: três pagelas seguidas pela mesma tela", async ({ page }) => {
    await openAs(page, w.member);
    for (const [index, id] of quick.entries()) {
      await page.goto(`/area-dos-acolhidos/${id}`);
      await expect(page.getByTestId(`${PAGELA}-form`)).toBeVisible({ timeout: 20_000 });
      await savePagela(page, { year: YEAR, week: 20, present: index !== 1, notes: `Rápida ${index}` });
      await expect(page.getByTestId(`${PG}-snackbar`)).toContainText("Pagela salva!");
    }
    for (const [index, id] of quick.entries()) {
      const rows = await pagelasOf(id);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ visit: 20, present: index !== 1 ? 1 : 0, notes: `Rápida ${index}`, member_profile_id: w.memberProfileId });
    }
  });

  test("o líder da equipe lê o histórico lançado pelo membro", async ({ page }) => {
    await openChild(page, busy, w.leader);
    const rows = await pagelasOf(busy);
    await expect(page.getByTestId(`${PAGELA}-card-${rows[0].id}`)).toBeVisible();
    // o líder só LÊ: o formulário de lançamento existe, mas a API não aceita autoria de líder (perfil de membro obrigatório)
    expect(rows.every((r) => r.member_profile_id === w.memberProfileId)).toBe(true);
  });

  test("permissão: membro de OUTRA equipe não abre o acolhido nem lança pagela (404 e nada gravado)", async ({ page, request }) => {
    await openAs(page, w.outsider, `/area-dos-acolhidos/${fresh}`);
    await expect(page.getByTestId(`${PG}-error`)).toBeVisible({ timeout: 20_000 });
    const res = await request.post(`${API_URL}/pagelas`, {
      headers: authHeaders(w.outsider.token),
      data: { shelteredId: fresh, memberProfileId: w.outsiderProfileId, referenceDate: `${YEAR}-04-01`, year: YEAR, visit: 30, present: true },
    });
    expect(res.status()).toBe(404);
    expect(await pagelasOf(fresh)).toHaveLength(0);
    const list = await request.get(`${API_URL}/pagelas/paginated?shelteredId=${fresh}`, { headers: authHeaders(w.outsider.token) });
    expect(list.status()).toBe(404);
  });

  test("@mobile 375px: lançar pela gaveta (FAB), editar e excluir com alvos de 44px e sem rolagem lateral", async ({ page }) => {
    const id = w.made[8].id;
    await openChild(page, id);
    const fab = await page.getByTestId(`${PG}-create-fab`).boundingBox();
    expect(fab!.height).toBeGreaterThanOrEqual(43.5);
    await savePagela(page, { year: YEAR, week: 15, present: true, notes: "Pelo celular" });
    await expect(page.getByTestId(`${PG}-snackbar`)).toContainText("Pagela salva!");
    const row = (await pagelasOf(id))[0];
    expect(row).toMatchObject({ visit: 15, present: 1, notes: "Pelo celular" });
    await expect(page.getByTestId(`${PAGELA}-card-${row.id}`)).toBeVisible();
    for (const part of ["edit", "delete"]) {
      const box = await page.getByTestId(`${PAGELA}-card-${part}-${row.id}`).boundingBox();
      expect(box!.height, part).toBeGreaterThanOrEqual(43.5);
      expect(box!.width, part).toBeGreaterThanOrEqual(43.5);
    }
    expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(1);
    await page.getByTestId(`${PAGELA}-card-edit-${row.id}`).click();
    await expect(page.getByTestId(`${PAGELA}-form`)).toHaveAttribute("data-mode", "edit");
    const save = await page.getByTestId(`${PAGELA}-form-save`).boundingBox();
    expect(save!.height).toBeGreaterThanOrEqual(43.5);
    await page.getByTestId(`${PAGELA}-form-notes`).fill("Editada no celular");
    await page.getByTestId(`${PAGELA}-form-save`).click();
    await expect.poll(async () => (await pagelasOf(id))[0].notes).toBe("Editada no celular");
  });
});
