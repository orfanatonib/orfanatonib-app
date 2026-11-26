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
import { deleteRaw, png, sectionRow, submit } from "./support";

/**
 * Tela `/adm/fotos-abrigos` na casca única (toolbar + cartões, tudo no servidor): carga, busca, estado da revisão,
 * período, ordenação, paginação, vazio, erro real, layout estável, 95%/98%, mobile, RBAC, flag desligada e as ações
 * de moderação (ver, editar, reprovar, excluir) — pela UI e pela API/banco reais, com dados próprios.
 */
const SCREEN: ListScreen = { p: "image-sections", path: "/adm/fotos-abrigos", endpoint: "/image-sections" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLM".split("");
const REJECTED_LETTERS = new Set(["D", "H"]);
const FLAGS = ["shelter_photo_upload", "photo_moderation"] as const;
const CARD = (id: string) => `${p}-card-${id}`;

test.describe.serial("Fotos dos abrigos: casca única, filtros no servidor e ações de moderação (UI real)", () => {
  const tag = `${RUN_TAG}-imgl`;
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
        `SELECT id FROM image_sections WHERE caption LIKE ? AND pageId IS NULL ${extra} ORDER BY ${order}`,
        [`%${tag}%`, ...params],
      )
    ).map((row) => row.id);

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    for (const key of FLAGS) {
      flagsBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, key, true);
    }
    for (const [index, letter] of LETTERS.entries()) {
      const body = await submit(request, member.accessToken, {
        caption: `${tag} ${letter}`,
        description: index === 5 ? `Descrição com ${zebra}` : `Descrição ${letter}`,
        media: [{ file: png(`${letter}.png`) }],
      });
      ids.push(body.id);
      if (REJECTED_LETTERS.has(letter)) {
        const res = await request.patch(`${API_URL}/image-sections/${body.id}/reject`, {
          headers: authHeaders(admin.accessToken),
          data: { reason: `${tag} motivo ${letter}` },
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
      expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE caption LIKE ?", [`%${tag}%`])).toMatchObject({ n: 0 });
    }
    await closeDb();
  });

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "photo_moderation",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[ids.length - 1],
    hasCreate: false,
    cardDeleteTestId: null,
  });

  const rejectedIds = () => expectedIds("AND reviewStatus = 'rejected'");
  registerUiFilterCases(SCREEN, () => tag, [
    {
      name: "estado da revisão = reprovada",
      apply: (page, screen) => selectFilter(page, screen, "reviewStatus", "rejected"),
      params: { reviewStatus: "rejected" },
      expectedIds: rejectedIds,
    },
    {
      name: "estado da revisão = aguardando aprovação",
      apply: (page, screen) => selectFilter(page, screen, "reviewStatus", "pending"),
      params: { reviewStatus: "pending" },
      expectedIds: () => expectedIds("AND reviewStatus = 'pending'"),
    },
    {
      name: "estado da revisão = aprovada (vazio)",
      apply: (page, screen) => selectFilter(page, screen, "reviewStatus", "approved"),
      params: { reviewStatus: "approved" },
      expectedIds: () => expectedIds("AND reviewStatus = 'approved'"),
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
      name: "ordenação legenda A→Z",
      apply: (page, screen) => selectFilter(page, screen, "sort", "caption:ASC"),
      params: { sortBy: "caption", order: "ASC" },
      expectedIds: () => expectedIds("", [], "caption ASC, id ASC"),
    },
    {
      name: "ordenação legenda Z→A",
      apply: (page, screen) => selectFilter(page, screen, "sort", "caption:DESC"),
      params: { sortBy: "caption", order: "DESC" },
      expectedIds: () => expectedIds("", [], "caption DESC, id ASC"),
    },
    {
      name: "ordenação envio: mais antigas primeiro",
      apply: (page, screen) => selectFilter(page, screen, "sort", "createdAt:ASC"),
      params: { sortBy: "createdAt", order: "ASC" },
      expectedIds: () => expectedIds("", [], "createdAt ASC, id ASC"),
    },
    {
      name: "combinado: reprovadas + legenda Z→A",
      apply: async (page, screen) => {
        await selectFilter(page, screen, "reviewStatus", "rejected");
        return selectFilter(page, screen, "sort", "caption:DESC");
      },
      params: { reviewStatus: "rejected", sortBy: "caption", order: "DESC" },
      expectedIds: () => expectedIds("AND reviewStatus = 'rejected'", [], "caption DESC, id ASC"),
    },
  ]);

  test(`${p}: a busca alcança legenda, descrição e autor`, async ({ page, request }) => {
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

    const row = await queryOne<{ name: string }>("SELECT name FROM users WHERE id = ?", [member.userId]);
    const byAuthor = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(row!.name);
      },
      (params) => params.get("search") === row!.name,
    );
    expect(byAuthor.body.meta?.totalItems).toBe(
      (await queryOne<{ n: number }>(
        "SELECT COUNT(*) AS n FROM image_sections s LEFT JOIN users u ON u.id = s.authorId WHERE s.pageId IS NULL AND (s.caption LIKE ? OR s.description LIKE ? OR u.name LIKE ?)",
        [`%${row!.name}%`, `%${row!.name}%`, `%${row!.name}%`],
      ))?.n,
    );
  });

  test(`${p}: cartão mostra capa, estado, resumo da mídia; reprovada traz o motivo e não oferece reprovar de novo`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    // 13 itens, 12 por página, mais novos primeiro: a primeira letra fica na página 2.
    const pendingId = ids[LETTERS.indexOf("M")];
    const rejectedId = ids[LETTERS.indexOf("D")];
    const pending = page.getByTestId(CARD(pendingId));
    await expect(pending.getByTestId("image-section-status")).toHaveText("Aguardando aprovação");
    await expect(pending.getByTestId("image-section-media-summary")).toHaveText("1 foto");
    await expect(pending.getByTestId("image-section-reject")).toBeVisible();
    const rejected = page.getByTestId(CARD(rejectedId));
    await expect(rejected.getByTestId("image-section-status")).toHaveText("Reprovada");
    await expect(rejected.getByTestId("image-section-rejection-reason")).toContainText(`${tag} motivo D`);
    await expect(rejected.getByTestId("image-section-reject")).toHaveCount(0);
  });

  test(`${p}: ver e editar pelo cartão (detalhes do autor; editar abre a revisão)`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const id = ids[1];
    await page.getByTestId(CARD(id)).getByTestId("image-section-view").click();
    const details = page.getByTestId("image-section-details");
    await expect(details).toBeVisible();
    await expect(details.getByTestId("image-section-details-author")).toContainText("Enviado por:");
    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);

    await page.getByTestId(CARD(id)).getByTestId("image-section-edit").click();
    await expect(page).toHaveURL(/\/adm\/editar-imagens-shelter$/);
    await expect(page.getByTestId("image-sections-image-section-editor-admin")).toBeVisible();
  });

  test(`${p}: reprovar pelo cartão com a lista filtrada em "aguardando": o cartão sai da página e o total desce`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "reviewStatus", "pending");
    const target = ids[LETTERS.indexOf("A")];
    const before = (await expectedIds("AND reviewStatus = 'pending'")).length;
    await page.getByTestId(CARD(target)).getByTestId("image-section-reject").click();
    const dialog = page.getByTestId("reject-image-section-dialog");
    await dialog.getByTestId("reject-image-section-reason").fill(`${tag} reprovada pela lista`);
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await dialog.getByTestId("reject-image-section-confirm").click();
    });
    expect(reloaded.params.get("reviewStatus")).toBe("pending");
    expect(reloaded.body.meta?.totalItems).toBe(before - 1);
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    expect(await sectionRow(target)).toMatchObject({ reviewStatus: "rejected", rejectionReason: `${tag} reprovada pela lista` });
    expect(await expectedIds("AND reviewStatus = 'pending'")).toHaveLength(before - 1);
  });

  test(`${p}: excluir pelo cartão (cancelar não muda nada; confirmar apaga e a página recarrega do servidor)`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const target = ids[LETTERS.indexOf("M")];
    const total = (await expectedIds()).length;
    await page.getByTestId(CARD(target)).getByTestId("image-section-delete").click();
    await page.getByTestId("image-section-delete-dialog-cancel").click();
    await expect(page.getByTestId(CARD(target))).toBeVisible();
    expect((await expectedIds()).length).toBe(total);

    await page.getByTestId(CARD(target)).getByTestId("image-section-delete").click();
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("image-section-delete-dialog-confirm").click();
    });
    expect(reloaded.body.meta?.totalItems).toBe(total - 1);
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    expect(await sectionRow(target)).toBeNull();
    ids.splice(ids.indexOf(target), 1);
  });

  test(`${p}: @mobile os filtros ficam atrás do botão e a ordenação aparece como seletor`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await filtersVisible(page, p);
    await expect(page.getByTestId(`${p}-filter-reviewStatus`)).toBeAttached();
    await expect(page.getByTestId(`${p}-filter-sort`)).toBeAttached();
    const reply = await selectFilter(page, SCREEN, "sort", "caption:ASC");
    expect(reply.params.get("sortBy")).toBe("caption");
  });
});
