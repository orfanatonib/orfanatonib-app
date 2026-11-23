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
import { createIdeaWithDescription, deleteIdea, mediaRows, sectionRow } from "./ideas-sections.helpers";

/**
 * Tela `/adm/ideias-compartilhadas` na casca única (toolbar + cartões, tudo no servidor): carga, busca (título,
 * descrição, autor), tipo de mídia, período, ordenação, paginação, vazio, erro real, layout estável, 95%/98%, mobile,
 * RBAC, flag desligada e as ações do cartão (detalhes, editar e publicar, excluir) com dados próprios.
 */
const SCREEN: ListScreen = { p: "ideas-sections", path: "/adm/ideias-compartilhadas", endpoint: "/ideas-sections" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLM".split("");
const FLAGS = ["idea_submission", "idea_moderation"] as const;
const CARD = (id: string) => `${p}-card-${id}`;
const isImage = (index: number): boolean => index % 3 === 0;

test.describe.serial("Ideias compartilhadas: casca única, filtros no servidor e ações do cartão (UI real)", () => {
  const tag = `${RUN_TAG}-idl`;
  const zebra = `${tag}-zebra`;
  const ids: string[] = [];
  const flagsBefore: Record<string, boolean> = {};
  let admin: LoginResult;
  let member: LoginResult;

  const setFlag = (request: import("@playwright/test").APIRequestContext, key: string, enabled: boolean) =>
    request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled } });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "createdAt DESC, id ASC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT s.id FROM ideas_sections s WHERE s.title LIKE ? AND s.pageId IS NULL ${extra} ORDER BY ${order.replace(/(\w+)/g, (word) => (/^(createdAt|title|id)$/.test(word) ? `s.${word}` : word))}`,
        [`%${tag}%`, ...params],
      )
    ).map((row) => row.id);
  const byMedia = (mediaType: string): string =>
    `AND EXISTS (SELECT 1 FROM media_items mi WHERE mi.targetId = s.id AND mi.targetType = 'IdeasSection' AND mi.mediaType = '${mediaType}')`;

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    for (const key of FLAGS) {
      flagsBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, key, true);
    }
    for (const [index, letter] of LETTERS.entries()) {
      const idea = await createIdeaWithDescription(request, member.accessToken, {
        label: `${tag} ${letter}`,
        description: index === 5 ? `Descrição com ${zebra}` : `Descrição ${letter}`,
        image: isImage(index),
      });
      ids.push(idea.id);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of ids) await deleteIdea(request, admin.accessToken, id);
    });
    for (const key of FLAGS) await setFlag(request, key, flagsBefore[key]);
    if (CLEANUP_ENABLED) {
      expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM ideas_sections WHERE title LIKE ?", [`%${tag}%`])).toMatchObject({ n: 0 });
    }
    await closeDb();
  });

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "idea_moderation",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[ids.length - 1],
    hasCreate: false,
    cardDeleteTestId: (id) => `ideas-section-delete-${id}`,
  });

  registerUiFilterCases(SCREEN, () => tag, [
    {
      name: "tipo de mídia = imagem",
      apply: (page, screen) => selectFilter(page, screen, "mediaType", "image"),
      params: { mediaType: "image" },
      expectedIds: () => expectedIds(byMedia("image")),
    },
    {
      name: "tipo de mídia = vídeo",
      apply: (page, screen) => selectFilter(page, screen, "mediaType", "video"),
      params: { mediaType: "video" },
      expectedIds: () => expectedIds(byMedia("video")),
    },
    {
      name: "tipo de mídia = documento (vazio)",
      apply: (page, screen) => selectFilter(page, screen, "mediaType", "document"),
      params: { mediaType: "document" },
      expectedIds: () => expectedIds(byMedia("document")),
    },
    {
      name: "período: enviada a partir de hoje e até hoje",
      apply: async (page, screen) => {
        await setDateFilter(page, screen, "createdFrom", todayUtc());
        return setDateFilter(page, screen, "createdTo", todayUtc());
      },
      params: { createdFrom: todayUtc(), createdTo: todayUtc() },
      expectedIds: () => expectedIds("AND DATE(s.createdAt) = ?", [todayUtc()]),
    },
    {
      name: "período: a partir de amanhã (vazio)",
      apply: (page, screen) => setDateFilter(page, screen, "createdFrom", addDays(todayUtc(), 1)),
      params: { createdFrom: addDays(todayUtc(), 1) },
      expectedIds: async () => [],
    },
    {
      name: "ordenação título A→Z",
      apply: (page, screen) => selectFilter(page, screen, "sort", "title:ASC"),
      params: { sortBy: "title", order: "ASC" },
      expectedIds: () => expectedIds("", [], "title ASC, id ASC"),
    },
    {
      name: "ordenação título Z→A",
      apply: (page, screen) => selectFilter(page, screen, "sort", "title:DESC"),
      params: { sortBy: "title", order: "DESC" },
      expectedIds: () => expectedIds("", [], "title DESC, id ASC"),
    },
    {
      name: "ordenação envio: mais antigas primeiro",
      apply: (page, screen) => selectFilter(page, screen, "sort", "createdAt:ASC"),
      params: { sortBy: "createdAt", order: "ASC" },
      expectedIds: () => expectedIds("", [], "createdAt ASC, id ASC"),
    },
    {
      name: "combinado: imagem + título Z→A",
      apply: async (page, screen) => {
        await selectFilter(page, screen, "mediaType", "image");
        return selectFilter(page, screen, "sort", "title:DESC");
      },
      params: { mediaType: "image", sortBy: "title", order: "DESC" },
      expectedIds: () => expectedIds(byMedia("image"), [], "title DESC, id ASC"),
    },
  ]);

  test(`${p}: a busca alcança título, descrição e o e-mail do autor`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byDescription = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(zebra);
      },
      (params) => params.get("search") === zebra,
    );
    expect(byDescription.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);

    const row = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = ?", [member.userId]);
    const byAuthor = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(row!.email);
      },
      (params) => params.get("search") === row!.email,
    );
    expect(byAuthor.body.meta?.totalItems).toBe(
      (await queryOne<{ n: number }>(
        "SELECT COUNT(*) AS n FROM ideas_sections s LEFT JOIN users u ON u.id = s.user_id WHERE s.pageId IS NULL AND (s.title LIKE ? OR s.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)",
        [`%${row!.email}%`, `%${row!.email}%`, `%${row!.email}%`, `%${row!.email}%`],
      ))?.n,
    );
  });

  test(`${p}: cartão mostra capa/arquivos e tipos de mídia; detalhes abrem a ideia com a mídia da API`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    // 13 itens, 12 por página, mais novos primeiro: a primeira letra fica na página 2.
    const image = page.getByTestId(CARD(ids[12]));
    await expect(image).toContainText("1 arquivo(s)");
    await expect(image).toContainText("Imagem");
    const video = page.getByTestId(CARD(ids[11]));
    await expect(video).toContainText("Vídeo");

    await page.getByTestId(`ideas-section-details-${ids[11]}`).click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Mídias (1)")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
  });

  test(`${p}: editar e publicar leva à tela de edição com o id da ideia`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await page.getByTestId(`ideas-section-edit-${ids[2]}`).click();
    await expect(page).toHaveURL(new RegExp(`/adm/editar-ideias-compartilhadas.*${ids[2]}`));
    await expect(page.getByTestId("ideas-section-admin-heading")).toBeVisible({ timeout: 20_000 });
  });

  test(`${p}: excluir pelo cartão (cancelar não muda nada; confirmar apaga linha e mídia e a página recarrega do servidor)`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const target = ids[LETTERS.indexOf("M")];
    const total = (await expectedIds()).length;
    await page.getByTestId(`ideas-section-delete-${target}`).click();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(CARD(target))).toBeVisible();
    expect((await expectedIds()).length).toBe(total);

    await page.getByTestId(`ideas-section-delete-${target}`).click();
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reloaded.body.meta?.totalItems).toBe(total - 1);
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    expect(await sectionRow(target)).toBeNull();
    expect(await mediaRows(target)).toEqual([]);
    ids.splice(ids.indexOf(target), 1);
  });

  test(`${p}: @mobile o tipo de mídia e a ordenação ficam atrás do botão de filtros`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await filtersVisible(page, p);
    await expect(page.getByTestId(`${p}-filter-mediaType`)).toBeAttached();
    const reply = await selectFilter(page, SCREEN, "mediaType", "video");
    expect(reply.params.get("mediaType")).toBe("video");
  });
});
