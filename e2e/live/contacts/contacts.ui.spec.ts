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
import { loginAs, expect, test } from "../support/live";
import { contactRow, contactsWithTag, create, deleteRaw, readRaw } from "./support";
import { localShift } from "../support/local-day";

const SCREEN: ListScreen = { p: "contacts", path: "/adm/contatos", endpoint: "/contact" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLMN".split("");
const ORDER = "c.createdAt DESC, c.id ASC";

test.describe.serial("Contatos: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = `e2e-ct-${Date.now().toString(36)}`;
  let ids: string[] = [];
  let admin = "";
  let messageTag = "";
  /** DDD 11 + 7 dígitos do relógio + índice: o telefone é único por execução mesmo com a massa acumulada. */
  const phoneBase = `11${String(Date.now()).slice(-7)}`;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    messageTag = `msg-${tag}`;
    for (const [index, letter] of LETTERS.entries()) {
      const receipt = await create(request, {
        name: `${tag} ${letter}`,
        email: `${letter.toLowerCase()}.${tag}@orfanatonib.test`,
        phone: `${phoneBase}${String(index).padStart(2, "0")}`,
        message: index === 5 ? `Mensagem especial ${messageTag}` : `Mensagem comum ${letter}`,
      });
      ids.push(receipt.id);
    }
    // Índices pares ficam lidos (7 lidos, 7 não lidos).
    for (const [index, id] of ids.entries()) {
      if (index % 2 === 0) expect((await readRaw(request, admin, id)).status()).toBe(200);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await deleteAllByTag(request, "/contact", tag, (row) => row.id as string | undefined);
      expect(await contactsWithTag(tag)).toBe(0);
    });
  });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = ORDER): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(`SELECT c.id AS id FROM contacts c WHERE c.name LIKE ? ${extra} ORDER BY ${order}`, [`%${tag}%`, ...params])
    ).map((row) => row.id);

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "contact_management",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[ids.length - 1],
    hasCreate: false,
  });

  test("filtro de situação: não lidos e lidos batem com o banco e com os selos dos cartões", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const unread = await selectFilter(page, SCREEN, "read", "false");
    expect(unread.params.get("read")).toBe("false");
    const dbUnread = await expectedIds("AND c.`read` = 0");
    expect(dbUnread).toHaveLength(7);
    expect(unread.body.meta?.totalItems).toBe(7);
    await expectCards(page, p, dbUnread);
    for (const id of dbUnread) await expect(page.getByTestId(`${p}-card-status-${id}`)).toHaveText("Não lido");

    const read = await selectFilter(page, SCREEN, "read", "true");
    const dbRead = await expectedIds("AND c.`read` = 1");
    expect(read.body.meta?.totalItems).toBe(dbRead.length);
    await expectCards(page, p, dbRead);
    for (const id of dbRead) await expect(page.getByTestId(`${p}-card-status-${id}`)).toHaveText("Lido");

    const all = await selectFilter(page, SCREEN, "read", "");
    expect(all.params.has("read")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length);
  });

  test("filtro de situação sem busca: o total da API é o do banco para a tabela toda", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const reply = await selectFilter(page, SCREEN, "read", "false");
    const row = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM contacts WHERE `read` = 0");
    expect(reply.body.meta?.totalItems).toBe(Number(row?.n));
  });

  test("filtro de datas: de hoje, até ontem e a partir de amanhã batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = localShift();

    const from = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(from.params.get("createdFrom")).toBe(today);
    expect(from.body.meta?.totalItems).toBe((await expectedIds("AND c.createdAt >= ?", [today])).length);

    const to = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(to.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();

    const inclusive = await setDateFilter(page, SCREEN, "createdTo", today);
    expect(inclusive.body.meta?.totalItems).toBe((await expectedIds("AND c.createdAt >= ? AND c.createdAt < ?", [today, addDays(today, 1)])).length);

    await setDateFilter(page, SCREEN, "createdFrom", addDays(today, 1));
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação: nome A–Z e Z–A e recebimento mais antigo/recente seguem o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const asc = await selectFilter(page, SCREEN, "sort", "name:ASC");
    expect(asc.params.get("sortBy")).toBe("name");
    expect(asc.params.get("order")).toBe("ASC");
    await expectCards(page, p, (await expectedIds("", [], "c.name ASC, c.id ASC")).slice(0, PAGE_SIZE));

    const desc = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(desc.params.get("order")).toBe("DESC");
    await expectCards(page, p, (await expectedIds("", [], "c.name DESC, c.id ASC")).slice(0, PAGE_SIZE));

    const oldest = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(oldest.params.get("sortBy")).toBe("createdAt");
    await expectCards(page, p, (await expectedIds("", [], "c.createdAt ASC, c.id ASC")).slice(0, PAGE_SIZE));

    await selectFilter(page, SCREEN, "sort", "createdAt:DESC");
    await expectCards(page, p, (await expectedIds()).slice(0, PAGE_SIZE));
  });

  test("busca olha nome, e-mail, telefone e mensagem", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byMessage = await searchFor(page, SCREEN, messageTag);
    expect(byMessage.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);

    const byEmail = await searchFor(page, SCREEN, `c.${tag}@`);
    expect(byEmail.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[2]]);

    const byPhone = await searchFor(page, SCREEN, `${phoneBase}07`);
    expect(byPhone.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[7]]);
  });

  test("filtros combinados: busca + situação + data + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "read", "false");
    await setDateFilter(page, SCREEN, "createdFrom", localShift());
    const reply = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, read: "false", createdFrom: localShift(), sortBy: "name", order: "DESC" });
    const expected = await expectedIds("AND c.`read` = 0 AND c.createdAt >= ?", [localShift()], "c.name DESC, c.id ASC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected);
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();

    const cleared = await clearAllFilters(page, SCREEN);
    expect(cleared.params.has("read")).toBe(false);
    expect(cleared.params.get("sortBy")).toBe("name");
  });

  test("cartão: nome, e-mail, mensagem, telefone, selo e data; ação de marcar como lido só no não lido", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const unreadId = ids[3];
    const readId = ids[2];
    const row = (await contactRow(unreadId))!;
    await expect(page.getByTestId(`${p}-card-title-${unreadId}`)).toHaveText(row.name);
    await expect(page.getByTestId(`${p}-card-${unreadId}`)).toContainText(row.email);
    await expect(page.getByTestId(`${p}-card-${unreadId}`)).toContainText(row.message);
    await expect(page.getByTestId(`${p}-card-phone-${unreadId}`)).toHaveText(row.phone);
    await expect(page.getByTestId(`${p}-card-status-${unreadId}`)).toHaveText("Não lido");
    await expect(page.getByTestId(`${p}-card-created-${unreadId}`)).toContainText("Recebido em");
    for (const action of ["view", "read", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${unreadId}`)).toBeVisible();

    await expect(page.getByTestId(`${p}-card-status-${readId}`)).toHaveText("Lido");
    await expect(page.getByTestId(`${p}-card-read-${readId}`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-card-view-${readId}`)).toBeVisible();
  });

  test("ver detalhes: o diálogo mostra os dados do banco e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    const row = (await contactRow(id))!;
    await page.getByTestId(`${p}-card-view-${id}`).click();
    const dialog = page.getByTestId("contact-view-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("contact-view-name")).toContainText(row.name);
    await expect(page.getByTestId("contact-view-email")).toContainText(row.email);
    await expect(page.getByTestId("contact-view-phone")).toContainText(row.phone);
    await expect(page.getByTestId("contact-view-message")).toHaveText(row.message);
    await expect(page.getByTestId("contact-view-status")).toHaveText("Não lido");
    await expect(page.getByTestId("contact-view-mark-read")).toBeVisible();
    await expect(page.getByTestId("contact-view-delete")).toHaveCount(0);
    await page.getByTestId("close-contact-view-dialog-button").click();
    await expect(dialog).toBeHidden();

    await page.getByTestId(`${p}-card-view-${id}`).click();
    await page.getByTestId("contact-view-close").click();
    await expect(dialog).toBeHidden();
  });

  test("marcar como lido pelo cartão: grava no banco, avisa e sai da lista de não lidos", async ({ page, request }) => {
    const victim = await create(request, { name: `${tag} cartao-lido`, email: `cartao.${tag}@orfanatonib.test` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} cartao-lido`);
    await selectFilter(page, SCREEN, "read", "false");
    await expectCards(page, p, [victim.id]);
    expect((await contactRow(victim.id))?.read).toBe(0);

    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-card-read-${victim.id}`).click();
    });
    expect((await contactRow(victim.id))?.read).toBe(1);
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Contato marcado como lido");
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();

    const lidos = await selectFilter(page, SCREEN, "read", "true");
    expect(lidos.body.meta?.totalItems).toBe(1);
    await expect(page.getByTestId(`${p}-card-status-${victim.id}`)).toHaveText("Lido");
    await cleanupData(async () => { await deleteRaw(request, admin, victim.id); });
  });

  test("marcar como lido pelo diálogo; já lido mostra Excluir e leva à confirmação", async ({ page, request }) => {
    const victim = await create(request, { name: `${tag} dialogo-lido`, email: `dialogo.${tag}@orfanatonib.test` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} dialogo-lido`);
    await page.getByTestId(`${p}-card-view-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("contact-view-mark-read").click();
    });
    expect(reply.status).toBe(200);
    expect((await contactRow(victim.id))?.read).toBe(1);
    await expect(page.getByTestId("contact-view-dialog")).toBeHidden();
    await expect(page.getByTestId(`${p}-card-status-${victim.id}`)).toHaveText("Lido");

    await page.getByTestId(`${p}-card-view-${victim.id}`).click();
    await expect(page.getByTestId("contact-view-mark-read")).toHaveCount(0);
    await page.getByTestId("contact-view-delete").click();
    await expect(page.getByTestId("contact-view-dialog")).toBeHidden();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await contactRow(victim.id)).not.toBeNull();
    await cleanupData(async () => { await deleteRaw(request, admin, victim.id); });
  });

  test("excluir: cancelar mantém; confirmar apaga do banco, some do cartão e zera o total", async ({ page, request }) => {
    const victim = await create(request, { name: `${tag} apagar`, email: `apagar.${tag}@orfanatonib.test` });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await contactRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Contato excluído com sucesso");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await contactRow(victim.id)).toBeNull();
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const extra = `${tag} extra`;
    const made = [];
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) made.push(await create(request, { name: `${extra} ${String(i).padStart(2, "0")}`, email: `e${i}.${tag}@orfanatonib.test` }));
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
    expect(await contactRow(last)).toBeNull();
    await cleanupData(async () => { for (const contact of made) await deleteRaw(request, admin, contact.id); });
  });

  test("@mobile cartão no celular: ações empilhadas com 44px e filtro de situação pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    const view = await page.getByTestId(`${p}-card-view-${id}`).boundingBox();
    const read = await page.getByTestId(`${p}-card-read-${id}`).boundingBox();
    for (const box of [view, read]) expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(view!.x - read!.x)).toBeLessThanOrEqual(1);
    expect(read!.y).toBeGreaterThan(view!.y);

    await filtersVisible(page, p);
    const reply = await selectFilter(page, SCREEN, "read", "true");
    expect(reply.params.get("read")).toBe("true");
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-toolbar-refresh`).click();
    });
  });
});
