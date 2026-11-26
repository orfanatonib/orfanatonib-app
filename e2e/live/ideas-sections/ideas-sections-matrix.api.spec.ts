import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { s3Config } from "../support/env";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectNoBrokenRefs, expectNoOrphans, objectExists, snapshotBucket } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import {
  countSections,
  createIdea,
  createIdeasPage,
  deleteIdeasPage,
  deleteIdea,
  LINK_MEDIA,
  mediaRows,
  png,
  sectionBody,
  sectionRow,
  sectionRowsByTitle,
  uploadMedia,
  type SectionDto,
} from "./ideas-sections.helpers";

/**
 * Matriz do plano 30 (§7.3) contra a pilha real: API → MySQL → LocalStack.
 * Cada escrita prova o efeito por SELECT; cada recusa prova banco e bucket
 * inalterados. Os casos "falha-do-colaborador" são de integração da API e vivem
 * no Jest do módulo (`ideas-section-collaborator-failure.spec.ts`).
 */
const TAG = `e2e-ideia-matriz-${Date.now()}`;
const UNKNOWN = "11111111-1111-4111-8111-111111111111";
const FLAGS = ["idea_submission", "idea_moderation"] as const;

type FlagRow = { enabled: number; metadata: string | Record<string, unknown> | null };
const rolesOf = (row: FlagRow): string[] => {
  const meta = typeof row.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : row.metadata;
  return Array.isArray(meta?.targetRoles) ? (meta.targetRoles as string[]) : [];
};

test.describe.serial("Ideias compartilhadas — matriz ao vivo", () => {
  let admin: string;
  let member: string;
  let leader: string;
  let memberId: string;
  let pageId: string;
  const created: string[] = [];
  const originalFlags: Record<string, FlagRow> = {};

  const patchFlag = (request: import("@playwright/test").APIRequestContext, key: string, data: object) =>
    request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data });
  const setFlags = async (request: import("@playwright/test").APIRequestContext, enabled: boolean) => {
    for (const key of FLAGS) expect((await patchFlag(request, key, { enabled })).ok()).toBeTruthy();
  };
  const track = (section: SectionDto): SectionDto => {
    created.push(section.id);
    return section;
  };
  const bucketKeyOf = (url: string) => keyFromUrl(url, s3Config().bucket) as string;

  test.beforeAll(async ({ request }) => {
    const adminLogin = await loginAs(request, "admin");
    admin = adminLogin.accessToken;
    const memberLogin = await loginAs(request, "member");
    member = memberLogin.accessToken;
    memberId = memberLogin.userId;
    leader = (await loginAs(request, "leader")).accessToken;
    pageId = await createIdeasPage(request, admin, `${TAG}-pagina`);
    for (const key of FLAGS) {
      originalFlags[key] = (await queryOne<FlagRow>("SELECT enabled, metadata FROM feature_flags WHERE `key` = ?", [key])) as FlagRow;
    }
  });

  test.afterAll(async ({ request }) => {
    for (const [key, row] of Object.entries(originalFlags)) {
      await patchFlag(request, key, { enabled: row.enabled === 1, targetRoles: rolesOf(row) });
    }
    await deleteIdeasPage(request, admin, pageId);
    for (const id of created) await deleteIdea(request, admin, id);
    expect(await sectionRowsByTitle(TAG)).toEqual([]);
    for (const id of created) expect(await mediaRows(id)).toEqual([]);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  test("[ideas-section.post.ideas-sections#feliz] membro envia ideia com link e arquivo: linha, autor, mídias e objeto no bucket", async ({ request }) => {
    const response = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: { sectionData: sectionBody(`${TAG}-feliz`, [LINK_MEDIA, uploadMedia("image_upload")]), image_upload: png("a.png") },
    });
    expect(response.status()).toBe(201);
    const dto = track((await response.json()) as SectionDto);

    const row = await sectionRow(dto.id);
    expect(row).toMatchObject({ title: `${TAG}-feliz`, public: 1, pageId: null, user_id: memberId });
    const medias = await mediaRows(dto.id);
    expect(medias).toHaveLength(2);
    const upload = medias.find((m) => m.url.includes("a.png"));
    expect(upload).toBeTruthy();
    expect(await objectExists(bucketKeyOf(upload!.url))).toBe(true);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ideas-section.post.ideas-sections#validacao] sem descrição: 400 com o campo apontado e nenhuma linha nem objeto novo", async ({ request }) => {
    const rows = await countSections();
    const bucket = await snapshotBucket();
    const response = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: { sectionData: JSON.stringify({ title: `${TAG}-invalida`, medias: [] }) },
    });
    expect(response.status()).toBe(400);
    expect(JSON.stringify((await response.json()).details)).toContain("description");
    expect(await countSections()).toBe(rows);
    expect(await snapshotBucket()).toEqual(bucket);
  });

  test("[ideas-section.post.ideas-sections#conflito-ou-duplicidade] não há unicidade por título: dois envios iguais viram duas ideias independentes, cada uma com a sua mídia", async ({ request }) => {
    const first = track(await createIdea(request, member, `${TAG}-dup`));
    const second = track(await createIdea(request, member, `${TAG}-dup`));
    expect(second.id).not.toBe(first.id);
    expect((await sectionRowsByTitle(`${TAG}-dup`)).length).toBe(2);
    expect(await mediaRows(first.id)).toHaveLength(1);
    expect(await mediaRows(second.id)).toHaveLength(1);
  });

  test("[ideas-section.post.ideas-sections#escopo-proprio-x-outro] o autor vem do token: tentar impor outro autor no payload é 400 e não grava", async ({ request }) => {
    const rows = await countSections();
    const response = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: { sectionData: sectionBody(`${TAG}-autor`, [LINK_MEDIA], { userId: "outro", user: { id: "outro" } }) },
    });
    expect(response.status()).toBe(400);
    expect(await countSections()).toBe(rows);

    const ok = track(await createIdea(request, leader, `${TAG}-autor-lider`));
    expect((await sectionRow(ok.id))?.user_id).not.toBe(memberId);
  });

  test("[ideas-section.post.ideas-sections#s3-sem-orfao] upload recusado (tipo/assinatura) não deixa objeto nem linha; o aceito é referenciado", async ({ request }) => {
    const rows = await countSections();
    const bucket = await snapshotBucket();
    const bad = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: {
        sectionData: sectionBody(`${TAG}-s3-post`, [uploadMedia("a"), uploadMedia("b")]),
        a: png("ok.png"),
        b: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
      },
    });
    expect([400, 413]).toContain(bad.status());
    expect(await countSections()).toBe(rows);
    expect(await snapshotBucket()).toEqual(bucket);

    track(await createIdea(request, member, `${TAG}-s3-post-ok`, { medias: [uploadMedia("a")], files: { a: png("ok.png") } }));
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ideas-section.post.ideas-sections#flag-desligada] sem idea_submission o POST é 403 FEATURE_DISABLED e nada é gravado", async ({ request }) => {
    expect((await patchFlag(request, "idea_submission", { enabled: false })).ok()).toBeTruthy();
    const rows = await countSections();
    const response = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: { sectionData: sectionBody(`${TAG}-flag`) },
    });
    expect(response.status()).toBe(403);
    expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
    expect(await countSections()).toBe(rows);
    expect((await patchFlag(request, "idea_submission", { enabled: true })).ok()).toBeTruthy();
  });

  test("flag só para líder: idea_submission ligada só para líder: membro recebe 403 e nada grava; líder envia", async ({ request }) => {
    expect((await patchFlag(request, "idea_submission", { enabled: true, targetRoles: ["leader"] })).ok()).toBeTruthy();
    const rows = await countSections();
    const denied = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: { sectionData: sectionBody(`${TAG}-so-lider`) },
    });
    expect(denied.status()).toBe(403);
    expect(await countSections()).toBe(rows);

    track(await createIdea(request, leader, `${TAG}-so-lider-ok`));
    expect(await countSections()).toBe(rows + 1);
    expect((await patchFlag(request, "idea_submission", { enabled: true, targetRoles: rolesOf(originalFlags.idea_submission) })).ok()).toBeTruthy();
  });

  test("[ideas-section.get.ideas-sections#feliz] admin lista a fila: cada ideia sem página aparece, a vinculada não", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-fila`));
    const response = await request.get(`${API_URL}/ideas-sections`, { headers: authHeaders(admin) });
    expect(response.status()).toBe(200);
    const list = (await response.json()) as SectionDto[];
    expect(list.map((s) => s.id)).toContain(idea.id);
    const queue = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM ideas_sections WHERE pageId IS NULL"))?.n);
    expect(list).toHaveLength(queue);
  });

  test("[ideas-section.get.ideas-sections#escopo-proprio-x-outro] a fila traz ideias de todos os autores; quem não é admin não lê nenhuma, nem a própria", async ({ request }) => {
    const mine = track(await createIdea(request, member, `${TAG}-escopo-membro`));
    const theirs = track(await createIdea(request, leader, `${TAG}-escopo-lider`));
    const list = (await (await request.get(`${API_URL}/ideas-sections`, { headers: authHeaders(admin) })).json()) as SectionDto[];
    expect(list.map((s) => s.id)).toEqual(expect.arrayContaining([mine.id, theirs.id]));
    for (const token of [member, leader]) {
      const denied = await request.get(`${API_URL}/ideas-sections`, { headers: authHeaders(token) });
      expect(denied.status()).toBe(403);
      expect(await denied.text()).not.toContain(TAG);
    }
  });

  test("[ideas-section.get.ideas-sections-id#feliz] o detalhe traz a seção com as mídias gravadas no banco", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-detalhe`));
    const response = await request.get(`${API_URL}/ideas-sections/${idea.id}`, { headers: authHeaders(admin) });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as SectionDto;
    expect(body.medias.map((m) => m.id).sort()).toEqual((await mediaRows(idea.id)).map((m) => m.id).sort());
    expect(body.title).toBe((await sectionRow(idea.id))?.title);
  });

  test("[ideas-section.get.ideas-sections-id#nao-encontrado] id inexistente: 404 BUSINESS", async ({ request }) => {
    const response = await request.get(`${API_URL}/ideas-sections/${UNKNOWN}`, { headers: authHeaders(admin) });
    expect(response.status()).toBe(404);
    expect((await response.json()).category).toBe("BUSINESS");
  });

  test("[ideas-section.get.ideas-sections-id#escopo-proprio-x-outro] o autor também não lê a própria ideia pelo detalhe", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-detalhe-autor`));
    const denied = await request.get(`${API_URL}/ideas-sections/${idea.id}`, { headers: authHeaders(member) });
    expect(denied.status()).toBe(403);
    expect(await denied.text()).not.toContain("@");
  });

  test("[ideas-section.get.ideas-sections-id#flag-desligada] sem idea_moderation o detalhe é 403 FEATURE_DISABLED", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-detalhe-flag`));
    await setFlags(request, false);
    const response = await request.get(`${API_URL}/ideas-sections/${idea.id}`, { headers: authHeaders(admin) });
    expect(response.status()).toBe(403);
    expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
    await setFlags(request, true);
  });

  test("[ideas-section.patch.ideas-sections-id#feliz] admin edita no lugar: mesma linha, texto novo, mídia substituída e objeto antigo removido", async ({ request }) => {
    const idea = track(
      await createIdea(request, member, `${TAG}-patch`, { medias: [uploadMedia("a")], files: { a: png("antiga.png") } }),
    );
    const [before] = await mediaRows(idea.id);
    const total = await countSections();

    const response = await request.patch(`${API_URL}/ideas-sections/${idea.id}`, {
      headers: authHeaders(admin),
      multipart: {
        sectionData: sectionBody(`${TAG}-patch-novo`, [{ ...uploadMedia("b"), id: before.id }]),
        b: png("nova.png"),
      },
    });
    expect(response.status(), await response.text()).toBe(200);
    expect(await countSections()).toBe(total);
    expect((await sectionRow(idea.id))?.title).toBe(`${TAG}-patch-novo`);
    const [after] = await mediaRows(idea.id);
    expect(after.url).not.toBe(before.url);
    expect(await objectExists(bucketKeyOf(before.url))).toBe(false);
    expect(await objectExists(bucketKeyOf(after.url))).toBe(true);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ideas-section.patch.ideas-sections-id#validacao] corpo inválido: 400 e a linha continua como estava", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-patch-val`));
    const before = await sectionRow(idea.id);
    const response = await request.patch(`${API_URL}/ideas-sections/${idea.id}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: JSON.stringify({ title: "", description: "x", medias: [] }) },
    });
    expect(response.status()).toBe(400);
    expect(await sectionRow(idea.id)).toEqual(before);
    expect(await mediaRows(idea.id)).toHaveLength(1);
  });

  test("[ideas-section.patch.ideas-sections-id#nao-encontrado] id inexistente: 404 e nada é criado", async ({ request }) => {
    const rows = await countSections();
    const response = await request.patch(`${API_URL}/ideas-sections/${UNKNOWN}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-fantasma`) },
    });
    expect(response.status()).toBe(404);
    expect(await countSections()).toBe(rows);
  });

  test("[ideas-section.patch.ideas-sections-id#conflito-ou-duplicidade] editar não duplica nem vincula; reenviar o id de mídia de OUTRA ideia é recusado e a mídia alheia fica intacta", async ({ request }) => {
    const mine = track(await createIdea(request, member, `${TAG}-conf-a`));
    const other = track(await createIdea(request, leader, `${TAG}-conf-b`));
    const [foreign] = await mediaRows(other.id);
    const total = await countSections();

    const response = await request.patch(`${API_URL}/ideas-sections/${mine.id}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-conf-a`, [{ ...LINK_MEDIA, id: foreign.id, title: "sequestrada" }]) },
    });
    expect(response.status()).toBe(400);
    expect(await countSections()).toBe(total);
    expect((await mediaRows(other.id))[0]).toMatchObject({ id: foreign.id, url: foreign.url });
    expect((await sectionRow(mine.id))?.pageId).toBeNull();
  });

  test("[ideas-section.patch.ideas-sections-id#flag-desligada] [ideas-section.patch.ideas-sections-id-attach-pageid#flag-desligada] sem idea_moderation PATCH e attach são 403 FEATURE_DISABLED e a linha não muda", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-flag-patch`));
    const before = await sectionRow(idea.id);
    await setFlags(request, false);
    for (const path of [`/ideas-sections/${idea.id}`, `/ideas-sections/${idea.id}/attach/${pageId}`]) {
      const response = await request.patch(`${API_URL}${path}`, {
        headers: authHeaders(admin),
        multipart: { sectionData: sectionBody(`${TAG}-flag-patch-novo`) },
      });
      expect(response.status()).toBe(403);
      expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
    }
    await setFlags(request, true);
    expect(await sectionRow(idea.id)).toEqual(before);
  });

  test("[ideas-section.patch.ideas-sections-id#s3-sem-orfao] trocar e remover mídia pelo PATCH não deixa órfão nem referência quebrada", async ({ request }) => {
    const idea = track(
      await createIdea(request, member, `${TAG}-patch-s3`, {
        medias: [uploadMedia("a", "um"), uploadMedia("b", "dois")],
        files: { a: png("um.png"), b: png("dois.png") },
      }),
    );
    const rows = await mediaRows(idea.id);
    const keep = rows.find((r) => r.url.includes("um.png"))!;
    const dropped = rows.find((r) => r.url.includes("dois.png"))!;
    const response = await request.patch(`${API_URL}/ideas-sections/${idea.id}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-patch-s3`, [{ ...uploadMedia("x", "um"), id: keep.id, fieldKey: undefined }]) },
    });
    expect(response.status(), await response.text()).toBe(200);
    expect(await mediaRows(idea.id)).toHaveLength(1);
    expect(await objectExists(bucketKeyOf(keep.url))).toBe(true);
    expect(await objectExists(bucketKeyOf(dropped.url))).toBe(false);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#feliz] admin vincula: pageId gravado, texto novo, e a ideia sai da fila", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-attach`));
    const response = await request.patch(`${API_URL}/ideas-sections/${idea.id}/attach/${pageId}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-attach-ok`, [LINK_MEDIA]) },
    });
    expect(response.status(), await response.text()).toBe(200);
    expect(await sectionRow(idea.id)).toMatchObject({ title: `${TAG}-attach-ok`, pageId });
    const queue = (await (await request.get(`${API_URL}/ideas-sections`, { headers: authHeaders(admin) })).json()) as SectionDto[];
    expect(queue.map((s) => s.id)).not.toContain(idea.id);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#validacao] corpo inválido: 400 e a ideia segue sem página", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-attach-val`));
    const response = await request.patch(`${API_URL}/ideas-sections/${idea.id}/attach/${pageId}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: JSON.stringify({ description: "sem título", medias: [] }) },
    });
    expect(response.status()).toBe(400);
    expect((await sectionRow(idea.id))?.pageId).toBeNull();
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#nao-encontrado] ideia ou página inexistente: 404 e o banco não muda", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-attach-404`));
    const before = await sectionRow(idea.id);
    for (const path of [`/ideas-sections/${UNKNOWN}/attach/${pageId}`, `/ideas-sections/${idea.id}/attach/${UNKNOWN}`]) {
      const response = await request.patch(`${API_URL}${path}`, {
        headers: authHeaders(admin),
        multipart: { sectionData: sectionBody(`${TAG}-attach-404-novo`) },
      });
      expect(response.status()).toBe(404);
    }
    expect(await sectionRow(idea.id)).toEqual(before);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#conflito-ou-duplicidade] vincular de novo uma ideia já publicada: 409 e a linha não muda", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-attach-409`));
    const send = (title: string) =>
      request.patch(`${API_URL}/ideas-sections/${idea.id}/attach/${pageId}`, {
        headers: authHeaders(admin),
        multipart: { sectionData: sectionBody(title) },
      });
    expect((await send(`${TAG}-attach-409-a`)).status()).toBe(200);
    const before = await sectionRow(idea.id);
    expect((await send(`${TAG}-attach-409-b`)).status()).toBe(409);
    expect(await sectionRow(idea.id)).toEqual(before);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#s3-sem-orfao] vincular com arquivo novo: objeto referenciado; arquivo inválido não deixa nada no bucket", async ({ request }) => {
    const idea = track(await createIdea(request, member, `${TAG}-attach-s3`));
    const bucket = await snapshotBucket();
    const bad = await request.patch(`${API_URL}/ideas-sections/${idea.id}/attach/${pageId}`, {
      headers: authHeaders(admin),
      multipart: {
        sectionData: sectionBody(`${TAG}-attach-s3`, [uploadMedia("a")]),
        a: { name: "x.html", mimeType: "text/html", buffer: Buffer.from("<script>1</script>") },
      },
    });
    expect([400, 413]).toContain(bad.status());
    expect(await snapshotBucket()).toEqual(bucket);
    expect((await sectionRow(idea.id))?.pageId).toBeNull();

    const ok = await request.patch(`${API_URL}/ideas-sections/${idea.id}/attach/${pageId}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-attach-s3`, [uploadMedia("a")]), a: png("anexo.png") },
    });
    expect(ok.status(), await ok.text()).toBe(200);
    expect(await mediaRows(idea.id)).toHaveLength(1);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ideas-section.delete.ideas-sections-id#feliz] admin apaga a ideia: linha, mídias e objetos somem", async ({ request }) => {
    const idea = await createIdea(request, member, `${TAG}-del`, { medias: [uploadMedia("a")], files: { a: png("del.png") } });
    const [media] = await mediaRows(idea.id);
    const response = await request.delete(`${API_URL}/ideas-sections/${idea.id}`, { headers: authHeaders(admin) });
    expect(response.status()).toBe(200);
    expect(await sectionRow(idea.id)).toBeNull();
    expect(await mediaRows(idea.id)).toEqual([]);
    expect(await objectExists(bucketKeyOf(media.url))).toBe(false);
  });

  test("[ideas-section.delete.ideas-sections-id#nao-encontrado] id inexistente: 404 e o banco não muda", async ({ request }) => {
    const rows = await countSections();
    const response = await request.delete(`${API_URL}/ideas-sections/${UNKNOWN}`, { headers: authHeaders(admin) });
    expect(response.status()).toBe(404);
    expect(await countSections()).toBe(rows);
  });

  test("[ideas-section.delete.ideas-sections-id#s3-sem-orfao] apagar com várias mídias não deixa órfão; ideia já publicada não é apagada (409) e mantém os objetos", async ({ request }) => {
    const idea = await createIdea(request, member, `${TAG}-del-s3`, {
      medias: [uploadMedia("a", "um"), uploadMedia("b", "dois")],
      files: { a: png("um.png"), b: png("dois.png") },
    });
    const published = track(await createIdea(request, member, `${TAG}-del-pub`, { medias: [uploadMedia("a")], files: { a: png("pub.png") } }));
    expect(
      (
        await request.patch(`${API_URL}/ideas-sections/${published.id}/attach/${pageId}`, {
          headers: authHeaders(admin),
          multipart: { sectionData: sectionBody(`${TAG}-del-pub`, [{ ...uploadMedia("x"), id: (await mediaRows(published.id))[0].id }]) },
        })
      ).status(),
    ).toBe(200);
    const kept = await mediaRows(published.id);

    expect((await request.delete(`${API_URL}/ideas-sections/${idea.id}`, { headers: authHeaders(admin) })).status()).toBe(200);
    expect(await mediaRows(idea.id)).toEqual([]);

    expect((await request.delete(`${API_URL}/ideas-sections/${published.id}`, { headers: authHeaders(admin) })).status()).toBe(409);
    expect(await mediaRows(published.id)).toEqual(kept);
    expect(await objectExists(bucketKeyOf(kept[0].url))).toBe(true);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
