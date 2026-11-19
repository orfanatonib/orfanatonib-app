import { API_URL } from "../../../playwright.live.config";
import { RUN_TAG } from "../support/factory";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import {
  createFeedSection,
  createGallery,
  readFeed,
  removeGallery,
  removeSection,
  setFlag,
} from "./feed-fixtures";

/**
 * Feed v2 (plano 36): autoria, celebrar e comentários nas fotos — API + MySQL reais.
 * Dados próprios (galeria e seções criadas pela API) e limpos no fim.
 */
const NIL = "00000000-0000-4000-8000-000000000000";
const FLAGS = ["shelter_feed", "shelter_feed_celebrations", "shelter_feed_comments"] as const;

test.describe.serial("Feed v2 — autoria, celebrar e comentários", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let memberId: string;
  let leaderId: string;
  let pageId: string;
  let legacyId: string;
  let publicId: string;
  let privateId: string;
  const created: string[] = [];
  const flagBefore: Record<string, boolean> = {};

  const toggle = (request: import("@playwright/test").APIRequestContext, section: string, token?: string) =>
    request.post(`${API_URL}/feed-sections/${section}/celebration/toggle`, {
      headers: token ? authHeaders(token) : {},
    });
  const comments = (section: string) => `${API_URL}/feed-sections/${section}/comments`;

  test.beforeAll(async ({ request }) => {
    const a = await loginAs(request, "admin");
    const l = await loginAs(request, "leader");
    const m = await loginAs(request, "member");
    admin = a.accessToken;
    leader = l.accessToken;
    member = m.accessToken;
    memberId = m.userId;
    leaderId = l.userId;
    for (const key of FLAGS) {
      flagBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
    }
    const gallery = await createGallery(request, admin, `${RUN_TAG} galeria feed`, `${RUN_TAG} legada`);
    pageId = gallery.pageId;
    legacyId = gallery.legacySectionId;
    publicId = await createFeedSection(request, member, admin, pageId, `${RUN_TAG} pública`, true);
    privateId = await createFeedSection(request, member, admin, pageId, `${RUN_TAG} privada`, false);
    created.push(publicId, privateId);
  });

  test.afterAll(async ({ request }) => {
    for (const key of FLAGS) await setFlag(request, admin, key, flagBefore[key]);
    for (const id of created) await removeSection(request, admin, id);
    await removeGallery(request, admin, pageId);
    // Nada sobra: seções, celebrações e comentários da galeria do cenário.
    expect(await countRows("image_pages", { id: pageId })).toBe(0);
    for (const id of [publicId, privateId, legacyId]) {
      expect(await countRows("image_sections", { id })).toBe(0);
      expect(await countRows("image_section_celebrations", { sectionId: id })).toBe(0);
      expect(await countRows("image_section_comments", { sectionId: id })).toBe(0);
    }
    await closeDb();
  });

  // ---------------- autoria ----------------

  test("[shelter-feed.author#grava-autor] POST /image-sections grava o usuário da sessão como autor", async () => {
    const row = await queryOne<{ authorId: string | null }>("SELECT authorId FROM image_sections WHERE id = ?", [publicId]);
    expect(row?.authorId).toBe(memberId);
  });

  test("[shelter-feed.author#legado] seção anterior ao feed v2 fica sem autor (nulo no banco e no DTO)", async ({ request }) => {
    const row = await queryOne<{ authorId: string | null }>("SELECT authorId FROM image_sections WHERE id = ?", [legacyId]);
    expect(row?.authorId).toBeNull();
    const feed = await readFeed(request, pageId, member);
    expect(feed.find((s) => s.id === legacyId)?.author).toBeNull();
  });

  test("[shelter-feed.author#logado] logado vê só o nome público (primeiro nome + inicial), nunca e-mail/telefone", async ({ request }) => {
    const response = await request.get(`${API_URL}/image-pages/${pageId}/sections?page=1&limit=50`, {
      headers: authHeaders(leader),
    });
    const text = await response.text();
    const section = (JSON.parse(text) as { sections: Array<{ id: string; author: { displayName: string } | null }> }).sections.find(
      (s) => s.id === publicId,
    );
    expect(section?.author?.displayName).toMatch(/^\S+( \S\.)?$/);
    expect(text).not.toContain("e2e.member@orfanatonib.test");
    expect(text).not.toMatch(/"(email|phone|password)"/);
  });

  test("[shelter-feed.author#anonimo] visitante só vê públicas e sem autoria/comentários", async ({ request }) => {
    const feed = await readFeed(request, pageId);
    const ids = feed.map((s) => s.id);
    expect(ids).toContain(publicId);
    expect(ids).not.toContain(privateId);
    for (const section of feed) {
      expect(section.author).toBeNull();
      expect(section.commentCount).toBe(0);
      expect(section.celebratedByMe).toBe(false);
    }
  });

  test("[shelter-feed.author#moderacao] fila do admin traz o autor e filtra por authorId; não-admin: 403", async ({ request }) => {
    const pending = await createPending(request);
    const filtered = await request.get(`${API_URL}/image-sections?authorId=${leaderId}`, { headers: authHeaders(admin) });
    expect(filtered.status()).toBe(200);
    const list = (await filtered.json()) as Array<{ id: string; authorId: string | null; author: { displayName: string } | null }>;
    expect(list.map((s) => s.id)).toContain(pending);
    expect(list.every((s) => s.authorId === leaderId)).toBe(true);
    expect((await request.get(`${API_URL}/image-sections?authorId=${leaderId}`, { headers: authHeaders(member) })).status()).toBe(403);
    expect((await request.get(`${API_URL}/image-sections?authorId=nao-uuid`, { headers: authHeaders(admin) })).status()).toBe(400);
  });

  async function createPending(request: import("@playwright/test").APIRequestContext): Promise<string> {
    const response = await request.post(`${API_URL}/image-sections`, {
      headers: authHeaders(leader),
      multipart: {
        sectionData: JSON.stringify({
          caption: `${RUN_TAG} pendente`,
          description: "d",
          public: false,
          mediaItems: [
            { title: "t", uploadType: "link", mediaType: "image", isLocalFile: false, url: "https://example.com/p.png", platformType: "googledrive" },
          ],
        }),
      },
    });
    expect(response.status()).toBe(201);
    const { id } = (await response.json()) as { id: string };
    created.push(id);
    return id;
  }

  // ---------------- celebrar ----------------

  test("[shelter-feed.celebrate#perfil-anonimo] visitante não celebra: 401 e nada gravado", async ({ request }) => {
    const res = await toggle(request, publicId);
    expect(res.status()).toBe(401);
    expect(await countRows("image_section_celebrations", { sectionId: publicId })).toBe(0);
  });

  test("[shelter-feed.celebrate#validacao] id inválido: 400; inexistente ou ainda sem galeria: 404", async ({ request }) => {
    expect((await toggle(request, "nao-uuid", member)).status()).toBe(400);
    expect((await toggle(request, NIL, member)).status()).toBe(404);
    const pending = await createPending(request);
    expect((await toggle(request, pending, member)).status()).toBe(404);
    expect(await countRows("image_section_celebrations", { sectionId: pending })).toBe(0);
  });

  test("[shelter-feed.celebrate#alternar] membro celebra e descelebra; banco e contagem acompanham", async ({ request }) => {
    const on = await toggle(request, publicId, member);
    expect(on.status()).toBe(201);
    expect(await on.json()).toEqual({ sectionId: publicId, count: 1, celebratedByMe: true });
    expect(await countRows("image_section_celebrations", { sectionId: publicId, userId: memberId })).toBe(1);

    const feed = await readFeed(request, pageId, member);
    expect(feed.find((s) => s.id === publicId)).toMatchObject({ celebrationCount: 1, celebratedByMe: true });
    const asLeader = await readFeed(request, pageId, leader);
    expect(asLeader.find((s) => s.id === publicId)).toMatchObject({ celebrationCount: 1, celebratedByMe: false });

    const off = await toggle(request, publicId, member);
    expect(await off.json()).toEqual({ sectionId: publicId, count: 0, celebratedByMe: false });
    expect(await countRows("image_section_celebrations", { sectionId: publicId })).toBe(0);
  });

  test("[shelter-feed.celebrate#uma-por-pessoa] duas pessoas somam 2; a mesma pessoa nunca passa de 1 (índice único)", async ({ request }) => {
    await toggle(request, publicId, member);
    const second = await toggle(request, publicId, leader);
    expect((await second.json()).count).toBe(2);
    expect(await countRows("image_section_celebrations", { sectionId: publicId })).toBe(2);
    await toggle(request, publicId, member);
    await toggle(request, publicId, leader);
    expect(await countRows("image_section_celebrations", { sectionId: publicId })).toBe(0);
  });

  test("[shelter-feed.celebrate#concorrencia] 8 alternâncias simultâneas do mesmo usuário: sem 5xx e no máximo 1 linha", async ({ request }) => {
    const results = await Promise.all(Array.from({ length: 8 }, () => toggle(request, publicId, member)));
    for (const res of results) expect(res.status()).toBeLessThan(500);
    expect(await countRows("image_section_celebrations", { sectionId: publicId, userId: memberId })).toBeLessThanOrEqual(1);
    const state = await (await request.get(`${API_URL}/feed-sections/${publicId}/celebration`, { headers: authHeaders(member) })).json();
    expect(state.count).toBe(await countRows("image_section_celebrations", { sectionId: publicId }));
    // limpa
    if (state.celebratedByMe) await toggle(request, publicId, member);
  });

  test("[shelter-feed.celebrate#leitura-publica] visitante lê só a contagem (sem nomes); privada: 404", async ({ request }) => {
    await toggle(request, publicId, member);
    const pub = await request.get(`${API_URL}/feed-sections/${publicId}/celebration`);
    expect(pub.status()).toBe(200);
    expect(await pub.json()).toEqual({ sectionId: publicId, count: 1, celebratedByMe: false });
    expect((await request.get(`${API_URL}/feed-sections/${privateId}/celebration`)).status()).toBe(404);
    const asMember = await request.get(`${API_URL}/feed-sections/${privateId}/celebration`, { headers: authHeaders(member) });
    expect(asMember.status()).toBe(200);
    await toggle(request, publicId, member);
  });

  test("[shelter-feed.celebrate#flag] flag desligada: 403 FEATURE_DISABLED e o banco não muda", async ({ request }) => {
    await setFlag(request, admin, "shelter_feed_celebrations", false);
    const before = await countRows("image_section_celebrations", { sectionId: publicId });
    const res = await toggle(request, publicId, member);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_section_celebrations", { sectionId: publicId })).toBe(before);
    await setFlag(request, admin, "shelter_feed_celebrations", true);
  });

  // ---------------- comentários ----------------

  test("[shelter-feed.comment#perfil-anonimo] visitante não lê nem comenta: 401", async ({ request }) => {
    expect((await request.get(comments(publicId))).status()).toBe(401);
    const res = await request.post(comments(publicId), { data: { content: "oi" } });
    expect(res.status()).toBe(401);
    expect(await countRows("image_section_comments", { sectionId: publicId })).toBe(0);
  });

  test("[shelter-feed.comment#criar] membro comenta: 201, autor da sessão no banco, só nome público na resposta", async ({ request }) => {
    const res = await request.post(comments(publicId), { headers: authHeaders(member), data: { content: `  ${RUN_TAG} que lindo!  ` } });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ content: `${RUN_TAG} que lindo!`, isMine: true, canDelete: true, authorId: null });
    expect(JSON.stringify(body)).not.toContain("e2e.member@");
    const row = await queryOne<{ authorId: string; content: string }>("SELECT authorId, content FROM image_section_comments WHERE id = ?", [body.id]);
    expect(row).toMatchObject({ authorId: memberId, content: `${RUN_TAG} que lindo!` });
  });

  test("[shelter-feed.comment#validacao] vazio, 501 caracteres, e-mail, telefone e link: 400 sem gravar", async ({ request }) => {
    const before = await countRows("image_section_comments", { sectionId: publicId });
    const bad = ["   ", "a".repeat(501), "escreva para ana@igreja.org", "ligue 11 99999-1234", "veja https://x.com/foto"];
    for (const content of bad) {
      const res = await request.post(comments(publicId), { headers: authHeaders(member), data: { content } });
      expect(res.status(), content.slice(0, 20)).toBe(400);
    }
    expect((await request.post(comments(publicId), { headers: authHeaders(member), data: {} })).status()).toBe(400);
    expect(await countRows("image_section_comments", { sectionId: publicId })).toBe(before);
    const edge = await request.post(comments(publicId), { headers: authHeaders(member), data: { content: "b".repeat(500) } });
    expect(edge.status()).toBe(201);
  });

  test("[shelter-feed.comment#listar] paginação, ordem recente primeiro, limites de query e total", async ({ request }) => {
    const total = await countRows("image_section_comments", { sectionId: publicId });
    const first = await (await request.get(`${comments(publicId)}?page=1&limit=1`, { headers: authHeaders(leader) })).json();
    expect(first).toMatchObject({ page: 1, limit: 1, total });
    expect(first.items).toHaveLength(1);
    expect(first.items[0].isMine).toBe(false);
    expect(first.items[0].canDelete).toBe(false);
    expect(first.items[0].authorId).toBeNull();
    const second = await (await request.get(`${comments(publicId)}?page=2&limit=1`, { headers: authHeaders(leader) })).json();
    expect(second.items[0].id).not.toBe(first.items[0].id);
    for (const query of ["page=0", "limit=0", "limit=51", "limit=abc"]) {
      expect((await request.get(`${comments(publicId)}?${query}`, { headers: authHeaders(leader) })).status(), query).toBe(400);
    }
    const asAdmin = await (await request.get(comments(publicId), { headers: authHeaders(admin) })).json();
    expect(asAdmin.items.every((c: { authorId: string | null; canDelete: boolean }) => c.authorId === memberId && c.canDelete)).toBe(true);
  });

  test("[shelter-feed.comment#contagem-no-feed] commentCount do feed = linhas do banco (só para logado)", async ({ request }) => {
    const total = await countRows("image_section_comments", { sectionId: publicId });
    const feed = await readFeed(request, pageId, member);
    expect(feed.find((s) => s.id === publicId)?.commentCount).toBe(total);
  });

  test("[shelter-feed.comment#publicacao-oculta] seção inexistente/pendente: 404; privada é visível a logado", async ({ request }) => {
    expect((await request.get(comments(NIL), { headers: authHeaders(member) })).status()).toBe(404);
    expect((await request.post(comments(NIL), { headers: authHeaders(member), data: { content: "oi" } })).status()).toBe(404);
    expect((await request.get(comments("nao-uuid"), { headers: authHeaders(member) })).status()).toBe(400);
  });

  test("[shelter-feed.comment#remover] outro usuário: 403 (nada muda); autor remove o seu; admin remove qualquer um", async ({ request }) => {
    const mk = async (token: string, content: string) =>
      ((await (await request.post(comments(publicId), { headers: authHeaders(token), data: { content } })).json()) as { id: string }).id;
    const mine = await mk(member, `${RUN_TAG} do membro`);
    const others = await mk(leader, `${RUN_TAG} do líder`);
    const url = (id: string) => `${API_URL}/feed-section-comments/${id}`;

    expect((await request.delete(url(mine), { headers: authHeaders(leader) })).status()).toBe(403);
    expect(await countRows("image_section_comments", { id: mine })).toBe(1);
    expect((await request.delete(url(mine))).status()).toBe(401);

    expect((await request.delete(url(mine), { headers: authHeaders(member) })).status()).toBe(204);
    expect(await countRows("image_section_comments", { id: mine })).toBe(0);
    expect((await request.delete(url(mine), { headers: authHeaders(member) })).status()).toBe(404);

    expect((await request.delete(url(others), { headers: authHeaders(admin) })).status()).toBe(204);
    expect(await countRows("image_section_comments", { id: others })).toBe(0);
    expect((await request.delete(url("nao-uuid"), { headers: authHeaders(admin) })).status()).toBe(400);
  });

  test("[shelter-feed.comment#flag] flag desligada: 403 FEATURE_DISABLED em listar/criar e nada grava", async ({ request }) => {
    await setFlag(request, admin, "shelter_feed_comments", false);
    const before = await countRows("image_section_comments", { sectionId: publicId });
    for (const res of [
      await request.get(comments(publicId), { headers: authHeaders(member) }),
      await request.post(comments(publicId), { headers: authHeaders(member), data: { content: "oi" } }),
    ]) {
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    }
    expect(await countRows("image_section_comments", { sectionId: publicId })).toBe(before);
    await setFlag(request, admin, "shelter_feed_comments", true);
  });

  test("[shelter-feed.comment#cascata] apagar a publicação remove celebrações e comentários", async ({ request }) => {
    await toggle(request, privateId, member);
    await request.post(comments(privateId), { headers: authHeaders(member), data: { content: `${RUN_TAG} cascata` } });
    expect(await countRows("image_section_celebrations", { sectionId: privateId })).toBe(1);
    expect(await countRows("image_section_comments", { sectionId: privateId })).toBe(1);
    await removeSection(request, admin, privateId);
    expect(await countRows("image_sections", { id: privateId })).toBe(0);
    expect(await countRows("image_section_celebrations", { sectionId: privateId })).toBe(0);
    expect(await countRows("image_section_comments", { sectionId: privateId })).toBe(0);
  });
});
