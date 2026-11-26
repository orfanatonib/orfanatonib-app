import { API_URL } from "../../../playwright.live.config";
import { CLEANUP_ENABLED, cleanupData } from "../support/keep-data";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createFeedSection, createGallery, removeGallery, removeSection, setFlag } from "../shelter-feed/feed-fixtures";
import { postCommentPaced as postComment } from "./support";
import { approveComment, rejectComment } from "../shelter-feed/comments-moderation-helpers";
import { localShift } from "../support/local-day";

/**
 * Fila `GET /feed-section-comments/moderation` (admin): status, busca (texto, autor, legenda da publicação), período,
 * ordenação (envio, revisão) e paginação, tudo no banco. O envelope continua `{ items, counts, page, limit, total }`
 * e `counts` é o total GERAL por status (as abas), sem os filtros da consulta.
 */
const FLAGS = ["shelter_feed", "shelter_feed_comments"] as const;
const LABELS = ["alpha", "bravo", "charlie", "delta", "echo"] as const;
const day = (offset: number): string => localShift(offset);

interface Envelope {
  items: Array<{ id: string; content: string; status: string; author: { displayName: string } | null; post: { caption: string } | null }>;
  counts: Record<string, number>;
  page: number;
  limit: number;
  total: number;
}

test.describe.serial("Comentários do feed — fila de moderação filtrada, ordenada e paginada no servidor", () => {
  const tag = `${RUN_TAG}-fcapi`;
  const caption = `${tag} publicação`;
  let admin = "";
  let member = "";
  let leader = "";
  let memberName = "";
  let pageId = "";
  let sectionId = "";
  const ids: Record<string, string> = {};
  const flagsBefore: Record<string, boolean> = {};
  const base = `search=${encodeURIComponent(tag)}`;
  const url = (query: string) => `${API_URL}/feed-section-comments/moderation?${query}`;

  const fetchPage = async (request: import("@playwright/test").APIRequestContext, query: string, token = admin): Promise<Envelope> => {
    const response = await request.get(url(query), { headers: authHeaders(token) });
    expect(response.status(), await response.text()).toBe(200);
    return (await response.json()) as Envelope;
  };
  const labelsOf = (body: Envelope): string[] => body.items.map((item) => item.content.replace(`${tag}-`, ""));

  test.beforeAll(async ({ request }) => {
    test.setTimeout(240_000);
    const a = await loginAs(request, "admin");
    const m = await loginAs(request, "member");
    const l = await loginAs(request, "leader");
    admin = a.accessToken;
    member = m.accessToken;
    leader = l.accessToken;
    memberName = (await queryOne<{ name: string }>("SELECT name FROM users WHERE id = ?", [m.userId]))!.name;
    for (const key of FLAGS) {
      flagsBefore[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, admin, key, true);
    }
    const gallery = await createGallery(request, admin, `${tag} galeria`, `${tag} legada`);
    pageId = gallery.pageId;
    sectionId = await createFeedSection(request, member, admin, pageId, caption, true);
    for (const [index, label] of LABELS.entries()) {
      // membro: alpha, bravo, charlie; líder: delta, echo (sequencial: createdAt em ordem)
      ids[label] = await postComment(request, index < 3 ? member : leader, sectionId, `${tag}-${label}`);
    }
    expect((await approveComment(request, admin, ids.bravo)).ok()).toBe(true);
    // `reviewedAt` tem precisão de segundo: separa as revisões para a ordenação ser determinística.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect((await rejectComment(request, admin, ids.delta, `${tag} motivo`)).ok()).toBe(true);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await removeSection(request, admin, sectionId);
      await removeGallery(request, admin, pageId);
    });
    for (const key of FLAGS) await setFlag(request, admin, key, flagsBefore[key]);
    if (CLEANUP_ENABLED) expect(await countRows("image_section_comments", { sectionId })).toBe(0);
    await closeDb();
  });

  test("sem filtros: envelope legado com itens, contagem por status e total da busca", async ({ request }) => {
    const body = await fetchPage(request, base);
    expect(body).toMatchObject({ page: 1, limit: 10, total: 5 });
    expect(labelsOf(body)).toEqual([...LABELS].reverse());
    const rows = await queryAll<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM image_section_comments GROUP BY status");
    const expected = { pending: 0, approved: 0, rejected: 0, ...Object.fromEntries(rows.map((row) => [row.status, Number(row.n)])) };
    expect(body.counts).toEqual(expected);
  });

  test("status isolado e combinado com a busca; o total acompanha o filtro mas as contagens das abas não", async ({ request }) => {
    const pending = await fetchPage(request, `${base}&status=pending&sortBy=createdAt&order=ASC`);
    expect(labelsOf(pending)).toEqual(["alpha", "charlie", "echo"]);
    expect(pending.total).toBe(3);
    expect(labelsOf(await fetchPage(request, `${base}&status=approved`))).toEqual(["bravo"]);
    expect(labelsOf(await fetchPage(request, `${base}&status=rejected`))).toEqual(["delta"]);
    const all = await fetchPage(request, base);
    expect(pending.counts).toEqual(all.counts);
  });

  test("busca por texto, por nome do autor e pela legenda da publicação", async ({ request }) => {
    expect(labelsOf(await fetchPage(request, `search=${encodeURIComponent(`${tag}-charlie`)}`))).toEqual(["charlie"]);
    const byAuthor = await fetchPage(request, `search=${encodeURIComponent(memberName)}&limit=50`);
    const mine = byAuthor.items.filter((item) => item.content.startsWith(`${tag}-`)).map((item) => item.content.replace(`${tag}-`, ""));
    expect(mine.sort()).toEqual(["alpha", "bravo", "charlie"]);
    const byCaption = await fetchPage(request, `search=${encodeURIComponent(caption)}`);
    expect(byCaption.total).toBe(5);
    expect(byCaption.items.every((item) => item.post?.caption === caption)).toBe(true);
  });

  test("curingas do LIKE são escapados", async ({ request }) => {
    expect((await fetchPage(request, `search=${encodeURIComponent(`${tag}-%`)}`)).total).toBe(0);
    expect((await fetchPage(request, `search=${encodeURIComponent(`${tag}_alpha`)}`)).total).toBe(0);
  });

  test("período de criação: hoje traz tudo; amanhã (de) e ontem (até) esvaziam", async ({ request }) => {
    expect((await fetchPage(request, `${base}&createdFrom=${day(0)}&createdTo=${day(0)}`)).total).toBe(5);
    expect(await fetchPage(request, `${base}&createdFrom=${day(1)}`)).toMatchObject({ items: [], total: 0 });
    expect((await fetchPage(request, `${base}&createdTo=${day(-1)}`)).total).toBe(0);
  });

  test("ordenação: envio ASC/DESC (padrão DESC) e revisão (os não revisados ficam juntos)", async ({ request }) => {
    expect(labelsOf(await fetchPage(request, `${base}&sortBy=createdAt&order=ASC`))).toEqual([...LABELS]);
    expect(labelsOf(await fetchPage(request, `${base}&sortBy=createdAt&order=DESC`))).toEqual([...LABELS].reverse());
    // bravo foi aprovado antes de delta ser reprovado.
    expect(labelsOf(await fetchPage(request, `${base}&sortBy=reviewedAt&order=DESC`)).slice(0, 2)).toEqual(["delta", "bravo"]);
    expect(labelsOf(await fetchPage(request, `${base}&sortBy=reviewedAt&order=ASC`)).slice(-2)).toEqual(["bravo", "delta"]);
  });

  test("paginação: página 1, 2, última e fora do alcance; counts não mudam", async ({ request }) => {
    const first = await fetchPage(request, `${base}&sortBy=createdAt&order=ASC&page=1&limit=2`);
    expect(labelsOf(first)).toEqual(["alpha", "bravo"]);
    expect(first).toMatchObject({ page: 1, limit: 2, total: 5 });
    expect(labelsOf(await fetchPage(request, `${base}&sortBy=createdAt&order=ASC&page=2&limit=2`))).toEqual(["charlie", "delta"]);
    expect(labelsOf(await fetchPage(request, `${base}&sortBy=createdAt&order=ASC&page=3&limit=2`))).toEqual(["echo"]);
    const beyond = await fetchPage(request, `${base}&page=99&limit=2`);
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(5);
    expect(beyond.counts).toEqual(first.counts);
  });

  test("parâmetros inválidos são 400 (sortBy fora da lista, page=0, limit=51, status, datas, order, desconhecido)", async ({ request }) => {
    for (const query of ["sortBy=content", "sortBy=id", "page=0", "page=abc", "limit=51", "limit=0", "status=x", "createdFrom=01/01/2026", "createdTo=ontem", "order=UP", "foo=bar"]) {
      const response = await request.get(url(`${base}&${query}`), { headers: authHeaders(admin) });
      expect(response.status(), `${query}: ${await response.text()}`).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401; membro e líder 403", async ({ request }) => {
    expect((await request.get(url(base))).status()).toBe(401);
    for (const token of [member, leader]) {
      expect((await request.get(url(base), { headers: authHeaders(token) })).status()).toBe(403);
    }
  });

  test("flag desligada: 403 FEATURE_DISABLED mesmo com filtros; ligada de novo, a fila volta", async ({ request }) => {
    await setFlag(request, admin, "shelter_feed_comments", false);
    try {
      const response = await request.get(url(`${base}&status=pending`), { headers: authHeaders(admin) });
      expect(response.status()).toBe(403);
      expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
    } finally {
      await setFlag(request, admin, "shelter_feed_comments", true);
    }
    expect((await fetchPage(request, base)).total).toBe(5);
  });
});
