import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import {
  cardIds,
  clearAllFilters,
  expectCards,
  filtersVisible,
  goToPage,
  openAs,
  PAGE_SIZE,
  searchFor,
  selectFilter,
  summaryText,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { localShift } from "../support/local-day";
import { registerShellSuite, setDateFilter } from "../support/shell-suite";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createMaterial, deletePageApi, pageRow, pagesWithTag } from "./support";
import { cleanupData } from "../support/keep-data";

const SCREEN: ListScreen = { p: "visit-materials", path: "/adm/paginas-materiais-visita", endpoint: "/visit-material-pages" };
const { p } = SCREEN;
const COUNT = 14;

test.describe.serial("Materiais de visita: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = `${RUN_TAG}-mat`;
  const ids: string[] = [];
  let previousCurrent: string[] = [];

  test.beforeAll(async ({ request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    previousCurrent = (await queryAll<{ id: string }>("SELECT id FROM visit_material_pages WHERE currentWeek = 1")).map((row) => row.id);
    for (let i = 0; i < COUNT; i += 1) {
      const page = await createMaterial(request, token, {
        title: `${tag} ${String.fromCharCode(65 + i)}`,
        description: i === 5 ? `descr-${tag}` : `Descrição ${i}`,
        testament: i % 2 === 0 ? "OLD_TESTAMENT" : "NEW_TESTAMENT",
        categories: i === 4 ? ["BABY", "TEEN"] : i % 3 === 0 ? ["BABY"] : undefined,
      });
      ids.push(page.id);
    }
  });

  test.afterAll(async ({ request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    // Estado (sempre): devolve a semana atual que existia antes, pois o cenário trocou o material atual.
    if (previousCurrent.length > 0) {
      await request.post(`${API_URL}/visit-material-pages/current-material/${previousCurrent[0]}`, { headers: authHeaders(token) });
    }
    await cleanupData(async () => {
      for (const id of ids) await deletePageApi(request, token, id);
      expect(await pagesWithTag(RUN_TAG), "a limpeza deixou materiais do E2E").toBe(0);
    });
    await closeDb();
  });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "p.createdAt DESC, p.id ASC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT p.id AS id FROM visit_material_pages p WHERE p.title LIKE ? ${extra} ORDER BY ${order}`,
        [`%${tag}%`, ...params],
      )
    ).map((row) => row.id);
  const withCategory = "AND EXISTS (SELECT 1 FROM visit_material_sections s WHERE s.page_id = p.id AND s.category = ?)";

  registerShellSuite({
    screen: SCREEN,
    managementFlag: "page_management",
    apiFlag: "visit_materials",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    dateFromKey: "createdFrom",
    dateToKey: "createdTo",
    hasDelete: true,
    sampleCardId: () => ids[COUNT - 1],
    sorts: [
      { value: "title:ASC", expectedIds: () => expectedIds("", [], "p.title ASC, p.id ASC") },
      { value: "title:DESC", expectedIds: () => expectedIds("", [], "p.title DESC, p.id ASC") },
      { value: "createdAt:ASC", expectedIds: () => expectedIds("", [], "p.createdAt ASC, p.id ASC") },
      { value: "testament:ASC", expectedIds: () => expectedIds("", [], "p.testament ASC, p.id ASC") },
    ],
  });

  test("filtro de testamento: Antigo e Novo batem com o banco; limpar volta ao total", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const old = await selectFilter(page, SCREEN, "testament", "OLD_TESTAMENT");
    expect(old.params.get("testament")).toBe("OLD_TESTAMENT");
    const dbOld = await expectedIds("AND p.testament = ?", ["OLD_TESTAMENT"]);
    expect(old.body.meta?.totalItems).toBe(dbOld.length);
    await expectCards(page, p, dbOld.slice(0, PAGE_SIZE));
    for (const id of dbOld) await expect(page.getByTestId(`${p}-card-testament-${id}`)).toHaveText("Antigo Testamento");

    const novo = await selectFilter(page, SCREEN, "testament", "NEW_TESTAMENT");
    const dbNew = await expectedIds("AND p.testament = ?", ["NEW_TESTAMENT"]);
    expect(novo.body.meta?.totalItems).toBe(dbNew.length);
    expect(dbNew.length + dbOld.length).toBe(COUNT);

    const all = await selectFilter(page, SCREEN, "testament", "");
    expect(all.params.has("testament")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(COUNT);
  });

  test("filtro de categoria e filtros combinados (busca + testamento + categoria + data + ordenação)", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const baby = await selectFilter(page, SCREEN, "category", "BABY");
    const dbBaby = await expectedIds(withCategory, ["BABY"]);
    expect(dbBaby.length).toBeGreaterThan(0);
    expect(baby.body.meta?.totalItems).toBe(dbBaby.length);
    await expectCards(page, p, dbBaby.slice(0, PAGE_SIZE));

    await selectFilter(page, SCREEN, "testament", "OLD_TESTAMENT");
    await setDateFilter(page, SCREEN, "createdFrom", localShift(0));
    const reply = await selectFilter(page, SCREEN, "sort", "title:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({
      search: tag, category: "BABY", testament: "OLD_TESTAMENT", createdFrom: localShift(0), sortBy: "title", order: "DESC",
    });
    const expected = await expectedIds(`${withCategory} AND p.testament = ? AND p.createdAt >= ?`, ["BABY", "OLD_TESTAMENT", localShift(0)], "p.title DESC, p.id ASC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected);

    const none = await setDateFilter(page, SCREEN, "createdFrom", localShift(1));
    expect(none.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await clearAllFilters(page, SCREEN);
    await expect(page.getByTestId(`${p}-error`)).toHaveCount(0);
  });

  test("filtros de visibilidade e material atual consultam o servidor e batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const publicOnly = await selectFilter(page, SCREEN, "public", "true");
    expect(publicOnly.body.meta?.totalItems).toBe(COUNT);
    const privateOnly = await selectFilter(page, SCREEN, "public", "false");
    expect(privateOnly.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await selectFilter(page, SCREEN, "public", "");

    const current = await selectFilter(page, SCREEN, "currentWeek", "true");
    const dbCurrent = await expectedIds("AND p.currentWeek = 1");
    expect(current.body.meta?.totalItems).toBe(dbCurrent.length);
    const others = await selectFilter(page, SCREEN, "currentWeek", "false");
    expect(others.body.meta?.totalItems).toBe(COUNT - dbCurrent.length);
  });

  test("busca também olha a descrição", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const reply = await searchFor(page, SCREEN, `descr-${tag}`);
    expect(reply.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);
  });

  test("cartão: título, visibilidade, testamento, faixas e as ações aparecem", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[4];
    await expect(page.getByTestId(`${p}-card-${id}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toHaveText(`${tag} E`);
    await expect(page.getByTestId(`${p}-card-visibility-${id}`)).toHaveText("Público");
    await expect(page.getByTestId(`${p}-card-testament-${id}`)).toHaveText("Antigo Testamento");
    await expect(page.getByTestId(`${p}-card-category-${id}-0`)).toHaveText("Baby");
    await expect(page.getByTestId(`${p}-card-category-${id}-1`)).toHaveText("Adolescentes");
    await expect(page.getByTestId(`${p}-card-created-${id}`)).toContainText("Criado em");
    for (const action of ["view", "edit", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${id}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-set-current-${id}`)).toBeVisible();
  });

  test("ação Ver abre os detalhes com as categorias e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await page.getByTestId(`${p}-card-view-${ids[4]}`).click();
    await expect(page.getByTestId("visit-material-details-dialog")).toBeVisible();
    await expect(page.getByTestId("visit-material-details-dialog")).toContainText(`${tag} E`);
    await page.getByTestId("visit-material-details-dismiss").click();
    await expect(page.getByTestId("visit-material-details-dialog")).toBeHidden();
  });

  test("ação Editar leva ao editor da página com o id", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await page.getByTestId(`${p}-card-edit-${ids[2]}`).click();
    await expect(page).toHaveURL(new RegExp(`/adm/editar-pagina-visita\\?id=${ids[2]}$`));
  });

  test("Tornar material atual: cancelar não muda; confirmar grava no banco, mostra a etiqueta e esconde o botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];

    await page.getByTestId(`${p}-card-set-current-${id}`).click();
    await expect(page.getByTestId("visit-material-set-current-dialog")).toBeVisible();
    await page.getByTestId("visit-material-set-current-close").click();
    await expect(page.getByTestId("visit-material-set-current-dialog")).toBeHidden();
    expect((await pageRow(id))?.currentWeek).toBe(0);

    await page.getByTestId(`${p}-card-set-current-${id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("visit-material-set-current-confirm").click();
    });
    expect(reply.status).toBe(200);
    expect((await pageRow(id))?.currentWeek).toBe(1);
    await expect(page.getByTestId(`${p}-card-current-${id}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-set-current-${id}`)).toHaveCount(0);
    const onlyCurrent = await queryAll("SELECT id FROM visit_material_pages WHERE currentWeek = 1");
    expect(onlyCurrent).toHaveLength(1);
  });

  test("excluir: cancelar mantém; confirmar apaga do banco, some do cartão e atualiza o total", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const victim = await createMaterial(request, token, { title: `${tag} apagar` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId("visit-material-delete-dialog")).toBeVisible();
    await page.getByTestId("visit-material-delete-dialog-cancel").click();
    await expect(page.getByTestId("visit-material-delete-dialog")).toBeHidden();
    expect(await pageRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("visit-material-delete-dialog-confirm").click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await pageRow(victim.id)).toBeNull();
    expect(await queryOne("SELECT id FROM routes WHERE entityId = ?", [victim.id])).toBeNull();
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const extra = `${tag}-extra`;
    const made = [];
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) made.push(await createMaterial(request, token, { title: `${extra} ${String(i).padStart(2, "0")}` }));
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE + 1}`);
    await goToPage(page, SCREEN, 2);
    const only = await cardIds(page, p);
    expect(only).toHaveLength(1);
    await page.getByTestId(`${p}-card-delete-${only[0]}`).click();
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("visit-material-delete-dialog-confirm").click();
    }, (params) => params.get("page") === "1" && params.get("search") === extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE}`);
    expect(await pageRow(only[0])).toBeNull();
    await cleanupData(async () => {
      for (const item of made) await request.delete(`${API_URL}/visit-material-pages/${item.id}`, { headers: authHeaders(token) });
    });
  });

  test("@mobile cartão no celular: ações com 44px e filtros funcionando pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    for (const action of ["view", "edit", "set-current"]) {
      const box = await page.getByTestId(`${p}-card-${action}-${id}`).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await filtersVisible(page, p);
    const reply = await selectFilter(page, SCREEN, "testament", "NEW_TESTAMENT");
    expect(reply.params.get("testament")).toBe("NEW_TESTAMENT");
  });
});
