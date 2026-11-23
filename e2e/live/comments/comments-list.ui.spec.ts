import { API_URL } from "../../../playwright.live.config";
import { CLEANUP_ENABLED, cleanupData } from "../support/keep-data";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test, type LoginResult } from "../support/live";
import {
  addDays,
  expectCards,
  filtersVisible,
  openAs,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  todayUtc,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { registerUiFilterCases } from "../support/moderation-list-ui";
import { commentRow, create, deleteRaw, putRaw } from "./support";

/**
 * Tela `/adm/comentarios` na casca única (toolbar + cartões, tudo no servidor): carga, busca (nome, comentário,
 * abrigo, bairro), status de publicação, abrigo, período, ordenação, paginação, vazio, erro real, layout estável,
 * 95%/98%, mobile, RBAC, flag desligada e as ações do cartão (detalhes, editar, publicar, excluir).
 */
const SCREEN: ListScreen = { p: "comments", path: "/adm/comentarios", endpoint: "/comments" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLM".split("");
const PUBLISHED_LETTERS = new Set(["D", "H"]);
const FLAGS = ["comment_submission", "comment_moderation"] as const;
const CARD = (id: string) => `${p}-card-${id}`;

test.describe.serial("Comentários: casca única, filtros no servidor e ações do cartão (UI real)", () => {
  const tag = `${RUN_TAG}-cml`;
  const sol = `Sol ${tag}`;
  const lua = `Lua ${tag}`;
  const zebra = `${tag}-zebra`;
  const ids: string[] = [];
  const flagsBefore: Record<string, boolean> = {};
  let admin: LoginResult;

  const setFlag = (request: import("@playwright/test").APIRequestContext, key: string, enabled: boolean) =>
    request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled } });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "createdAt DESC, id ASC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(`SELECT id FROM comments WHERE name LIKE ? ${extra} ORDER BY ${order}`, [`%${tag}%`, ...params])
    ).map((row) => row.id);
  const shelterOf = (index: number): string => (index % 2 === 0 ? sol : lua);

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    for (const key of FLAGS) {
      flagsBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, key, true);
    }
    for (const [index, letter] of LETTERS.entries()) {
      const body = await create(request, admin.accessToken, {
        name: `${tag} ${letter}`,
        comment: index === 5 ? `Depoimento com ${zebra}` : `Depoimento ${letter}`,
        shelter: shelterOf(index),
        neighborhood: `Bairro ${letter}`,
      });
      ids.push(body.id);
      if (PUBLISHED_LETTERS.has(letter)) {
        const res = await putRaw(request, admin.accessToken, body.id, {
          name: `${tag} ${letter}`,
          comment: `Depoimento ${letter}`,
          shelter: shelterOf(index),
          neighborhood: `Bairro ${letter}`,
          published: true,
        });
        expect(res.status(), await res.text()).toBe(200);
      }
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of ids) await deleteRaw(request, admin.accessToken, id);
    });
    for (const key of FLAGS) await setFlag(request, key, flagsBefore[key]);
    if (CLEANUP_ENABLED) {
      expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM comments WHERE name LIKE ?", [`%${tag}%`])).toMatchObject({ n: 0 });
    }
    await closeDb();
  });

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "comment_moderation",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[ids.length - 1],
    hasCreate: false,
    cardDeleteTestId: (id) => `comments-card-delete-${id}`,
  });

  const shelterFilter = (shelter: string) => async (page: import("@playwright/test").Page, screen: ListScreen) => {
    await filtersVisible(page, screen.p);
    return whenListLoaded(
      page,
      screen,
      async () => {
        await page.getByTestId(`${screen.p}-filter-shelter`).fill(shelter);
      },
      (params) => params.get("shelter") === shelter,
    );
  };

  registerUiFilterCases(SCREEN, () => tag, [
    {
      name: "status = publicado",
      apply: (page, screen) => selectFilter(page, screen, "published", "true"),
      params: { published: "true" },
      expectedIds: () => expectedIds("AND published = 1"),
    },
    {
      name: "status = não publicado",
      apply: (page, screen) => selectFilter(page, screen, "published", "false"),
      params: { published: "false" },
      expectedIds: () => expectedIds("AND published = 0"),
    },
    {
      name: "abrigo = Sol",
      apply: shelterFilter(sol),
      params: { shelter: sol },
      expectedIds: () => expectedIds("AND shelter = ?", [sol]),
    },
    {
      name: "combinado: abrigo Lua + não publicado",
      apply: async (page, screen) => {
        await selectFilter(page, screen, "published", "false");
        return shelterFilter(lua)(page, screen);
      },
      params: { published: "false", shelter: lua },
      expectedIds: () => expectedIds("AND published = 0 AND shelter = ?", [lua]),
    },
    {
      name: "período: enviado a partir de hoje e até hoje",
      apply: async (page, screen) => {
        await setDateFilter(page, screen, "createdFrom", todayUtc());
        return setDateFilter(page, screen, "createdTo", todayUtc());
      },
      params: { createdFrom: todayUtc(), createdTo: todayUtc() },
      expectedIds: () => expectedIds("AND DATE(createdAt) = ?", [todayUtc()]),
    },
    {
      name: "período: a partir de amanhã (vazio)",
      apply: (page, screen) => setDateFilter(page, screen, "createdFrom", addDays(todayUtc(), 1)),
      params: { createdFrom: addDays(todayUtc(), 1) },
      expectedIds: async () => [],
    },
    {
      name: "ordenação nome A→Z",
      apply: (page, screen) => selectFilter(page, screen, "sort", "name:ASC"),
      params: { sortBy: "name", order: "ASC" },
      expectedIds: () => expectedIds("", [], "name ASC, id ASC"),
    },
    {
      name: "ordenação nome Z→A",
      apply: (page, screen) => selectFilter(page, screen, "sort", "name:DESC"),
      params: { sortBy: "name", order: "DESC" },
      expectedIds: () => expectedIds("", [], "name DESC, id ASC"),
    },
    {
      name: "ordenação envio: mais antigos primeiro",
      apply: (page, screen) => selectFilter(page, screen, "sort", "createdAt:ASC"),
      params: { sortBy: "createdAt", order: "ASC" },
      expectedIds: () => expectedIds("", [], "createdAt ASC, id ASC"),
    },
  ]);

  test(`${p}: a busca alcança nome, comentário, abrigo e bairro`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byComment = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(zebra);
      },
      (params) => params.get("search") === zebra,
    );
    expect(byComment.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);
    const byNeighborhood = `Bairro C`;
    const reply = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(byNeighborhood);
      },
      (params) => params.get("search") === byNeighborhood,
    );
    const total = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM comments WHERE neighborhood LIKE ? OR name LIKE ? OR comment LIKE ? OR shelter LIKE ?", Array(4).fill(`%${byNeighborhood}%`)))?.n);
    expect(reply.body.meta?.totalItems).toBe(total);
    await expect(page.getByTestId(CARD(ids[LETTERS.indexOf("C")]))).toBeVisible();
  });

  test(`${p}: cartão mostra o estado; o publicado não oferece "Publicar"`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    // 13 itens, 12 por página, mais novos primeiro: a primeira letra fica na página 2.
    const pendingId = ids[LETTERS.indexOf("M")];
    const publishedId = ids[LETTERS.indexOf("D")];
    await expect(page.getByTestId(CARD(pendingId))).toContainText("Não Publicado");
    await expect(page.getByTestId(`comments-card-publish-${pendingId}`)).toBeVisible();
    await expect(page.getByTestId(CARD(publishedId))).toContainText("Publicado");
    await expect(page.getByTestId(`comments-card-publish-${publishedId}`)).toHaveCount(0);
  });

  test(`${p}: detalhes pelo cartão abrem o depoimento completo`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await page.getByTestId(`comments-card-view-${ids[1]}`).click();
    const dialog = page.getByTestId("comments-details-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`${tag} B`);
    await page.getByTestId("comments-details-close").click();
    await expect(dialog).toHaveCount(0);
  });

  test(`${p}: publicar com a lista em "não publicado": confirma, grava no banco, o cartão sai da página e o total desce`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "published", "false");
    const target = ids[0];
    const before = (await expectedIds("AND published = 0")).length;
    await page.getByTestId(`comments-card-publish-${target}`).click();
    await page.getByTestId("comments-publish-dialog-cancel").click();
    expect(await commentRow(target)).toMatchObject({ published: 0 });

    await page.getByTestId(`comments-card-publish-${target}`).click();
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("comments-publish-dialog-confirm").click();
    });
    expect(reloaded.params.get("published")).toBe("false");
    expect(reloaded.body.meta?.totalItems).toBe(before - 1);
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    expect(await commentRow(target)).toMatchObject({ published: 1 });
  });

  test(`${p}: editar pelo cartão valida os campos, grava e publica; a lista recarrega do servidor`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const target = ids[LETTERS.indexOf("B")];
    await page.getByTestId(`comments-card-edit-${target}`).click();
    await page.getByTestId("comments-edit-shelter").locator("input").fill("");
    await page.getByTestId("comments-edit-save").click();
    expect(await commentRow(target)).toMatchObject({ shelter: lua, published: 0 });

    await page.getByTestId("comments-edit-shelter").locator("input").fill(`${lua} editado`);
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("comments-edit-save").click();
    });
    expect(reloaded.body.meta?.totalItems).toBeGreaterThan(0);
    await expect.poll(() => commentRow(target)).toMatchObject({ shelter: `${lua} editado`, published: 1 });
  });

  test(`${p}: excluir pelo cartão (cancelar não muda nada; confirmar apaga e a página recarrega do servidor)`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const target = ids[LETTERS.indexOf("M")];
    const total = (await expectedIds()).length;
    await page.getByTestId(`comments-card-delete-${target}`).click();
    await page.getByTestId("comments-delete-dialog-cancel").click();
    await expect(page.getByTestId(CARD(target))).toBeVisible();
    expect((await expectedIds()).length).toBe(total);

    await page.getByTestId(`comments-card-delete-${target}`).click();
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("comments-delete-dialog-confirm").click();
    });
    expect(reloaded.body.meta?.totalItems).toBe(total - 1);
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    expect(await commentRow(target)).toBeNull();
    ids.splice(ids.indexOf(target), 1);
  });

  test(`${p}: @mobile status, abrigo e ordenação ficam atrás do botão de filtros`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await filtersVisible(page, p);
    await expect(page.getByTestId(`${p}-filter-published`)).toBeAttached();
    await expect(page.getByTestId(`${p}-filter-shelter`)).toBeAttached();
    const reply = await selectFilter(page, SCREEN, "published", "true");
    expect(reply.params.get("published")).toBe("true");
  });
});
