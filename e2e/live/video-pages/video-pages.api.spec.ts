import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import {
  BAD_ID,
  createPage,
  createPageRaw,
  deletePageApi,
  INTERNAL_MEDIA_FIELDS,
  mediaRows,
  pageRow,
  pagesWithTag,
  routeRows,
  snapshotDb,
  updatePage,
  updatePageRaw,
  type VideoPageBody,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Contrato ao vivo de `/video-pages` (plano 34): front-less, mas sempre contra API e MySQL reais.
 * Cada cenário cria os próprios dados pela API (prefixo RUN_TAG) e o `afterAll` confere 0 linhas.
 */
test.describe.serial("Video Pages — API ao vivo", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];

  const make = async (
    request: import("@playwright/test").APIRequestContext,
    label: string,
    isPublic = true,
    videoCount = 1,
  ): Promise<VideoPageBody> => {
    const page = await createPage(request, admin, {
      title: tagged(label),
      isPublic,
      videos: Array.from({ length: videoCount }, (_, i) => ({ title: `Vídeo ${i + 1}` })),
    });
    created.push(page.id);
    return page;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin, id);
    if (CLEANUP_ENABLED) expect(await pagesWithTag(RUN_TAG), "a limpeza deixou páginas do E2E").toBe(0);
    await closeDb();
  });

  test("[video-page.post.video-pages#feliz] [video-page.post.video-pages#perfil-admin] admin cria a galeria: linha, rota e mídia no banco", async ({
    request,
  }) => {
    const page = await make(request, "feliz", true, 2);
    expect(page.title).toBe(tagged("feliz"));
    expect(page.videos).toHaveLength(2);
    for (const video of page.videos) for (const field of INTERNAL_MEDIA_FIELDS) expect(video).not.toHaveProperty(field);

    expect(await pageRow(page.id)).toMatchObject({ name: tagged("feliz"), public: 1 });
    expect(await routeRows(page.id)).toHaveLength(1);
    const rows = await mediaRows(page.id);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.isLocalFile === 0)).toBe(true);
  });

  test("[video-page.get.video-pages#feliz] [video-page.get.video-pages-id#feliz] listagem e leitura por id batem com o banco", async ({
    request,
  }) => {
    const page = await make(request, "leitura", true, 2);

    const list = await request.get(`${API_URL}/video-pages`);
    expect(list.status()).toBe(200);
    const items = (await list.json()) as VideoPageBody[];
    const found = items.find((p) => p.id === page.id);
    expect(found?.videos).toHaveLength(2);
    for (const video of found?.videos ?? []) for (const field of INTERNAL_MEDIA_FIELDS) expect(video).not.toHaveProperty(field);

    const one = await request.get(`${API_URL}/video-pages/${page.id}`);
    expect(one.status()).toBe(200);
    const body = (await one.json()) as VideoPageBody;
    expect(body.title).toBe((await pageRow(page.id))?.name);
    for (const video of body.videos) for (const field of INTERNAL_MEDIA_FIELDS) expect(video).not.toHaveProperty(field);
    expect(body.videos.map((v) => v.id).sort()).toEqual((await mediaRows(page.id)).map((r) => r.id).sort());
  });

  test("[video-page.get.video-pages#escopo-proprio-x-outro] visitante só vê páginas públicas; com sessão vê todas", async ({
    request,
  }) => {
    const pub = await make(request, "escopo-pub", true);
    const priv = await make(request, "escopo-priv", false);

    const anon = (await (await request.get(`${API_URL}/video-pages`)).json()) as VideoPageBody[];
    expect(anon.some((p) => p.id === pub.id)).toBe(true);
    expect(anon.some((p) => p.id === priv.id)).toBe(false);

    const logged = (await (
      await request.get(`${API_URL}/video-pages`, { headers: authHeaders(member) })
    ).json()) as VideoPageBody[];
    expect(logged.some((p) => p.id === priv.id)).toBe(true);
    expect((await pageRow(priv.id))?.public).toBe(0);
  });

  test("[video-page.get.video-pages-id#escopo-proprio-x-outro] página não pública: 404 para visitante, 200 com sessão", async ({
    request,
  }) => {
    const priv = await make(request, "escopo-id", false);
    expect((await request.get(`${API_URL}/video-pages/${priv.id}`)).status()).toBe(404);
    expect((await request.get(`${API_URL}/video-pages/${priv.id}`, { headers: authHeaders(member) })).status()).toBe(200);
  });

  test("[video-page.get.video-pages-id#nao-encontrado] id inexistente: 404 e nada criado", async ({ request }) => {
    const before = await snapshotDb();
    expect((await request.get(`${API_URL}/video-pages/${BAD_ID}`, { headers: authHeaders(admin) })).status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[video-page.get.video-pages-id#flag-desligada] com as flags de vídeo desligadas: 403 FEATURE_DISABLED e banco inalterado", async ({
    request,
  }) => {
    const page = await make(request, "flag-get-id");
    const keys = ["public_videos", "training_videos", "page_management"];
    const initial: Record<string, boolean> = {};
    for (const key of keys) {
      initial[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
    }
    try {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      }
      const before = await snapshotDb();
      const res = await request.get(`${API_URL}/video-pages/${page.id}`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      expect(await snapshotDb()).toEqual(before);
    } finally {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: initial[key] } });
      }
    }
  });

  test("[video-page.post.video-pages#validacao] payload inválido: 400 e nenhuma linha gravada", async ({ request }) => {
    const before = await snapshotDb();
    const invalid = await request.post(`${API_URL}/video-pages`, {
      headers: authHeaders(admin),
      multipart: { videosPageData: JSON.stringify({ title: 123, description: "d", public: "sim", videos: "x" }) },
    });
    expect(invalid.status()).toBe(400);
    const unknownField = await request.post(`${API_URL}/video-pages`, {
      headers: authHeaders(admin),
      multipart: {
        videosPageData: JSON.stringify({ title: tagged("x"), description: "d", public: true, videos: [], admin: true }),
      },
    });
    expect(unknownField.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    // Nenhum dos pedidos recusados deixou registro (conferido pelo título exato de cada um).
    for (const title of [tagged("x")]) expect(await pagesWithTag(title), title).toBe(0);
  });

  test("[video-page.post.video-pages#conflito-ou-duplicidade] mesmo título duas vezes: duas páginas com rotas distintas", async ({
    request,
  }) => {
    const first = await make(request, "duplicado");
    const second = await make(request, "duplicado");
    expect(second.id).not.toBe(first.id);
    const [r1] = await routeRows(first.id);
    const [r2] = await routeRows(second.id);
    expect(r1.path).not.toBe(r2.path);
    expect(await countRows("videos_pages", { name: tagged("duplicado") })).toBe(2);
  });

  test("[video-page.patch.video-pages-id#feliz] [video-page.patch.video-pages-id#perfil-admin] admin atualiza título e vídeos: banco reflete", async ({
    request,
  }) => {
    const page = await make(request, "patch", true, 2);
    const [keep] = page.videos;
    const updated = await updatePage(request, admin, page.id, {
      title: tagged("patch-novo"),
      description: "outra descrição",
      isPublic: false,
      videos: [
        { id: keep.id, title: "Mantido", url: keep.url },
        { title: "Novo vídeo", url: "https://youtu.be/abc123" },
      ],
    });
    expect(updated.title).toBe(tagged("patch-novo"));
    expect(await pageRow(page.id)).toMatchObject({
      name: tagged("patch-novo"),
      description: "outra descrição",
      public: 0,
    });
    const rows = await mediaRows(page.id);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.id)).toContain(keep.id);
  });

  test("[video-page.patch.video-pages-id#validacao] payload inválido: 400 e a página continua como estava", async ({
    request,
  }) => {
    const page = await make(request, "patch-validacao");
    const before = { page: await pageRow(page.id), media: await mediaRows(page.id), db: await snapshotDb() };
    const res = await request.patch(`${API_URL}/video-pages/${page.id}`, {
      headers: authHeaders(admin),
      multipart: { videosPageData: JSON.stringify({ id: page.id, title: 5, description: "d", public: true, videos: [] }) },
    });
    expect(res.status()).toBe(400);
    expect(await pageRow(page.id)).toEqual(before.page);
    expect(await mediaRows(page.id)).toEqual(before.media);
    expect(await snapshotDb()).toEqual(before.db);
  });

  test("[video-page.patch.video-pages-id#nao-encontrado] id inexistente: 404 e banco inalterado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await updatePageRaw(request, admin, BAD_ID, { title: tagged("fantasma"), videos: [] });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[video-page.patch.video-pages-id#conflito-ou-duplicidade] renomear para o título de outra página: as duas seguem com rotas distintas", async ({
    request,
  }) => {
    const a = await make(request, "conflito-a");
    const b = await make(request, "conflito-b");
    await updatePage(request, admin, b.id, { title: tagged("conflito-a"), videos: [{ title: "v" }] });
    const [ra] = await routeRows(a.id);
    const [rb] = await routeRows(b.id);
    expect(ra.path).not.toBe(rb.path);
    expect(await countRows("videos_pages", { name: tagged("conflito-a") })).toBe(2);
  });

  test("[video-page.patch.video-pages-id#validacao] mídia de outra página não pode ser reivindicada: 404 e nada muda", async ({
    request,
  }) => {
    const a = await make(request, "alheia-a");
    const b = await make(request, "alheia-b");
    const before = await mediaRows(a.id);
    const res = await updatePageRaw(request, admin, b.id, {
      title: tagged("alheia-b"),
      videos: [{ id: a.videos[0].id, title: "roubada", url: a.videos[0].url }],
    });
    expect(res.status()).toBe(404);
    expect(await mediaRows(a.id)).toEqual(before);
  });

  test("[video-page.delete.video-pages-id#feliz] [video-page.delete.video-pages-id#perfil-admin] admin remove: página, rota e mídia somem", async ({
    request,
  }) => {
    const page = await make(request, "delete", true, 2);
    const res = await request.delete(`${API_URL}/video-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await pageRow(page.id)).toBeNull();
    expect(await routeRows(page.id)).toHaveLength(0);
    expect(await mediaRows(page.id)).toHaveLength(0);
  });

  test("[video-page.delete.video-pages-id#nao-encontrado] id inexistente: 404 e banco inalterado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/video-pages/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("escrita recusada (visitante e membro) não altera o banco", async ({ request }) => {
    const page = await make(request, "recusa");
    const before = await snapshotDb();
    const anon = await createPageRaw(request, "", { title: tagged("anon"), videos: [] });
    expect([401, 403]).toContain(anon.status());
    const asMember = await createPageRaw(request, member, { title: tagged("member"), videos: [] });
    expect(asMember.status()).toBe(403);
    const patchMember = await updatePageRaw(request, member, page.id, { title: tagged("member"), videos: [] });
    expect(patchMember.status()).toBe(403);
    expect(await snapshotDb()).toEqual(before);
    expect((await pageRow(page.id))?.name).toBe(tagged("recusa"));
  });
});
