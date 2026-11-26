import { queryAll, queryOne } from "../support/db";
import { cleanupData } from "../support/keep-data";
import {
  addDays,
  cardIds,
  clearAllFilters,
  deleteAllByTag,
  expectCards,
  filtersVisible,
  goToPage,
  openAs,
  PAGE_SIZE,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  summaryText,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { expect, loginAs, test } from "../support/live";
import { create, deleteRaw, feedbackRow, feedbacksWithTag, readRaw } from "./support";
import { localShift } from "../support/local-day";

const SCREEN: ListScreen = { p: "feedbacks", path: "/adm/feedbacks", endpoint: "/site-feedbacks" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLMN".split("");
const CATEGORIES = ["suggestion", "complaint", "content"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  suggestion: "Sugestão de melhoria ou ideia",
  complaint: "Reclamação ou insatisfação",
  content: "Conteúdo do site (textos, informações, erros)",
};
const ORDER = "f.createdAt DESC, f.id ASC";

test.describe.serial("Feedbacks: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = `e2e-fb-${Date.now().toString(36)}`;
  let ids: string[] = [];
  let admin = "";
  let commentTag = "";

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    commentTag = `cmt-${tag}`;
    for (const [index, letter] of LETTERS.entries()) {
      const feedback = await create(request, admin, {
        name: `${tag} ${letter}`,
        email: index % 3 === 0 ? `${letter.toLowerCase()}.${tag}@orfanatonib.test` : undefined,
        rating: (index % 5) + 1,
        category: CATEGORIES[index % CATEGORIES.length],
        comment: index === 5 ? `Comentário especial ${commentTag}` : `Comentário comum ${letter}`,
      });
      ids.push(feedback.id);
    }
    // Índices pares ficam lidos (7 lidos, 7 não lidos).
    for (const [index, id] of ids.entries()) {
      if (index % 2 === 0) expect((await readRaw(request, admin, id)).status()).toBe(200);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await deleteAllByTag(request, "/site-feedbacks", tag, (row) => row.id as string | undefined);
      expect(await feedbacksWithTag(tag)).toBe(0);
    });
  });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = ORDER): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(`SELECT f.id AS id FROM site_feedbacks f WHERE f.name LIKE ? ${extra} ORDER BY ${order}`, [`%${tag}%`, ...params])
    ).map((row) => row.id);

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "feedback_management",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[ids.length - 1],
    hasCreate: false,
  });

  test("filtro de situação: não lidos e lidos batem com o banco e com os selos", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const unread = await selectFilter(page, SCREEN, "read", "false");
    expect(unread.params.get("read")).toBe("false");
    const dbUnread = await expectedIds("AND f.`read` = 0");
    expect(unread.body.meta?.totalItems).toBe(dbUnread.length);
    await expectCards(page, p, dbUnread);
    for (const id of dbUnread) await expect(page.getByTestId(`${p}-card-status-${id}`)).toHaveText("Não lido");

    const read = await selectFilter(page, SCREEN, "read", "true");
    const dbRead = await expectedIds("AND f.`read` = 1");
    expect(read.body.meta?.totalItems).toBe(dbRead.length);
    await expectCards(page, p, dbRead);
    for (const id of dbRead) await expect(page.getByTestId(`${p}-card-status-${id}`)).toHaveText("Lido");
    expect(dbRead.length + dbUnread.length).toBe(LETTERS.length);

    const all = await selectFilter(page, SCREEN, "read", "");
    expect(all.params.has("read")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length);
  });

  test("filtro de tipo: cada categoria bate com o banco e com o rótulo do cartão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    for (const category of CATEGORIES) {
      const reply = await selectFilter(page, SCREEN, "category", category);
      expect(reply.params.get("category")).toBe(category);
      const db = await expectedIds("AND f.category = ?", [category]);
      expect(db.length).toBeGreaterThan(0);
      expect(reply.body.meta?.totalItems).toBe(db.length);
      await expectCards(page, p, db);
      for (const id of db) await expect(page.getByTestId(`${p}-card-category-${id}`)).toHaveText(CATEGORY_LABEL[category]);
    }
    const all = await selectFilter(page, SCREEN, "category", "");
    expect(all.params.has("category")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length);
  });

  test("filtro de nota: de 1 a 5 estrelas batem com o banco e com as estrelas do cartão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    for (const rating of [1, 3, 5]) {
      const reply = await selectFilter(page, SCREEN, "rating", String(rating));
      expect(reply.params.get("rating")).toBe(String(rating));
      const db = await expectedIds("AND f.rating = ?", [rating]);
      expect(db.length).toBeGreaterThan(0);
      expect(reply.body.meta?.totalItems).toBe(db.length);
      await expectCards(page, p, db);
      for (const id of db) await expect(page.getByTestId(`${p}-card-rating-${id}`)).toContainText(`${rating}/5`);
    }
    const all = await selectFilter(page, SCREEN, "rating", "");
    expect(all.params.has("rating")).toBe(false);
  });

  test("filtro de datas: de hoje, até ontem e a partir de amanhã batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = localShift();
    const from = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(from.body.meta?.totalItems).toBe((await expectedIds("AND f.createdAt >= ?", [today])).length);
    const to = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(to.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    const inclusive = await setDateFilter(page, SCREEN, "createdTo", today);
    expect(inclusive.body.meta?.totalItems).toBe((await expectedIds("AND f.createdAt >= ? AND f.createdAt < ?", [today, addDays(today, 1)])).length);
    await setDateFilter(page, SCREEN, "createdFrom", addDays(today, 1));
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação: nota maior/menor primeiro, nome A–Z e recebimento seguem o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const high = await selectFilter(page, SCREEN, "sort", "rating:DESC");
    expect(high.params.get("sortBy")).toBe("rating");
    expect(high.params.get("order")).toBe("DESC");
    await expectCards(page, p, (await expectedIds("", [], "f.rating DESC, f.id ASC")).slice(0, PAGE_SIZE));

    const low = await selectFilter(page, SCREEN, "sort", "rating:ASC");
    expect(low.params.get("order")).toBe("ASC");
    await expectCards(page, p, (await expectedIds("", [], "f.rating ASC, f.id ASC")).slice(0, PAGE_SIZE));

    await selectFilter(page, SCREEN, "sort", "name:ASC");
    await expectCards(page, p, (await expectedIds("", [], "f.name ASC, f.id ASC")).slice(0, PAGE_SIZE));
    await selectFilter(page, SCREEN, "sort", "name:DESC");
    await expectCards(page, p, (await expectedIds("", [], "f.name DESC, f.id ASC")).slice(0, PAGE_SIZE));

    await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    await expectCards(page, p, (await expectedIds("", [], "f.createdAt ASC, f.id ASC")).slice(0, PAGE_SIZE));
    await selectFilter(page, SCREEN, "sort", "createdAt:DESC");
    await expectCards(page, p, (await expectedIds()).slice(0, PAGE_SIZE));
  });

  test("busca olha nome, e-mail e comentário", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byComment = await searchFor(page, SCREEN, commentTag);
    expect(byComment.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);

    const byEmail = await searchFor(page, SCREEN, `d.${tag}@`);
    expect(byEmail.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[3]]);

    const byName = await searchFor(page, SCREEN, `${tag} G`);
    expect(byName.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[6]]);
  });

  test("filtros combinados: busca + situação + tipo + nota + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "read", "false");
    await selectFilter(page, SCREEN, "category", "complaint");
    await selectFilter(page, SCREEN, "rating", "2");
    const reply = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, read: "false", category: "complaint", rating: "2", sortBy: "name", order: "DESC" });
    const expected = await expectedIds("AND f.`read` = 0 AND f.category = 'complaint' AND f.rating = 2", [], "f.name DESC, f.id ASC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected);

    const cleared = await clearAllFilters(page, SCREEN);
    for (const key of ["read", "category", "rating", "search"]) expect(cleared.params.has(key)).toBe(false);
    expect(cleared.params.get("sortBy")).toBe("name");
  });

  test("cartão: nome, e-mail (ou Sem e-mail), comentário, estrelas, tipo, selo e data", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const withEmail = ids[3];
    const withoutEmail = ids[5];
    const row = (await feedbackRow(withEmail))!;
    await expect(page.getByTestId(`${p}-card-title-${withEmail}`)).toHaveText(row.name);
    await expect(page.getByTestId(`${p}-card-${withEmail}`)).toContainText(row.email as string);
    await expect(page.getByTestId(`${p}-card-${withEmail}`)).toContainText(row.comment);
    await expect(page.getByTestId(`${p}-card-rating-${withEmail}`)).toContainText(`${row.rating}/5`);
    await expect(page.getByTestId(`${p}-card-category-${withEmail}`)).toHaveText(CATEGORY_LABEL[row.category]);
    await expect(page.getByTestId(`${p}-card-status-${withEmail}`)).toHaveText("Não lido");
    await expect(page.getByTestId(`${p}-card-created-${withEmail}`)).toContainText("Recebido em");
    await expect(page.getByTestId(`${p}-card-${withoutEmail}`)).toContainText("Sem e-mail");

    for (const action of ["view", "read", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${withEmail}`)).toBeVisible();
    const readId = ids[2];
    await expect(page.getByTestId(`${p}-card-status-${readId}`)).toHaveText("Lido");
    await expect(page.getByTestId(`${p}-card-read-${readId}`)).toHaveCount(0);
  });

  test("ver detalhes: o diálogo mostra os dados do banco e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    const row = (await feedbackRow(id))!;
    await page.getByTestId(`${p}-card-view-${id}`).click();
    const dialog = page.getByTestId("feedback-view-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("feedback-view-name")).toContainText(row.name);
    await expect(page.getByTestId("feedback-view-email")).toContainText(row.email as string);
    await expect(page.getByTestId("feedback-view-rating")).toContainText(`${row.rating}/5`);
    await expect(page.getByTestId("feedback-view-category")).toContainText(CATEGORY_LABEL[row.category]);
    await expect(page.getByTestId("feedback-view-comment")).toHaveText(row.comment);
    await expect(page.getByTestId("feedback-view-status")).toHaveText("Não lido");
    await expect(page.getByTestId("feedback-view-mark-read")).toBeVisible();
    await expect(page.getByTestId("feedback-view-delete")).toHaveCount(0);
    await page.getByTestId("feedback-view-close-icon").click();
    await expect(dialog).toBeHidden();
    await page.getByTestId(`${p}-card-view-${id}`).click();
    await page.getByTestId("feedback-view-close").click();
    await expect(dialog).toBeHidden();
  });

  test("marcar como lido pelo cartão: grava no banco, avisa e sai da lista de não lidos", async ({ page, request }) => {
    const victim = await create(request, admin, { name: `${tag} cartao-lido` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} cartao-lido`);
    await selectFilter(page, SCREEN, "read", "false");
    await expectCards(page, p, [victim.id]);
    expect((await feedbackRow(victim.id))?.read).toBe(0);

    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-card-read-${victim.id}`).click();
    });
    expect((await feedbackRow(victim.id))?.read).toBe(1);
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Feedback marcado como lido");
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await cleanupData(async () => { await deleteRaw(request, admin, victim.id); });
  });

  test("marcar como lido pelo diálogo; já lido mostra Excluir e leva à confirmação", async ({ page, request }) => {
    const victim = await create(request, admin, { name: `${tag} dialogo-lido` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} dialogo-lido`);
    await page.getByTestId(`${p}-card-view-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("feedback-view-mark-read").click();
    });
    expect(reply.status).toBe(200);
    expect((await feedbackRow(victim.id))?.read).toBe(1);
    await expect(page.getByTestId("feedback-view-dialog")).toBeHidden();
    await expect(page.getByTestId(`${p}-card-status-${victim.id}`)).toHaveText("Lido");

    await page.getByTestId(`${p}-card-view-${victim.id}`).click();
    await expect(page.getByTestId("feedback-view-mark-read")).toHaveCount(0);
    await page.getByTestId("feedback-view-delete").click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await feedbackRow(victim.id)).not.toBeNull();
    await cleanupData(async () => { await deleteRaw(request, admin, victim.id); });
  });

  test("excluir: cancelar mantém; confirmar apaga do banco, some do cartão e zera o total", async ({ page, request }) => {
    const victim = await create(request, admin, { name: `${tag} apagar` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await feedbackRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Feedback excluído com sucesso");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await feedbackRow(victim.id)).toBeNull();
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const extra = `${tag} extra`;
    const made = [];
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) made.push(await create(request, admin, { name: `${extra} ${String(i).padStart(2, "0")}` }));
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE + 1}`);
    await goToPage(page, SCREEN, 2);
    const last = (await cardIds(page, p))[0];
    expect(await cardIds(page, p)).toHaveLength(1);

    await page.getByTestId(`${p}-card-delete-${last}`).click();
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    }, (params) => params.get("page") === "1" && params.get("search") === extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE}`);
    expect(await cardIds(page, p)).toHaveLength(PAGE_SIZE);
    expect(await feedbackRow(last)).toBeNull();
    await cleanupData(async () => { for (const feedback of made) await deleteRaw(request, admin, feedback.id); });
  });

  test("@mobile cartão no celular: ações empilhadas com 44px e filtros de tipo e nota pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    const view = await page.getByTestId(`${p}-card-view-${id}`).boundingBox();
    const read = await page.getByTestId(`${p}-card-read-${id}`).boundingBox();
    for (const box of [view, read]) expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(view!.x - read!.x)).toBeLessThanOrEqual(1);
    expect(read!.y).toBeGreaterThan(view!.y);

    await filtersVisible(page, p);
    const byCategory = await selectFilter(page, SCREEN, "category", "complaint");
    expect(byCategory.params.get("category")).toBe("complaint");
    const byRating = await selectFilter(page, SCREEN, "rating", "4");
    expect(byRating.params.get("rating")).toBe("4");
    expect(byRating.body.meta?.totalItems).toBe((await expectedIds("AND f.category = 'complaint' AND f.rating = 4")).length);
  });
});
