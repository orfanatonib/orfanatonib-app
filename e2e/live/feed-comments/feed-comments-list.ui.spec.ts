import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { CLEANUP_ENABLED, cleanupData } from "../support/keep-data";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test, type LoginResult } from "../support/live";
import {
  addDays,
  expectCards,
  filtersVisible,
  openAs,
  registerCommonSuite,
  selectFilter,
  setDateFilter,
  todayUtc,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { registerUiFilterCases } from "../support/moderation-list-ui";
import { createFeedSection, createGallery, removeGallery, removeSection, setFlag } from "../shelter-feed/feed-fixtures";
import { postCommentPaced } from "./support";
import { approveComment, rejectComment } from "../shelter-feed/comments-moderation-helpers";

/**
 * Tela `/adm/comentarios-feed` na casca única (abas de status com contagem + toolbar + cartões, tudo no servidor):
 * carga, busca, status (abas), período, ordenação, paginação, vazio, erro real, layout estável, 95%/98%, mobile,
 * RBAC, flag desligada e as ações de moderação (revisar, aprovar, reprovar com motivo, excluir).
 */
const SCREEN: ListScreen = { p: "feed-comments", path: "/adm/comentarios-feed", endpoint: "/feed-section-comments/moderation" };
const { p } = SCREEN;
const FLAGS = ["shelter_feed", "shelter_feed_comments"] as const;
const PER_AUTHOR = 5;
const CARD = (id: string) => `${p}-card-${id}`;

test.describe.serial("Comentários do feed: casca única, filtros no servidor e moderação (UI real)", () => {
  const tag = `${RUN_TAG}-fcl`;
  const ids: string[] = [];
  const flagsBefore: Record<string, boolean> = {};
  let admin: LoginResult;
  let pageId = "";
  let sectionId = "";

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "createdAt DESC, id DESC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT id FROM image_section_comments WHERE sectionId = ? AND content LIKE ? ${extra} ORDER BY ${order}`,
        [sectionId, `%${tag}%`, ...params],
      )
    ).map((row) => row.id);

  test.beforeAll(async ({ request }) => {
    test.setTimeout(240_000);
    admin = await loginAs(request, "admin");
    const member = await loginAs(request, "member");
    const leader = await loginAs(request, "leader");
    for (const key of FLAGS) {
      flagsBefore[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, admin.accessToken, key, true);
    }
    const gallery = await createGallery(request, admin.accessToken, `${tag} galeria`, `${tag} legada`);
    pageId = gallery.pageId;
    sectionId = await createFeedSection(request, member.accessToken, admin.accessToken, pageId, `${tag} publicação`, true);
    let counter = 0;
    for (const who of [admin, member, leader]) {
      for (let i = 0; i < PER_AUTHOR; i += 1) {
        counter += 1;
        ids.push(await postCommentPaced(request, who.accessToken, sectionId, `${tag} comentário ${String(counter).padStart(2, "0")}`));
      }
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await removeSection(request, admin.accessToken, sectionId);
      await removeGallery(request, admin.accessToken, pageId);
    });
    for (const key of FLAGS) await setFlag(request, admin.accessToken, key, flagsBefore[key]);
    if (CLEANUP_ENABLED) expect(await countRows("image_section_comments", { sectionId })).toBe(0);
    await closeDb();
  });

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "shelter_feed_comments",
    tag: () => tag,
    expectedDefault: () => expectedIds("AND status = 'pending'"),
    sampleCardId: () => ids[ids.length - 1],
    hasCreate: false,
    cardDeleteTestId: null,
  });

  test(`${p}: prepara estados distintos pela API (2 aprovados, 2 reprovados) para os filtros`, async ({ request }) => {
    for (const id of [ids[1], ids[2]]) expect((await approveComment(request, admin.accessToken, id)).ok()).toBe(true);
    for (const id of [ids[3], ids[4]]) expect((await rejectComment(request, admin.accessToken, id, `${tag} motivo`)).ok()).toBe(true);
    expect(await countRows("image_section_comments", { sectionId, status: "approved" })).toBe(2);
    expect(await countRows("image_section_comments", { sectionId, status: "rejected" })).toBe(2);
  });

  const tab = (status: "pending" | "approved" | "rejected" | "all") => async (page: import("@playwright/test").Page, screen: ListScreen) => {
    const expectedStatus = status === "all" ? null : status;
    return whenListLoaded(
      page,
      screen,
      async () => {
        await page.getByTestId(`${p}-tab-${status}`).click();
      },
      (params) => (params.get("status") ?? null) === expectedStatus,
    );
  };

  registerUiFilterCases(SCREEN, () => tag, [
    {
      name: "aba Pendentes (padrão) manda status=pending",
      apply: (page) => whenListLoaded(page, SCREEN, async () => { await page.getByTestId(`${p}-toolbar-refresh`).click(); }),
      params: { status: "pending" },
      expectedIds: () => expectedIds("AND status = 'pending'"),
    },
    {
      name: "aba Aprovados",
      apply: tab("approved"),
      params: { status: "approved" },
      expectedIds: () => expectedIds("AND status = 'approved'"),
    },
    {
      name: "aba Reprovados",
      apply: tab("rejected"),
      params: { status: "rejected" },
      expectedIds: () => expectedIds("AND status = 'rejected'"),
    },
    {
      name: "aba Todos (sem status)",
      apply: tab("all"),
      params: {},
      expectedIds: () => expectedIds(),
    },
    {
      name: "período: enviado a partir de hoje e até hoje (pendentes)",
      apply: async (page, screen) => {
        await setDateFilter(page, screen, "createdFrom", todayUtc());
        return setDateFilter(page, screen, "createdTo", todayUtc());
      },
      params: { status: "pending", createdFrom: todayUtc(), createdTo: todayUtc() },
      expectedIds: () => expectedIds("AND status = 'pending' AND DATE(createdAt) = ?", [todayUtc()]),
    },
    {
      name: "período: a partir de amanhã (vazio)",
      apply: (page, screen) => setDateFilter(page, screen, "createdFrom", addDays(todayUtc(), 1)),
      params: { createdFrom: addDays(todayUtc(), 1) },
      expectedIds: async () => [],
    },
    {
      name: "ordenação envio: mais antigos primeiro (pendentes)",
      apply: (page, screen) => selectFilter(page, screen, "sort", "createdAt:ASC"),
      params: { status: "pending", sortBy: "createdAt", order: "ASC" },
      expectedIds: () => expectedIds("AND status = 'pending'", [], "createdAt ASC, id DESC"),
    },
    {
      name: "combinado: aba Todos + revisão mais recente primeiro",
      apply: async (page, screen) => {
        await tab("all")(page, screen);
        return selectFilter(page, screen, "sort", "reviewedAt:DESC");
      },
      params: { sortBy: "reviewedAt", order: "DESC" },
      expectedIds: () => expectedIds("", [], "reviewedAt DESC, id DESC"),
    },
  ]);

  test(`${p}: as abas mostram a contagem geral por status (a mesma do banco) e a aba aberta é a de pendentes`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await expect(page.getByTestId(`${p}-tab-pending`)).toHaveAttribute("aria-selected", "true");
    const rows = await queryAll<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM image_section_comments GROUP BY status");
    const count = (status: string) => String(rows.find((row) => row.status === status)?.n ?? 0);
    for (const status of ["pending", "approved", "rejected"]) {
      await expect(page.getByTestId(`${p}-tab-count-${status}`)).toHaveText(count(status));
    }
    // Filtrar por busca não muda a contagem das abas (é a contagem geral).
    await page.getByTestId(`${p}-toolbar-search`).fill(`${tag} comentário 01`);
    await expect(page.getByTestId(`${p}-tab-count-pending`)).toHaveText(count("pending"));
    // "Limpar filtros" volta à aba de pendentes (a aba padrão não conta como filtro ativo).
    await tab("approved")(page, SCREEN);
    await expect(page.getByTestId(`${p}-tab-approved`)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();
    await filtersVisible(page, p);
    const cleared = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-clear-filters`).click();
      },
      (params) => params.get("status") === "pending" && !params.has("search"),
    );
    expect(cleared.params.get("status")).toBe("pending");
    await expect(page.getByTestId(`${p}-tab-pending`)).toHaveAttribute("aria-selected", "true");
  });

  test(`${p}: a busca alcança o texto, o autor e a publicação`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await tab("all")(page, SCREEN);
    const term = `${tag} comentário 07`;
    const byText = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(term);
      },
      (params) => params.get("search") === term,
    );
    expect(byText.body).toBeDefined();
    await expectCards(page, p, [ids[6]]);
    const caption = `${tag} publicação`;
    const byPost = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).fill(caption);
      },
      (params) => params.get("search") === caption,
    );
    expect(byPost.params.get("status")).toBeNull();
    await expect(page.getByTestId(`${p}-summary`).or(page.getByTestId(`${p}-pagination-summary`))).toContainText(new RegExp(`de ${ids.length}(\\D|$)`));
  });

  test(`${p}: revisar abre o comentário com a publicação; aprovar pela lista tira o cartão da aba de pendentes e atualiza as contagens`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const pendingBefore = (await expectedIds("AND status = 'pending'")).length;
    const target = (await expectedIds("AND status = 'pending'"))[0];
    await page.getByTestId(`${p}-review-${target}`).click();
    const dialog = page.getByTestId("feed-comments-review-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("feed-comments-review-post")).toContainText(`${tag} publicação`);
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await dialog.getByTestId("feed-comments-approve").click();
    });
    expect(reloaded.params.get("status")).toBe("pending");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    expect(await queryOne<{ status: string }>("SELECT status FROM image_section_comments WHERE id = ?", [target])).toMatchObject({ status: "approved" });
    expect((await expectedIds("AND status = 'pending'")).length).toBe(pendingBefore - 1);
    await expect(page.getByTestId(`${p}-tab-count-pending`)).toHaveText(
      String((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_section_comments WHERE status = 'pending'"))?.n),
    );
  });

  test(`${p}: reprovar exige o motivo; com motivo grava e o cartão passa para a aba de reprovados`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const target = (await expectedIds("AND status = 'pending'"))[0];
    await page.getByTestId(`${p}-review-${target}`).click();
    const dialog = page.getByTestId("feed-comments-review-dialog");
    await dialog.getByTestId("feed-comments-reject").click();
    await expect(dialog.getByText("Informe o motivo antes de reprovar.")).toBeVisible();
    expect((await queryOne<{ status: string }>("SELECT status FROM image_section_comments WHERE id = ?", [target]))?.status).toBe("pending");
    await dialog.getByTestId("feed-comments-review-reason").fill(`${tag} fora do tema`);
    await dialog.getByTestId("feed-comments-reject").click();
    await expect(dialog).toBeHidden();
    expect(await queryOne("SELECT status, moderationReason FROM image_section_comments WHERE id = ?", [target])).toMatchObject({
      status: "rejected",
      moderationReason: `${tag} fora do tema`,
    });
    await tab("rejected")(page, SCREEN);
    await expect(page.getByTestId(`${p}-card-status-${target}`)).toHaveAttribute("data-status", "rejected");
  });

  test(`${p}: excluir pela revisão, com confirmação: some do banco e da lista`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const target = (await expectedIds("AND status = 'pending'"))[0];
    await page.getByTestId(`${p}-review-${target}`).click();
    await page.getByTestId("feed-comments-delete").click();
    const reloaded = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId("feed-comments-delete-confirm").getByRole("button", { name: /excluir/i }).last().click();
    });
    expect(reloaded.params.get("status")).toBe("pending");
    await expect(page.getByTestId(CARD(target))).toHaveCount(0);
    await expect.poll(() => countRows("image_section_comments", { id: target })).toBe(0);
    ids.splice(ids.indexOf(target), 1);
  });

  test(`${p}: @mobile abas rolam, datas e ordenação ficam atrás do botão de filtros`, async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    for (const status of ["pending", "approved", "rejected"]) {
      const box = await page.getByTestId(`${p}-tab-${status}`).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(43.9);
    }
    await filtersVisible(page, p);
    await expect(page.getByTestId(`${p}-filter-createdFrom`)).toBeAttached();
    const reply = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(reply.params.get("sortBy")).toBe("createdAt");
  });
});
