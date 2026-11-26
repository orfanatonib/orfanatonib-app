import { queryAll, queryOne } from "../support/db";
import {
  addDays,
  cardIds,
  clearAllFilters,
  deleteAllByTag,
  expectCards,
  goToPage,
  openAs,
  PAGE_SIZE,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  summaryText,
  todayUtc,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { expect, loginAs, test } from "../support/live";
import { cleanupData } from "../support/keep-data";
import { massCount } from "../support/keep-data";
import { create, informativeRow, routesCount } from "./support";

const SCREEN: ListScreen = { p: "informatives", path: "/adm/informativos", endpoint: "/informatives" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLMN".split("");
const isPublic = (index: number): boolean => index % 3 !== 0;

test.describe.serial("Informativos: casca única, visibilidade e filtros no servidor (UI real)", () => {
  const tag = `e2e-inf-${Date.now().toString(36)}`;
  let ids: string[] = [];

  test.beforeAll(async ({ request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    for (const [index, letter] of LETTERS.entries()) {
      const banner = await create(request, token, {
        title: `${tag} ${letter}`,
        description: index === 5 ? `descr-${tag}` : `Descrição ${letter}`,
        public: isPublic(index),
      });
      ids.push(banner.id);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await deleteAllByTag(request, "/informatives", tag, (row) => row.id as string | undefined);
      expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM informatives WHERE title LIKE ?", [`%${tag}%`])).toMatchObject({ n: 0 });
    });
  });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "i.createdAt DESC, i.id DESC"): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT i.id AS id FROM informatives i WHERE i.title LIKE ? ${extra} ORDER BY ${order}`, [`%${tag}%`, ...params])).map((r) => r.id);

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "informative_management",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[1],
  });

  test("filtro de visibilidade: públicos e privados batem com o banco; 'Todos' remove o parâmetro", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const pub = await selectFilter(page, SCREEN, "public", "true");
    expect(pub.params.get("public")).toBe("true");
    const dbPublic = await expectedIds("AND i.`public` = 1");
    expect(pub.body.meta?.totalItems).toBe(dbPublic.length);
    await expectCards(page, p, dbPublic.slice(0, PAGE_SIZE));
    for (const id of dbPublic.slice(0, 4)) await expect(page.getByTestId(`${p}-card-visibility-${id}`)).toHaveText("Público");

    const priv = await selectFilter(page, SCREEN, "public", "false");
    expect(priv.params.get("public")).toBe("false");
    const dbPrivate = await expectedIds("AND i.`public` = 0");
    expect(priv.body.meta?.totalItems).toBe(dbPrivate.length);
    await expectCards(page, p, dbPrivate);
    for (const id of dbPrivate) await expect(page.getByTestId(`${p}-card-visibility-${id}`)).toHaveText("Privado");
    expect(dbPublic.length + dbPrivate.length).toBe(LETTERS.length);

    const all = await selectFilter(page, SCREEN, "public", "");
    expect(all.params.has("public")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length);
  });

  test("filtro de visibilidade sem busca: total da API igual ao do banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const reply = await selectFilter(page, SCREEN, "public", "false");
    const row = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM informatives WHERE `public` = 0");
    expect(reply.body.meta?.totalItems).toBe(Number(row?.n));
  });

  test("datas de criação: de hoje, até ontem e a partir de amanhã batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = todayUtc();
    const from = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(from.body.meta?.totalItems).toBe((await expectedIds("AND i.createdAt >= ?", [today])).length);
    const to = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(to.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    const inclusive = await setDateFilter(page, SCREEN, "createdTo", today);
    expect(inclusive.body.meta?.totalItems).toBe((await expectedIds("AND i.createdAt >= ? AND i.createdAt < ?", [today, addDays(today, 1)])).length);
    await setDateFilter(page, SCREEN, "createdFrom", addDays(today, 1));
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação: título A–Z/Z–A e criação mais antigos/recentes seguem o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const asc = await selectFilter(page, SCREEN, "sort", "title:ASC");
    expect(asc.params.get("sortBy")).toBe("title");
    await expectCards(page, p, (await expectedIds("", [], "i.title ASC")).slice(0, PAGE_SIZE));
    await selectFilter(page, SCREEN, "sort", "title:DESC");
    await expectCards(page, p, (await expectedIds("", [], "i.title DESC")).slice(0, PAGE_SIZE));
    const oldest = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(oldest.params.get("order")).toBe("ASC");
    const times = new Map((await queryAll<{ id: string; createdAt: string }>("SELECT id, createdAt FROM informatives WHERE title LIKE ?", [`%${tag}%`])).map((r) => [r.id, r.createdAt]));
    const shown = (await cardIds(page, p)).map((id) => times.get(id) as string);
    expect([...shown].sort()).toEqual(shown);
  });

  test("filtros combinados: busca (também na descrição) + visibilidade + data + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "public", "true");
    await setDateFilter(page, SCREEN, "createdFrom", todayUtc());
    const reply = await selectFilter(page, SCREEN, "sort", "title:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, public: "true", createdFrom: todayUtc(), sortBy: "title", order: "DESC" });
    const expected = await expectedIds("AND i.`public` = 1 AND i.createdAt >= ?", [todayUtc()], "i.title DESC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    await clearAllFilters(page, SCREEN);
    const byDescription = await searchFor(page, SCREEN, `descr-${tag}`);
    expect(byDescription.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);
  });

  test("cartão: título, selo de visibilidade, data de criação e as ações aparecem", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "title:ASC");
    await expect(page.getByTestId(`${p}-card-title-${ids[1]}`)).toHaveText(`${tag} B`);
    await expect(page.getByTestId(`${p}-card-visibility-${ids[1]}`)).toHaveText("Público");
    await expect(page.getByTestId(`${p}-card-visibility-${ids[0]}`)).toHaveText("Privado");
    await expect(page.getByTestId(`${p}-card-created-${ids[1]}`)).toContainText("Criado em");
    await expect(page.getByTestId(`${p}-card-edit-${ids[1]}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-delete-${ids[1]}`)).toBeVisible();
  });

  test("criar pela UI: o banner nasce no banco (com rota) e aparece na lista", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const title = `${tag} UI novo`;
    await page.getByTestId(`${p}-create`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-error`)).toContainText("Preencha título e descrição.");
    await page.getByTestId(`${p}-form-title`).fill(title);
    await page.getByTestId(`${p}-form-description`).fill("Criado pela interface");
    await page.getByTestId(`${p}-form-public`).uncheck();
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-form-submit`).click();
    });
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    const row = await queryOne<{ id: string; public: number }>("SELECT id, `public` FROM informatives WHERE title = ?", [title]);
    expect(row).toMatchObject({ public: 0 });
    expect(await routesCount(row!.id)).toBe(1);
    await searchFor(page, SCREEN, title);
    await expectCards(page, p, [row!.id]);
    await expect(page.getByTestId(`${p}-card-visibility-${row!.id}`)).toHaveText("Privado");
  });

  test("editar pela UI: o modal vem preenchido e o novo título e a visibilidade chegam ao banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "title:ASC");
    const id = ids[2];
    await page.getByTestId(`${p}-card-edit-${id}`).click();
    await expect(page.getByTestId(`${p}-form-title`)).toHaveValue(`${tag} C`);
    const renamed = `${tag} C editado`;
    await page.getByTestId(`${p}-form-title`).fill(renamed);
    await page.getByTestId(`${p}-form-public`).uncheck();
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    expect(await informativeRow(id)).toMatchObject({ title: renamed, public: 0 });
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toHaveText(renamed);
    await expect(page.getByTestId(`${p}-card-visibility-${id}`)).toHaveText("Privado");
  });

  test("excluir: cancelar mantém; confirmar apaga o banner e a rota do banco", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const victim = await create(request, token, { title: `${tag} apagar`, public: true });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);
    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await informativeRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await informativeRow(victim.id)).toBeNull();
    expect(await routesCount(victim.id)).toBe(0);
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const extra = `${tag} extra`;
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) await create(request, token, { title: `${extra} ${String(i).padStart(2, "0")}` });
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
    expect(await informativeRow(last)).toBeNull();
  });

  test("@mobile cartão no celular: edição com 44px e filtro de visibilidade pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "title:ASC");
    const edit = await page.getByTestId(`${p}-card-edit-${ids[1]}`).boundingBox();
    expect(edit!.height).toBeGreaterThanOrEqual(44);
    const reply = await selectFilter(page, SCREEN, "public", "false");
    expect(reply.params.get("public")).toBe("false");
  });

  test("massa: cada execução deixa de 5 a 10 banners pela UI (públicos e privados), com rota criada", async ({ page, request }) => {
    const total = massCount();
    await openAs(page, request, SCREEN);
    const titles: string[] = [];
    for (let index = 0; index < total; index += 1) {
      const title = `${tag} massa ${String(index + 1).padStart(2, "0")}`;
      await page.getByTestId(`${p}-create`).click();
      await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
      await page.getByTestId(`${p}-form-title`).fill(title);
      await page.getByTestId(`${p}-form-description`).fill(`Banner de massa ${index + 1} da execução ${tag}`);
      if (index % 2 === 1) await page.getByTestId(`${p}-form-public`).uncheck();
      await page.getByTestId(`${p}-form-submit`).click();
      await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
      titles.push(title);
    }
    for (const [index, title] of titles.entries()) {
      const row = await queryOne<{ id: string; public: number }>("SELECT id, `public` FROM informatives WHERE title = ?", [title]);
      expect(row, title).not.toBeNull();
      expect(row!.public).toBe(index % 2 === 1 ? 0 : 1);
      expect(await routesCount(row!.id)).toBe(1);
    }
    await searchFor(page, SCREEN, `${tag} massa`);
    await expect(summaryText(page, p)).toHaveText(new RegExp(`de ${total}$`));
  });
});

