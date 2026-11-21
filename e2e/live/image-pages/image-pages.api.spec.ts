import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import {
  BAD_ID,
  OVERSIZED_CAPTION,
  createPage,
  deletePageApi,
  inputFromBody,
  mediaRows,
  pageRow,
  pagesWithTag,
  png,
  routeRows,
  sectionRows,
  sectionsWithTag,
  snapshotDb,
  updatePage,
  updatePageRaw,
  type ImagePageBody,
} from "./support";

/**
 * Contrato ao vivo de `/image-pages` (plano 33): sempre contra API, MySQL e bucket reais.
 * Cada cenário cria os próprios dados pela API (prefixo RUN_TAG) e o `afterAll` confere 0 linhas.
 */
const FLAG_KEYS = ["page_management", "public_galleries", "shelter_feed"] as const;

test.describe.serial("Image Pages — API ao vivo", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];

  const make = async (
    request: import("@playwright/test").APIRequestContext,
    label: string,
    options: { isPublic?: boolean; sections?: number; uploads?: boolean } = {},
  ): Promise<ImagePageBody> => {
    const count = options.sections ?? 1;
    const page = await createPage(request, admin, {
      title: tagged(label),
      isPublic: options.isPublic ?? true,
      sections: Array.from({ length: count }, (_, i) => ({
        caption: tagged(`${label}-sec${i + 1}`),
        media: [options.uploads ? { file: png(`${label}-${i}.png`) } : { title: `Foto ${i + 1}` }],
      })),
    });
    created.push(page.id);
    return page;
  };

  const withFlagsOff = async (
    request: import("@playwright/test").APIRequestContext,
    work: () => Promise<void>,
  ): Promise<void> => {
    const initial: Record<string, boolean> = {};
    for (const key of FLAG_KEYS) {
      initial[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
    }
    try {
      for (const key of FLAG_KEYS) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      }
      await work();
    } finally {
      for (const key of FLAG_KEYS) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: initial[key] } });
      }
    }
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin, id);
    expect(await pagesWithTag(RUN_TAG), "a limpeza deixou galerias do E2E").toBe(0);
    expect(await sectionsWithTag(RUN_TAG), "a limpeza deixou seções do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  test("[image-page.post.image-pages#feliz] admin cria a galeria: página, seções, rota e mídia no banco", async ({ request }) => {
    const page = await make(request, "api-feliz", { sections: 2 });
    expect(page.title).toBe(tagged("api-feliz"));
    expect(page.sections).toHaveLength(2);
    expect(await pageRow(page.id)).toMatchObject({ name: tagged("api-feliz"), public: 1 });
    expect(await routeRows(page.id)).toHaveLength(1);
    const sections = await sectionRows(page.id);
    expect(sections).toHaveLength(2);
    expect(sections.every((s) => s.reviewStatus === "approved")).toBe(true);
    expect(await mediaRows(page.id)).toHaveLength(2);
  });

  test("[image-page.get.image-pages#feliz] [image-page.get.image-pages-id#feliz] listagem e leitura por id batem com o banco", async ({
    request,
  }) => {
    const page = await make(request, "api-leitura", { sections: 2 });
    const list = await request.get(`${API_URL}/image-pages`);
    expect(list.status()).toBe(200);
    const found = ((await list.json()) as ImagePageBody[]).find((p) => p.id === page.id);
    expect(found?.sections).toHaveLength(2);

    const one = await request.get(`${API_URL}/image-pages/${page.id}`);
    expect(one.status()).toBe(200);
    const body = (await one.json()) as ImagePageBody;
    expect(body.title).toBe((await pageRow(page.id))?.name);
    expect(body.sections.flatMap((s) => s.mediaItems.map((m) => m.id)).sort()).toEqual(
      (await mediaRows(page.id)).map((r) => r.id).sort(),
    );
  });

  test("[image-page.get.image-pages-id-sections#feliz] seções paginadas: página e limite respeitados, total vem do banco", async ({
    request,
  }) => {
    const page = await make(request, "api-secoes", { sections: 3 });
    const first = await request.get(`${API_URL}/image-pages/${page.id}/sections?page=1&limit=2`);
    expect(first.status()).toBe(200);
    const body = (await first.json()) as { sections: Array<{ id: string }>; page: number; limit: number; total: number };
    expect(body.sections).toHaveLength(2);
    expect(body.total).toBe((await sectionRows(page.id)).length);
    const second = (await (await request.get(`${API_URL}/image-pages/${page.id}/sections?page=2&limit=2`)).json()) as typeof body;
    expect(second.sections).toHaveLength(1);
    const ids = new Set([...body.sections, ...second.sections].map((s) => s.id));
    expect(ids.size).toBe(3);

    const insane = (await (await request.get(`${API_URL}/image-pages/${page.id}/sections?page=abc&limit=1000`)).json()) as typeof body;
    expect(insane.page).toBe(1);
    expect(insane.limit).toBeLessThanOrEqual(50);
  });

  test("[image-page.get.image-pages#escopo-proprio-x-outro] visitante só vê galerias públicas; com sessão vê todas", async ({
    request,
  }) => {
    const pub = await make(request, "escopo-pub", { isPublic: true });
    const priv = await make(request, "escopo-priv", { isPublic: false });
    const anon = (await (await request.get(`${API_URL}/image-pages`)).json()) as ImagePageBody[];
    expect(anon.some((p) => p.id === pub.id)).toBe(true);
    expect(anon.some((p) => p.id === priv.id)).toBe(false);
    const logged = (await (await request.get(`${API_URL}/image-pages`, { headers: authHeaders(member) })).json()) as ImagePageBody[];
    expect(logged.some((p) => p.id === priv.id)).toBe(true);
    expect((await pageRow(priv.id))?.public).toBe(0);
  });

  test("[image-page.get.image-pages-id#escopo-proprio-x-outro] galeria não pública: 404 para visitante, 200 com sessão", async ({
    request,
  }) => {
    const priv = await make(request, "escopo-id", { isPublic: false });
    expect((await request.get(`${API_URL}/image-pages/${priv.id}`)).status()).toBe(404);
    expect((await request.get(`${API_URL}/image-pages/${priv.id}`, { headers: authHeaders(member) })).status()).toBe(200);
  });

  test("[image-page.get.image-pages-id-sections#escopo-proprio-x-outro] seções de galeria não pública: 404 para visitante, 200 com sessão", async ({
    request,
  }) => {
    const priv = await make(request, "escopo-sec", { isPublic: false });
    expect((await request.get(`${API_URL}/image-pages/${priv.id}/sections`)).status()).toBe(404);
    const logged = await request.get(`${API_URL}/image-pages/${priv.id}/sections`, { headers: authHeaders(member) });
    expect(logged.status()).toBe(200);
  });

  test("[image-page.get.image-pages-id#nao-encontrado] [image-page.get.image-pages-id-sections#nao-encontrado] id inexistente: 404 e nada criado", async ({
    request,
  }) => {
    const before = await snapshotDb();
    expect((await request.get(`${API_URL}/image-pages/${BAD_ID}`, { headers: authHeaders(admin) })).status()).toBe(404);
    expect((await request.get(`${API_URL}/image-pages/${BAD_ID}/sections`, { headers: authHeaders(admin) })).status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[image-page.get.image-pages-id#flag-desligada] [image-page.get.image-pages-id-sections#flag-desligada] flags desligadas: 403 FEATURE_DISABLED e banco inalterado", async ({
    request,
  }) => {
    const page = await make(request, "flag-get");
    await withFlagsOff(request, async () => {
      const before = await snapshotDb();
      for (const path of [`/image-pages/${page.id}`, `/image-pages/${page.id}/sections`]) {
        const res = await request.get(`${API_URL}${path}`, { headers: authHeaders(admin) });
        expect(res.status(), path).toBe(403);
        expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      }
      expect(await snapshotDb()).toEqual(before);
    });
  });

  test("[image-page.post.image-pages#validacao] payload inválido: 400 e nenhuma linha gravada", async ({ request }) => {
    const before = await snapshotDb();
    const invalid = await request.post(`${API_URL}/image-pages`, {
      headers: authHeaders(admin),
      multipart: { imageData: JSON.stringify({ title: 123, description: "d", public: "sim", sections: "x" }) },
    });
    expect(invalid.status()).toBe(400);
    const unknownField = await request.post(`${API_URL}/image-pages`, {
      headers: authHeaders(admin),
      multipart: {
        imageData: JSON.stringify({ title: tagged("x"), description: "d", public: true, sections: [], admin: true }),
      },
    });
    expect(unknownField.status()).toBe(400);
    const missingFile = await request.post(`${API_URL}/image-pages`, {
      headers: authHeaders(admin),
      multipart: {
        imageData: JSON.stringify({
          title: tagged("sem-arquivo"),
          description: "d",
          public: true,
          sections: [
            {
              caption: "c",
              description: "d",
              public: true,
              mediaItems: [
                { uploadType: "upload", mediaType: "image", isLocalFile: true, originalName: "x.png", fieldKey: "ausente" },
              ],
            },
          ],
        }),
      },
    });
    expect(missingFile.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    expect(await pagesWithTag(RUN_TAG)).toBe(created.length);
  });

  test("[image-page.post.image-pages#conflito-ou-duplicidade] mesmo título duas vezes: duas galerias com rotas distintas", async ({
    request,
  }) => {
    const first = await make(request, "duplicado");
    const second = await make(request, "duplicado");
    expect(second.id).not.toBe(first.id);
    const [r1] = await routeRows(first.id);
    const [r2] = await routeRows(second.id);
    expect(r1.path).not.toBe(r2.path);
    expect(await countRows("image_pages", { name: tagged("duplicado") })).toBe(2);
  });

  test("[image-page.patch.image-pages-id#feliz] admin atualiza título, visibilidade, seção e mídia: banco reflete", async ({ request }) => {
    const page = await make(request, "api-patch", { sections: 2 });
    const [keep] = page.sections;
    const updated = await updatePage(request, admin, page.id, {
      title: tagged("api-patch-novo"),
      description: "outra descrição",
      isPublic: false,
      sections: [
        { id: keep.id, caption: tagged("api-patch-mantida"), media: [{ id: keep.mediaItems[0].id }, { title: "nova" }] },
      ],
    });
    expect(updated.title).toBe(tagged("api-patch-novo"));
    expect(await pageRow(page.id)).toMatchObject({ name: tagged("api-patch-novo"), description: "outra descrição", public: 0 });
    const sections = await sectionRows(page.id);
    expect(sections.map((s) => s.id)).toEqual([keep.id]);
    expect(sections[0].caption).toBe(tagged("api-patch-mantida"));
    expect(await mediaRows(page.id)).toHaveLength(2);
    expect((await routeRows(page.id))).toHaveLength(1);
  });

  test("[image-page.patch.image-pages-id#validacao] payload inválido: 400 e a galeria continua como estava", async ({ request }) => {
    const page = await make(request, "patch-valida");
    const before = await snapshotDb();
    const row = await pageRow(page.id);
    const res = await request.patch(`${API_URL}/image-pages/${page.id}`, {
      headers: authHeaders(admin),
      multipart: { imageData: JSON.stringify({ id: page.id, title: 1, description: "d", public: true, sections: [] }) },
    });
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    expect(await pageRow(page.id)).toEqual(row);
  });

  test("[image-page.patch.image-pages-id#nao-encontrado] id inexistente: 404 e nada muda no banco", async ({ request }) => {
    const before = await snapshotDb();
    const res = await updatePageRaw(request, admin, BAD_ID, {
      title: tagged("fantasma"),
      sections: [{ caption: "c", media: [{ title: "x" }] }],
    });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
    expect(await pagesWithTag(tagged("fantasma"))).toBe(0);
  });

  test("[image-page.patch.image-pages-id#conflito-ou-duplicidade] renomear para o título de outra galeria: ambas existem, rotas continuam distintas", async ({
    request,
  }) => {
    const first = await make(request, "conflito-a");
    const second = await make(request, "conflito-b");
    const updated = await updatePage(request, admin, second.id, inputFromBody(second, { title: tagged("conflito-a") }));
    expect(updated.id).toBe(second.id);
    expect(await pageRow(first.id)).toMatchObject({ name: tagged("conflito-a") });
    expect(await pageRow(second.id)).toMatchObject({ name: tagged("conflito-a") });
    const [r1] = await routeRows(first.id);
    const [r2] = await routeRows(second.id);
    expect(r1.path).not.toBe(r2.path);
  });

  test("[image-page.delete.image-pages-id#feliz] admin exclui: página, seções, rota e mídia somem do banco", async ({ request }) => {
    const page = await make(request, "api-excluir", { sections: 2 });
    const res = await request.delete(`${API_URL}/image-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await pageRow(page.id)).toBeNull();
    expect(await sectionRows(page.id)).toHaveLength(0);
    expect(await routeRows(page.id)).toHaveLength(0);
    expect(await countRows("media_items", { targetType: "ImagesPage", targetId: page.sections[0].id })).toBe(0);
  });

  test("[image-page.delete.image-pages-id#nao-encontrado] excluir id inexistente e excluir duas vezes: 404 e nada muda", async ({
    request,
  }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/image-pages/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);

    const page = await make(request, "excluir-2x");
    expect((await request.delete(`${API_URL}/image-pages/${page.id}`, { headers: authHeaders(admin) })).status()).toBe(200);
    const afterFirst = await snapshotDb();
    const again = await request.delete(`${API_URL}/image-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(again.status()).toBe(404);
    expect(await snapshotDb()).toEqual(afterFirst);
  });
});
