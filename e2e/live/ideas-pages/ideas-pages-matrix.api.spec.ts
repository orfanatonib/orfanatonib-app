import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import {
  BAD_ID,
  createPage,
  createPageRaw,
  deletePageApi,
  mediaRows,
  pageRow,
  pagesWithTag,
  routeRows,
  sectionRows,
  snapshotDb,
  updatePage,
  updatePageRaw,
  type IdeasPageBody,
} from "./support";

/**
 * Matriz do plano 31 (casos de fluxo da API): feliz, validação, não encontrado, duplicidade e
 * leituras — API real + SELECT; negativos provam que o banco não mudou.
 */
test.describe.serial("Páginas de ideias — matriz da API", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];
  let flagBefore = 1;

  const make = async (
    request: import("@playwright/test").APIRequestContext,
    label: string,
    mediaUrl?: string,
  ): Promise<IdeasPageBody> => {
    const page = await createPage(request, admin, {
      title: tagged(label),
      sections: [{ title: "S1", medias: mediaUrl ? [{ title: "L", url: mediaUrl }] : [] }],
    });
    created.push(page.id);
    return page;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    flagBefore =
      (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'ideas_sharing'"))?.enabled ?? 1;
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`${API_URL}/feature-flags/ideas_sharing`, {
      headers: authHeaders(admin),
      data: { enabled: flagBefore === 1 },
    });
    for (const id of created) await deletePageApi(request, admin, id);
    expect(await pagesWithTag(RUN_TAG)).toBe(0);
    await closeDb();
  });

  test("POST: cria página com seção, mídia em link e rota (tudo no banco)", async ({ request }) => {
    const page = await make(request, "post-feliz", "https://www.youtube.com/watch?v=abc");
    expect(await pageRow(page.id)).toMatchObject({ title: tagged("post-feliz") });
    expect(await sectionRows(page.id)).toHaveLength(1);
    expect(await mediaRows(page.id)).toHaveLength(1);
    expect(await routeRows(page.id)).toHaveLength(1);
  });

  test("[ideas-page.post.ideas-pages#validacao] payload inválido: 400 e nenhuma linha gravada", async ({ request }) => {
    const before = await snapshotDb();
    const noData = await request.post(`${API_URL}/ideas-pages`, { headers: authHeaders(admin), multipart: {} });
    expect(noData.status()).toBe(400);
    const wrongType = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(admin),
      multipart: { ideasMaterialsPageData: JSON.stringify({ title: 123, description: "d", sections: "x" }) },
    });
    expect(wrongType.status()).toBe(400);
    const brokenJson = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(admin),
      multipart: { ideasMaterialsPageData: "{não é json" },
    });
    expect(brokenJson.status()).toBeGreaterThanOrEqual(400);
    // Página de ideias é sempre privada: `public: true` é rejeitado explicitamente (400) e nada é gravado.
    const publicTrue = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(admin),
      multipart: {
        ideasMaterialsPageData: JSON.stringify({ title: tagged("pub"), description: "d", public: true, sections: [] }),
      },
    });
    expect(publicTrue.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[ideas-page.post.ideas-pages#conflito-ou-duplicidade] mesmo título duas vezes: duas páginas, rotas com caminhos distintos (sem 500)", async ({
    request,
  }) => {
    const first = await createPage(request, admin, { title: tagged("dup"), sections: [{ title: "S" }] });
    const second = await createPage(request, admin, { title: tagged("dup"), sections: [{ title: "S" }] });
    created.push(first.id, second.id);
    const [a] = await routeRows(first.id);
    const [b] = await routeRows(second.id);
    expect(a.path).not.toBe(b.path);
    expect(await countRows("ideas_pages", { title: tagged("dup") })).toBe(2);
  });

  test("PATCH: atualiza título, seção e mídia (reflete no banco)", async ({ request }) => {
    const page = await make(request, "patch-feliz");
    const updated = await updatePage(request, admin, page.id, {
      title: tagged("patch-feliz-novo"),
      sections: [{ id: page.sections[0].id, title: "S1 nova", medias: [{ title: "L", url: "https://www.youtube.com/watch?v=xyz" }] }],
    });
    expect(updated.title).toBe(tagged("patch-feliz-novo"));
    expect((await pageRow(page.id))?.title).toBe(tagged("patch-feliz-novo"));
    expect((await sectionRows(page.id)).map((s) => s.title)).toEqual(["S1 nova"]);
    expect(await mediaRows(page.id)).toHaveLength(1);
  });

  test("[ideas-page.patch.ideas-pages-id#validacao] payload inválido: 400 e a página não muda", async ({ request }) => {
    const page = await make(request, "patch-validacao");
    const before = await snapshotDb();
    const res = await request.patch(`${API_URL}/ideas-pages/${page.id}`, {
      headers: authHeaders(admin),
      multipart: { ideasMaterialsPageData: JSON.stringify({ id: page.id, title: tagged("x"), sections: "x" }) },
    });
    expect(res.status()).toBe(400);
    const publicTrue = await request.patch(`${API_URL}/ideas-pages/${page.id}`, {
      headers: authHeaders(admin),
      multipart: {
        ideasMaterialsPageData: JSON.stringify({ id: page.id, title: tagged("x"), description: "d", public: true, sections: [] }),
      },
    });
    expect(publicTrue.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    expect((await pageRow(page.id))?.title).toBe(tagged("patch-validacao"));
    expect((await pageRow(page.id))?.public).toBe(0);
  });

  test("[ideas-page.patch.ideas-pages-id#nao-encontrado] id inexistente: 404 e banco inalterado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await updatePageRaw(request, admin, BAD_ID, { title: tagged("x"), sections: [{ title: "S" }] });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[ideas-page.patch.ideas-pages-id#conflito-ou-duplicidade] renomear para o título de outra página: 200 e caminhos de rota continuam distintos", async ({
    request,
  }) => {
    const one = await make(request, "conf-a");
    const two = await make(request, "conf-b");
    await updatePage(request, admin, two.id, {
      title: tagged("conf-a"),
      sections: [{ id: two.sections[0].id, title: "S1" }],
    });
    const [a] = await routeRows(one.id);
    const [b] = await routeRows(two.id);
    expect(a.path).not.toBe(b.path);
    expect(await countRows("ideas_pages", { title: tagged("conf-a") })).toBe(2);
  });

  test("DELETE: apaga página, seções, mídia e rota", async ({ request }) => {
    const page = await make(request, "delete-feliz", "https://www.youtube.com/watch?v=abc");
    const res = await request.delete(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await pageRow(page.id)).toBeNull();
    expect(await sectionRows(page.id)).toHaveLength(0);
    expect(await mediaRows(page.id)).toHaveLength(0);
    expect(await routeRows(page.id)).toHaveLength(0);
  });

  test("[ideas-page.delete.ideas-pages-id#nao-encontrado] id inexistente: 404 e banco inalterado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/ideas-pages/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[ideas-page.get.ideas-pages#feliz] a listagem devolve a página criada, igual ao banco", async ({ request }) => {
    const page = await make(request, "get-lista", "https://www.youtube.com/watch?v=abc");
    const res = await request.get(`${API_URL}/ideas-pages`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as IdeasPageBody[];
    const found = body.find((p) => p.id === page.id);
    expect(found?.title).toBe(tagged("get-lista"));
    expect(found?.sections).toHaveLength((await sectionRows(page.id)).length);
    expect(found?.sections[0].medias).toHaveLength((await mediaRows(page.id)).length);
  });

  test("[ideas-page.get.ideas-pages#escopo-proprio-x-outro] a página nasce privada (página e rota public=0): visitante 401; membro com sessão vê", async ({ request }) => {
    const page = await make(request, "get-escopo");
    expect((await pageRow(page.id))?.public).toBe(0);
    expect((await routeRows(page.id))[0].public).toBe(0);
    expect((await request.get(`${API_URL}/ideas-pages`)).status()).toBe(401);
    const asMember = (await (await request.get(`${API_URL}/ideas-pages`, { headers: authHeaders(member) })).json()) as IdeasPageBody[];
    expect(asMember.some((p) => p.id === page.id)).toBe(true);
  });

  test("[ideas-page.get.ideas-pages#flag-desligada] `ideas_sharing` desligada: 403 FEATURE_DISABLED para quem tem sessão e 401 para o visitante", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/ideas_sharing`, { headers: authHeaders(admin), data: { enabled: false } });
    try {
      const asMember = await request.get(`${API_URL}/ideas-pages`, { headers: authHeaders(member) });
      expect(asMember.status()).toBe(403);
      expect(JSON.stringify(await asMember.json())).toContain("FEATURE_DISABLED");
      expect((await request.get(`${API_URL}/ideas-pages`)).status()).toBe(401);
    } finally {
      await request.patch(`${API_URL}/feature-flags/ideas_sharing`, { headers: authHeaders(admin), data: { enabled: flagBefore === 1 } });
    }
  });

  test("[ideas-page.get.ideas-pages-id#feliz] busca por id devolve a página com seções e mídia do banco", async ({ request }) => {
    const page = await make(request, "get-id", "https://www.youtube.com/watch?v=abc");
    const res = await request.get(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as IdeasPageBody;
    expect(body.id).toBe(page.id);
    expect(body.sections[0].medias).toHaveLength(1);
    expect(body.route.path).toBe((await routeRows(page.id))[0].path);
  });

  test("[ideas-page.get.ideas-pages-id#nao-encontrado] id inexistente: 404", async ({ request }) => {
    const res = await request.get(`${API_URL}/ideas-pages/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
  });

  test("[ideas-page.get.ideas-pages-id#escopo-proprio-x-outro] página privada: 401 para visitante, 200 com sessão", async ({ request }) => {
    const page = await make(request, "get-id-escopo");
    expect((await request.get(`${API_URL}/ideas-pages/${page.id}`)).status()).toBe(401);
    expect((await request.get(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(member) })).status()).toBe(200);
  });

  test("[ideas-page.get.ideas-pages-id#flag-desligada] `ideas_sharing` desligada: 403 FEATURE_DISABLED com sessão e 401 sem sessão", async ({ request }) => {
    const page = await make(request, "get-id-flag");
    await request.patch(`${API_URL}/feature-flags/ideas_sharing`, { headers: authHeaders(admin), data: { enabled: false } });
    try {
      const res = await request.get(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(member) });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      expect((await request.get(`${API_URL}/ideas-pages/${page.id}`)).status()).toBe(401);
    } finally {
      await request.patch(`${API_URL}/feature-flags/ideas_sharing`, { headers: authHeaders(admin), data: { enabled: flagBefore === 1 } });
    }
  });

  test("[ideas-page.post.ideas-pages#falha-do-colaborador-sem-efeito-parcial] seção com título acima do limite: erro e nenhuma linha (página, seção, mídia, rota)", async ({
    request,
  }) => {
    const before = await snapshotDb();
    const res = await createPageRaw(request, admin, {
      title: tagged("falha"),
      sections: [{ title: "x".repeat(300), medias: [{ title: "L", url: "https://www.youtube.com/watch?v=abc" }] }],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[ideas-page.patch.ideas-pages-id#falha-do-colaborador-sem-efeito-parcial] update que falha no banco não deixa efeito parcial", async ({
    request,
  }) => {
    const page = await make(request, "patch-falha", "https://www.youtube.com/watch?v=abc");
    const rowsBefore = await mediaRows(page.id);
    const before = await snapshotDb();
    const res = await updatePageRaw(request, admin, page.id, {
      title: tagged("patch-falha-novo"),
      sections: [{ id: page.sections[0].id, title: "x".repeat(300) }],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await snapshotDb()).toEqual(before);
    expect(await mediaRows(page.id)).toEqual(rowsBefore);
    expect((await pageRow(page.id))?.title).toBe(tagged("patch-falha"));
  });

  test("DELETE recusado (membro): 403 e a página segue inteira", async ({
    request,
  }) => {
    const page = await make(request, "delete-protegido", "https://www.youtube.com/watch?v=abc");
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(member) });
    expect(res.status()).toBe(403);
    expect(await snapshotDb()).toEqual(before);
  });
});
