import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createGallery, readFeed, removeGallery, setFlag } from "./feed-fixtures";
import { makePng } from "./png";
import { approveAllPending, commentBody } from "./comments-moderation-helpers";

/**
 * Fluxo completo do feed v2, só pela API e com ARQUIVOS REAIS:
 *   membro envia fotos e vídeo → fica pendente (ninguém vê) → admin aprova → aparece no feed →
 *   qualquer usuário logado comenta e celebra → autor/admin moderam → admin retira do ar.
 * A galeria é própria do cenário e some no `afterAll` (0 linhas conferidas).
 */
const VIDEO = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "assets", "visita.mp4"));
const FLAGS = ["shelter_feed", "shelter_feed_celebrations", "shelter_feed_comments"] as const;
const BASE = API_URL;

type Item = Record<string, unknown>;
type Tokens = { admin: string; leader: string; member: string };

let tokens: Tokens;
let pageId = "";
let sectionId = "";
let memberId = "";
const flagsBefore: Record<string, number> = {};

async function submit(request: APIRequestContext, token: string): Promise<{ id: string; media: Item[] }> {
  const mediaItems = [
    { title: "foto-1", description: "primeira foto", uploadType: "upload", mediaType: "image", isLocalFile: true, fieldKey: "img0", originalName: "um.png" },
    { title: "foto-2", description: "segunda foto", uploadType: "upload", mediaType: "image", isLocalFile: true, fieldKey: "img1", originalName: "dois.png" },
    { title: "video-1", description: "vídeo da visita", uploadType: "upload", mediaType: "video", isLocalFile: true, fieldKey: "vid0", originalName: "visita.mp4" },
  ];
  const response = await request.post(`${BASE}/image-sections`, {
    headers: authHeaders(token),
    multipart: {
      sectionData: JSON.stringify({ caption: "Visita ao abrigo — fluxo e2e", description: "enviado pelo membro", public: false, mediaItems }),
      img0: { name: "um.png", mimeType: "image/png", buffer: makePng(640, 480, 1) },
      img1: { name: "dois.png", mimeType: "image/png", buffer: makePng(640, 480, 2) },
      vid0: { name: "visita.mp4", mimeType: "video/mp4", buffer: VIDEO },
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const body = (await response.json()) as { id: string; mediaItems: Item[] };
  return { id: body.id, media: body.mediaItems };
}

const feedIds = async (request: APIRequestContext, token?: string) => (await readFeed(request, pageId, token)).map((section) => section.id);

test.describe.serial("Feed v2 — fluxo completo (enviar, aprovar, comentar, celebrar, moderar)", () => {
  let submittedMedia: Item[] = [];

  test.beforeAll(async ({ request }) => {
    tokens = {
      admin: (await loginAs(request, "admin")).accessToken,
      leader: (await loginAs(request, "leader")).accessToken,
      member: (await loginAs(request, "member")).accessToken,
    };
    for (const key of FLAGS) {
      flagsBefore[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
      await setFlag(request, tokens.admin, key, true);
    }
    pageId = (await createGallery(request, tokens.admin, `e2e fluxo ${Date.now()}`, "seção legada")).pageId;
    const me = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", ["e2e.member@orfanatonib.test"]);
    memberId = me!.id;
  });

  test.afterAll(async ({ request }) => {
    await removeGallery(request, tokens.admin, pageId);
    for (const key of FLAGS) await setFlag(request, tokens.admin, key, flagsBefore[key] === 1);
    expect(await countRows("image_pages", { id: pageId })).toBe(0);
    await closeDb();
  });

  test("1. o membro envia 2 fotos e 1 vídeo: tudo gravado, post pendente e com autor", async ({ request }) => {
    const submitted = await submit(request, tokens.member);
    sectionId = submitted.id;
    submittedMedia = submitted.media;
    expect(submittedMedia.map((item) => item.mediaType).sort()).toEqual(["image", "image", "video"]);
    const row = await queryOne<{ authorId: string; public: number; pageId: string | null }>("SELECT authorId, public, pageId FROM image_sections WHERE id = ?", [sectionId]);
    expect(row).toMatchObject({ authorId: memberId, public: 0, pageId: null });
    expect(await countRows("media_items", { targetId: sectionId, targetType: "ImagesPage" })).toBe(3);
  });

  test("2. pendente: nem o visitante nem o líder nem o próprio membro veem no feed da galeria", async ({ request }) => {
    for (const token of [undefined, tokens.leader, tokens.member]) expect(await feedIds(request, token)).not.toContain(sectionId);
  });

  test("3. só o admin aprova: membro e líder não conseguem (403) e nada muda", async ({ request }) => {
    for (const token of [tokens.member, tokens.leader]) {
      const res = await request.patch(`${BASE}/image-sections/${sectionId}`, {
        headers: authHeaders(token),
        multipart: { sectionData: JSON.stringify({ caption: "x", description: "x", public: true, pageId, mediaItems: submittedMedia }) },
      });
      expect([401, 403]).toContain(res.status());
    }
    expect(await queryOne("SELECT public, pageId FROM image_sections WHERE id = ?", [sectionId])).toMatchObject({ public: 0, pageId: null });
  });

  test("4. o admin aprova: aparece no feed (visitante e todos), com as 3 mídias e o autor", async ({ request }) => {
    const res = await request.patch(`${BASE}/image-sections/${sectionId}`, {
      headers: authHeaders(tokens.admin),
      multipart: { sectionData: JSON.stringify({ caption: "Visita ao abrigo — fluxo e2e", description: "enviado pelo membro", public: true, pageId, mediaItems: submittedMedia }) },
    });
    expect(res.status(), await res.text()).toBe(200);
    for (const token of [undefined, tokens.leader, tokens.member, tokens.admin]) expect(await feedIds(request, token)).toContain(sectionId);
    // Autor: só para quem tem sessão ("Fulano E." — primeiro nome e inicial); visitante não vê.
    const asLeader = (await readFeed(request, pageId, tokens.leader)).find((section) => section.id === sectionId)!;
    expect(asLeader.author?.displayName).toMatch(/\w\.$/);
    expect((await readFeed(request, pageId)).find((section) => section.id === sectionId)!.author).toBeNull();
    expect(await countRows("media_items", { targetId: sectionId, mediaType: "video" })).toBe(1);
  });

  test("5. celebrar: qualquer perfil logado celebra uma vez; repetir desfaz; visitante só vê a contagem", async ({ request }) => {
    const toggle = (token?: string) => request.post(`${BASE}/feed-sections/${sectionId}/celebration/toggle`, { headers: token ? authHeaders(token) : {} });
    expect((await toggle()).status()).toBe(401);
    for (const token of [tokens.admin, tokens.leader, tokens.member]) expect((await toggle(token)).ok()).toBe(true);
    expect(await countRows("image_section_celebrations", { sectionId })).toBe(3);
    const asLeader = (await readFeed(request, pageId, tokens.leader)).find((section) => section.id === sectionId)!;
    expect(asLeader).toMatchObject({ celebrationCount: 3, celebratedByMe: true });
    const asVisitor = (await readFeed(request, pageId)).find((section) => section.id === sectionId)!;
    expect(asVisitor).toMatchObject({ celebrationCount: 3, celebratedByMe: false });
    expect((await toggle(tokens.leader)).ok()).toBe(true); // descelebra
    expect(await countRows("image_section_celebrations", { sectionId })).toBe(2);
  });

  test("6. comentar: qualquer usuário logado comenta; visitante 401; telefone/e-mail/link recusados (400)", async ({ request }) => {
    const post = (content: string, token?: string) => request.post(`${BASE}/feed-sections/${sectionId}/comments`, { headers: token ? authHeaders(token) : {}, data: commentBody(content) });
    expect((await post("sem login")).status()).toBe(401);
    for (const [content, token] of [
      ["Que lindo, parabéns!", tokens.admin],
      ["Deus abençoe a equipe.", tokens.leader],
      ["Fui eu que enviei 😊", tokens.member],
    ] as const) {
      expect((await post(content, token)).status()).toBe(201);
    }
    for (const bad of ["me liga 11 99999-1234", "fale em teste@exemplo.com", "veja https://exemplo.com/foto"]) expect((await post(bad, tokens.member)).status()).toBe(400);
    expect(await countRows("image_section_comments", { sectionId })).toBe(3);
    // Nascem pendentes: só depois da aprovação do admin aparecem para todos e contam no feed.
    expect((await readFeed(request, pageId, tokens.leader)).find((section) => section.id === sectionId)!.commentCount).toBe(0);
    expect(await approveAllPending(request, tokens.admin, sectionId)).toBe(3);
    const list = await request.get(`${BASE}/feed-sections/${sectionId}/comments`, { headers: authHeaders(tokens.leader) });
    expect(list.status()).toBe(200);
    const feed = (await readFeed(request, pageId, tokens.leader)).find((section) => section.id === sectionId)!;
    expect(feed.commentCount).toBe(3);
  });

  test("7. moderar comentário: o autor remove o seu, o admin remove qualquer um, outro usuário não remove", async ({ request }) => {
    const list = (await (await request.get(`${BASE}/feed-sections/${sectionId}/comments`, { headers: authHeaders(tokens.admin) })).json()) as {
      items?: Array<{ id: string; content: string }>;
      data?: Array<{ id: string; content: string }>;
    };
    const comments = list.items ?? list.data ?? [];
    const byText = (text: string) => comments.find((comment) => comment.content.includes(text))!.id;
    const del = (id: string, token: string) => request.delete(`${BASE}/feed-section-comments/${id}`, { headers: authHeaders(token) });
    const leaderComment = byText("equipe");
    expect([401, 403, 404]).toContain((await del(leaderComment, tokens.member)).status()); // outro usuário
    expect(await countRows("image_section_comments", { sectionId })).toBe(3);
    expect([200, 204]).toContain((await del(byText("Fui eu"), tokens.member)).status()); // autor
    expect([200, 204]).toContain((await del(leaderComment, tokens.admin)).status()); // admin
    expect(await countRows("image_section_comments", { sectionId })).toBe(1);
  });

  test("8. o admin despublica: some para o visitante; as celebrações e os comentários ficam preservados no banco", async ({ request }) => {
    const res = await request.patch(`${BASE}/image-sections/${sectionId}`, {
      headers: authHeaders(tokens.admin),
      multipart: { sectionData: JSON.stringify({ caption: "Visita ao abrigo — fluxo e2e", description: "enviado pelo membro", public: false, pageId, mediaItems: submittedMedia }) },
    });
    expect(res.ok()).toBe(true);
    // Despublicado: o visitante deixa de ver (só vê seção pública). Quem tem sessão continua vendo as seções da galeria
    // (regra existente do feed: logado vê todas) — por isso a moderação para valer é a EXCLUSÃO (teste 9).
    expect(await feedIds(request)).not.toContain(sectionId);
    expect(await feedIds(request, tokens.leader)).toContain(sectionId);
    expect(await countRows("image_section_celebrations", { sectionId })).toBe(2);
    expect(await countRows("image_section_comments", { sectionId })).toBe(1);
  });

  test("9. excluir o post leva junto mídias, celebrações e comentários (sem órfãos)", async ({ request }) => {
    const res = await request.delete(`${BASE}/image-sections/${sectionId}`, { headers: authHeaders(tokens.admin) });
    expect([200, 204]).toContain(res.status());
    expect(await countRows("image_sections", { id: sectionId })).toBe(0);
    expect(await countRows("image_section_celebrations", { sectionId })).toBe(0);
    expect(await countRows("image_section_comments", { sectionId })).toBe(0);
    expect(await countRows("media_items", { targetId: sectionId })).toBe(0);
  });
});
