import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test, type LoginResult } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import { s3Config } from "../support/env";
import {
  BAD_ID,
  EMAIL_FLAGS,
  OVERSIZED_CAPTION,
  SECTION_FLAGS,
  approve,
  createGallery,
  deleteRaw,
  fetchSection,
  getRaw,
  inputFromBody,
  mediaRows,
  mediaWithTag,
  outboxFor,
  patchRaw,
  pendingCount,
  png,
  removeGallery,
  sectionRow,
  sectionsWithTag,
  snapshotDb,
  submit,
  submitRaw,
  type SectionBody,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Plano 32 — `/image-sections` pela API REAL (MySQL e LocalStack): cada cenário prova o efeito por SELECT, os negativos
 * provam banco E bucket inalterados, e os de S3 listam o bucket. Todos os dados levam `RUN_TAG` e são apagados pela API
 * no `afterAll` (0 linhas e 0 órfãos). As flags da unidade são ligadas aqui; as de e-mail só nos cenários de e-mail. Todas
 * voltam ao estado anterior ao final.
 */
const FLAGS = [...SECTION_FLAGS, ...EMAIL_FLAGS] as const;

test.describe.serial("Seções de imagem — API (banco e bucket reais)", () => {
  let request: APIRequestContext;
  let admin: LoginResult;
  let leader: LoginResult;
  let member: LoginResult;
  let galleryId = "";
  const flagsBefore: Record<string, boolean> = {};
  const created = new Set<string>();
  let counter = 0;
  const label = (name: string): string => tagged(`${name}-${(counter += 1)}`);

  const setFlag = async (key: string, enabled: boolean): Promise<void> => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, {
      headers: authHeaders(admin.accessToken),
      data: { enabled },
    });
    expect(res.ok(), `flag ${key}: ${res.status()}`).toBe(true);
  };

  /** Publicação do `token`, registrada para a limpeza. */
  const post = async (token: string, caption: string, files = 1): Promise<SectionBody> => {
    const body = await submit(request, token, {
      caption,
      media: Array.from({ length: files }, (_, i) => ({ file: png(`${caption}-${i}.png`) })),
    });
    created.add(body.id);
    return body;
  };

  /** O pedido é recusado e NADA muda: nem linhas (publicações e mídias) nem objetos no bucket. */
  const expectNoEffect = async (action: () => Promise<{ status(): number }>, statuses: readonly number[]): Promise<void> => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const response = await action();
    expect(statuses, `status recebido: ${response.status()}`).toContain(response.status());
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  };

  /** Liga as flags de e-mail só durante `work` (a regra da suíte é rodar com todas desligadas) e as restaura. */
  const withEmail = async (work: () => Promise<void>): Promise<void> => {
    for (const key of EMAIL_FLAGS) await setFlag(key, true);
    try {
      await work();
    } finally {
      for (const key of EMAIL_FLAGS) await setFlag(key, flagsBefore[key]);
    }
  };

  const invariants = async (): Promise<void> => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };

  test.beforeAll(async ({ request: api }) => {
    request = api;
    admin = await loginAs(api, "admin");
    leader = await loginAs(api, "leader");
    member = await loginAs(api, "member");
    for (const key of FLAGS) {
      flagsBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
    }
    // As de e-mail ficam como a rodada as deixou (desligadas): só os cenários de e-mail as ligam, e as restauram.
    for (const key of SECTION_FLAGS) await setFlag(key, true);
    galleryId = await createGallery(api, admin.accessToken, tagged("galeria"));
  });

  test.afterAll(async ({ request: api }) => {
    request = api;
    for (const id of created) await deleteRaw(api, admin.accessToken, id);
    await removeGallery(api, admin.accessToken, galleryId);
    for (const key of FLAGS) await setFlag(key, flagsBefore[key]);
    if (CLEANUP_ENABLED) expect(await sectionsWithTag(RUN_TAG), "a limpeza deixou publicações do E2E").toBe(0);
    if (CLEANUP_ENABLED) expect(await mediaWithTag(RUN_TAG), "a limpeza deixou mídias do E2E").toBe(0);
    await invariants();
    await closeDb();
  });

  test.beforeEach(async ({ request: api }) => {
    request = api;
  });

  // ------------------------------------------------------------------ POST /image-sections

  test("[image-section.post.image-sections#feliz] o membro envia: nasce privada e pendente, com autor, sem galeria, e a mídia fica no bucket", async () => {
    const caption = label("feliz");
    const response = await submitRaw(request, member.accessToken, {
      caption,
      isPublic: true, // o cliente tenta publicar direto: a API ignora
      media: [{ file: png("a.png") }, { file: png("b.png") }],
    });
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as SectionBody;
    created.add(body.id);
    expect(body).toMatchObject({ caption, public: false, reviewStatus: "pending" });
    expect(body.author).not.toBeNull();
    expect(JSON.stringify(body)).not.toContain("e2e.member@"); // nunca o e-mail do autor

    const row = await sectionRow(body.id);
    expect(row).toMatchObject({
      caption,
      public: 0,
      pageId: null,
      authorId: member.userId,
      reviewStatus: "pending",
      rejectionReason: null,
      reviewedById: null,
    });
    const media = await mediaRows(body.id);
    expect(media).toHaveLength(2);
    const keys = await listObjects();
    for (const item of media) {
      expect(item.isLocalFile).toBe(1);
      expect(item.mediaType).toBe("image");
      expect(keys).toContain(keyFromUrl(item.url, s3Config().bucket));
    }
    await invariants();
  });

  test("[image-section.post.image-sections#validacao] sem mídia, JSON inválido, campo desconhecido, arquivo que não é foto e 11 fotos: 400 e NADA gravado", async () => {
    await expectNoEffect(() => submitRaw(request, member.accessToken, { caption: label("sem-midia"), media: [] }), [400]);
    await expectNoEffect(
      () =>
        request.post(`${API_URL}/image-sections`, {
          headers: authHeaders(member.accessToken),
          multipart: { sectionData: "{isto não é json" },
        }),
      [400],
    );
    await expectNoEffect(
      () =>
        submitRaw(request, member.accessToken, {
          caption: label("campo-extra"),
          media: [{ file: png("a.png") }],
          extra: { reviewStatus: "approved" },
        }),
      [400],
    );
    await expectNoEffect(
      () =>
        submitRaw(request, member.accessToken, {
          caption: label("exe"),
          media: [{ file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } }],
        }),
      [400],
    );
    await expectNoEffect(
      () =>
        submitRaw(request, member.accessToken, {
          caption: label("onze"),
          media: Array.from({ length: 11 }, (_, i) => ({ file: png(`f${i}.png`) })),
        }),
      [400, 413],
    );
  });

  test("[image-section.post.image-sections#conflito-ou-duplicidade] o mesmo arquivo em duas mídias é recusado; legenda repetida é permitida (sem unicidade)", async () => {
    await expectNoEffect(
      () =>
        submitRaw(request, member.accessToken, {
          caption: label("repetido"),
          media: [{ file: png("a.png") }, { reuseFieldOfPrevious: true }],
        }),
      [400],
    );
    const caption = label("mesma-legenda");
    const first = await post(member.accessToken, caption);
    const second = await post(member.accessToken, caption);
    expect(second.id).not.toBe(first.id);
    expect(await sectionsWithTag(caption)).toBe(2);
  });

  test("[image-section.post.image-sections#escopo-proprio-x-outro] a autoria é sempre da sessão: não dá para forjar o autor e cada um só vê as próprias em /mine", async () => {
    await expectNoEffect(
      () =>
        submitRaw(request, member.accessToken, {
          caption: label("forja"),
          media: [{ file: png("a.png") }],
          extra: { authorId: leader.userId },
        }),
      [400],
    );
    const mine = await post(member.accessToken, label("do-membro"));
    const hers = await post(leader.accessToken, label("do-lider"));
    expect(await sectionRow(mine.id)).toMatchObject({ authorId: member.userId });
    expect(await sectionRow(hers.id)).toMatchObject({ authorId: leader.userId });

    const idsOf = async (token: string): Promise<string[]> => {
      const res = await getRaw(request, token, "/mine");
      expect(res.status()).toBe(200);
      return ((await res.json()) as Array<{ id: string }>).map((item) => item.id);
    };
    const memberIds = await idsOf(member.accessToken);
    expect(memberIds).toContain(mine.id);
    expect(memberIds).not.toContain(hers.id);
    const leaderIds = await idsOf(leader.accessToken);
    expect(leaderIds).toContain(hers.id);
    expect(leaderIds).not.toContain(mine.id);
  });

  test("[image-section.post.image-sections#falha-do-colaborador-sem-efeito-parcial] o 2º arquivo é inválido depois de o 1º já ser válido: 400 e nenhum objeto nem linha ficam", async () => {
    await expectNoEffect(
      () =>
        submitRaw(request, member.accessToken, {
          caption: label("segundo-invalido"),
          media: [{ file: png("ok.png") }, { file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } }],
        }),
      [400],
    );
    await invariants();
  });

  test("[image-section.post.image-sections#rollback-de-transacao] falha real do banco (legenda acima de 255): 400, nenhuma linha e nenhum objeto", async () => {
    await expectNoEffect(
      () => submitRaw(request, member.accessToken, { caption: OVERSIZED_CAPTION, media: [{ file: png("a.png") }, { file: png("b.png") }] }),
      [400],
    );
    await invariants();
  });

  test("[image-section.post.image-sections#s3-sem-orfao] enviar e apagar: o bucket e o banco batem nos dois momentos", async () => {
    const body = await post(member.accessToken, label("s3"), 3);
    expect(await mediaRows(body.id)).toHaveLength(3);
    await invariants();
    expect((await deleteRaw(request, admin.accessToken, body.id)).status()).toBe(200);
    created.delete(body.id);
    expect(await mediaRows(body.id)).toHaveLength(0);
    await invariants();
  });

  test("[image-section.post.image-sections#email-enviado-ou-bloqueado-por-flag] membro publica: o aviso aos admins entra no outbox; com a flag própria desligada fica 'skipped'; o admin publicando não avisa ninguém", async () => {
    await withEmail(async () => {
      const on = label("email-on");
      await post(member.accessToken, on);
      await expect.poll(async () => (await outboxFor("image-shared-notification", on)).length, { timeout: 15_000 }).toBeGreaterThan(0);
      const rows = await outboxFor("image-shared-notification", on);
      expect(rows.every((row) => row.status !== "skipped")).toBe(true);
      expect(rows[0].subject).toContain("aguardando aprovação");

      await setFlag("email_image_shared_notification", false);
      const off = label("email-off");
      await post(member.accessToken, off);
      await expect.poll(async () => (await outboxFor("image-shared-notification", off)).length, { timeout: 15_000 }).toBeGreaterThan(0);
      expect((await outboxFor("image-shared-notification", off)).every((row) => row.status === "skipped")).toBe(true);
      await setFlag("email_image_shared_notification", true);

      const own = label("email-admin");
      await post(admin.accessToken, own);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect(await outboxFor("image-shared-notification", own)).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ PATCH /image-sections/:id

  test("[image-section.patch.image-sections-id#feliz] o admin aprova: vai à galeria, fica pública e aprovada com revisor, e o visitante a lê no feed", async () => {
    const pending = await post(member.accessToken, label("aprovar"), 2);
    const before = await pendingCount();
    const response = await approve(request, admin.accessToken, pending, galleryId, { caption: `${pending.caption} (revisada)` });
    expect(response.status(), await response.text()).toBe(200);

    const row = await sectionRow(pending.id);
    expect(row).toMatchObject({
      caption: `${pending.caption} (revisada)`,
      public: 1,
      pageId: galleryId,
      authorId: member.userId, // a revisão não troca o autor
      reviewStatus: "approved",
      rejectionReason: null,
      reviewedById: admin.userId,
    });
    expect(row?.reviewedAt).toBeTruthy();
    expect((await mediaRows(pending.id)).map((m) => m.id).sort()).toEqual(pending.mediaItems.map((m) => m.id).sort());
    expect(await pendingCount()).toBe(before - 1);

    const feed = await request.get(`${API_URL}/image-pages/${galleryId}/sections?page=1&limit=100`);
    const sections = ((await feed.json()) as { sections: Array<{ id: string }> }).sections;
    expect(sections.map((s) => s.id)).toContain(pending.id);
    await invariants();
  });

  test("[image-section.patch.image-sections-id#validacao] sem mídia, JSON inválido e campo desconhecido: 400 e a publicação segue exatamente como estava", async () => {
    const pending = await post(member.accessToken, label("editar-invalido"));
    const rowBefore = await sectionRow(pending.id);
    await expectNoEffect(() => patchRaw(request, admin.accessToken, pending.id, inputFromBody(pending, { media: [] })), [400]);
    await expectNoEffect(
      () =>
        request.patch(`${API_URL}/image-sections/${pending.id}`, {
          headers: authHeaders(admin.accessToken),
          multipart: { sectionData: "não é json" },
        }),
      [400],
    );
    await expectNoEffect(
      () => patchRaw(request, admin.accessToken, pending.id, inputFromBody(pending, { extra: { authorId: leader.userId } })),
      [400],
    );
    expect(await sectionRow(pending.id)).toEqual(rowBefore);
  });

  test("[image-section.patch.image-sections-id#nao-encontrado] id inexistente: 404 e nada muda", async () => {
    await expectNoEffect(
      () => patchRaw(request, admin.accessToken, BAD_ID, { caption: label("fantasma"), pageId: galleryId, media: [{ url: undefined }] }),
      [404],
    );
  });

  test("[image-section.patch.image-sections-id#conflito-ou-duplicidade] usar a mídia de OUTRA publicação é recusado (400/404) e as duas ficam intactas; reaprovar é idempotente", async () => {
    const one = await post(member.accessToken, label("conflito-a"));
    const two = await post(member.accessToken, label("conflito-b"));
    const mediaOne = await mediaRows(one.id);
    const mediaTwo = await mediaRows(two.id);
    await expectNoEffect(
      () => patchRaw(request, admin.accessToken, one.id, { ...inputFromBody(one), media: [{ id: mediaTwo[0].id }], pageId: galleryId }),
      [400, 404],
    );
    expect(await mediaRows(one.id)).toEqual(mediaOne);
    expect(await mediaRows(two.id)).toEqual(mediaTwo);
    expect(await sectionRow(one.id)).toMatchObject({ pageId: null, reviewStatus: "pending" });

    expect((await approve(request, admin.accessToken, one, galleryId)).status()).toBe(200);
    const again = await approve(request, admin.accessToken, await fetchSection(request, admin.accessToken, one.id), galleryId);
    expect(again.status()).toBe(200);
    expect(await mediaRows(one.id)).toHaveLength(1);
  });

  test("[image-section.patch.image-sections-id#escopo-proprio-x-outro] nem o autor nem outro usuário editam: membro (dono) e líder (outro) recebem 403 e o banco não muda", async () => {
    const mine = await post(member.accessToken, label("escopo-patch"));
    const rowBefore = await sectionRow(mine.id);
    for (const token of [member.accessToken, leader.accessToken]) {
      await expectNoEffect(() => approve(request, token, mine, galleryId), [403]);
    }
    expect(await sectionRow(mine.id)).toEqual(rowBefore);
  });

  test("[image-section.patch.image-sections-id#falha-do-colaborador-sem-efeito-parcial] foto nova + falha no banco: 400, linhas e mídia antigas intactas e o novo objeto é descartado", async () => {
    const pending = await post(member.accessToken, label("patch-falha"));
    const rowBefore = await sectionRow(pending.id);
    const mediaBefore = await mediaRows(pending.id);
    await expectNoEffect(
      () =>
        patchRaw(request, admin.accessToken, pending.id, {
          ...inputFromBody(pending),
          caption: OVERSIZED_CAPTION,
          pageId: galleryId,
          media: [{ id: mediaBefore[0].id }, { file: png("nova.png") }],
        }),
      [400],
    );
    expect(await sectionRow(pending.id)).toEqual(rowBefore);
    expect(await mediaRows(pending.id)).toEqual(mediaBefore);
    await invariants();
  });

  test("[image-section.patch.image-sections-id#rollback-de-transacao] trocar a foto e falhar ao gravar a publicação desfaz TUDO: a linha aponta para o objeto antigo, que continua no bucket", async () => {
    const pending = await post(member.accessToken, label("patch-rollback"));
    const [old] = await mediaRows(pending.id);
    await expectNoEffect(
      () =>
        patchRaw(request, admin.accessToken, pending.id, {
          ...inputFromBody(pending),
          caption: OVERSIZED_CAPTION,
          pageId: galleryId,
          media: [{ id: old.id, file: png("troca.png") }],
        }),
      [400],
    );
    expect((await mediaRows(pending.id))[0]).toEqual(old);
    expect(await listObjects()).toContain(keyFromUrl(old.url, s3Config().bucket));
    await invariants();
  });

  test("[image-section.patch.image-sections-id#s3-sem-orfao] trocar a foto na aprovação: o objeto novo existe, o antigo some depois do commit e nada fica órfão", async () => {
    const pending = await post(member.accessToken, label("patch-s3"));
    const [old] = await mediaRows(pending.id);
    const response = await patchRaw(request, admin.accessToken, pending.id, {
      ...inputFromBody(pending),
      isPublic: true,
      pageId: galleryId,
      media: [{ id: old.id, file: png("nova.png") }],
    });
    expect(response.status(), await response.text()).toBe(200);
    const [fresh] = await mediaRows(pending.id);
    expect(fresh.id).toBe(old.id);
    expect(fresh.url).not.toBe(old.url);
    const keys = await listObjects();
    expect(keys).toContain(keyFromUrl(fresh.url, s3Config().bucket));
    expect(keys).not.toContain(keyFromUrl(old.url, s3Config().bucket));
    await invariants();
  });

  test("[image-section.patch.image-sections-id#email-enviado-ou-bloqueado-por-flag] aprovar nunca dispara e-mail de nova publicação, mesmo com as flags ligadas", async () => {
    await withEmail(async () => {
      const caption = label("patch-email");
      const pending = await post(member.accessToken, caption);
      await expect.poll(async () => (await outboxFor("image-shared-notification", caption)).length, { timeout: 15_000 }).toBeGreaterThan(0);
      const sharedBefore = (await outboxFor("image-shared-notification", caption)).length;
      expect((await approve(request, admin.accessToken, pending, galleryId)).status()).toBe(200);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect((await outboxFor("image-shared-notification", caption)).length).toBe(sharedBefore);
      expect(await outboxFor("image-rejected-notification", caption)).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ DELETE /image-sections/:id

  test("[image-section.delete.image-sections-id#feliz] o admin apaga: some a publicação, as linhas de mídia e os objetos", async () => {
    const pending = await post(member.accessToken, label("apagar"), 2);
    const media = await mediaRows(pending.id);
    const res = await deleteRaw(request, admin.accessToken, pending.id);
    expect(res.status(), await res.text()).toBe(200);
    created.delete(pending.id);
    expect(await sectionRow(pending.id)).toBeNull();
    expect(await mediaRows(pending.id)).toHaveLength(0);
    const keys = await listObjects();
    for (const item of media) expect(keys).not.toContain(keyFromUrl(item.url, s3Config().bucket));
    await invariants();
  });

  test("[image-section.delete.image-sections-id#nao-encontrado] id inexistente e segunda exclusão: 404 e nada muda", async () => {
    await expectNoEffect(() => deleteRaw(request, admin.accessToken, BAD_ID), [404]);
    const once = await post(member.accessToken, label("duas-vezes"));
    expect((await deleteRaw(request, admin.accessToken, once.id)).status()).toBe(200);
    created.delete(once.id);
    await expectNoEffect(() => deleteRaw(request, admin.accessToken, once.id), [404]);
  });

  test("[image-section.delete.image-sections-id#escopo-proprio-x-outro] o autor (membro) e outro usuário (líder) não apagam: 403 e a publicação e a mídia continuam", async () => {
    const mine = await post(member.accessToken, label("escopo-delete"));
    for (const token of [member.accessToken, leader.accessToken]) {
      await expectNoEffect(() => deleteRaw(request, token, mine.id), [403]);
    }
    expect(await sectionRow(mine.id)).not.toBeNull();
    expect(await mediaRows(mine.id)).toHaveLength(1);
  });

  test("[image-section.delete.image-sections-id#s3-sem-orfao] apagar publicação aprovada com 3 mídias deixa o bucket sem órfão e o banco sem referência quebrada", async () => {
    const pending = await post(member.accessToken, label("delete-s3"), 3);
    expect((await approve(request, admin.accessToken, pending, galleryId)).status()).toBe(200);
    await invariants();
    expect((await deleteRaw(request, admin.accessToken, pending.id)).status()).toBe(200);
    created.delete(pending.id);
    expect(await mediaRows(pending.id)).toHaveLength(0);
    await invariants();
  });

  test("[image-section.delete.image-sections-id#email-enviado-ou-bloqueado-por-flag] apagar nunca dispara e-mail", async () => {
    await withEmail(async () => {
      const caption = label("delete-email");
      const pending = await post(member.accessToken, caption);
      await expect.poll(async () => (await outboxFor("image-shared-notification", caption)).length, { timeout: 15_000 }).toBeGreaterThan(0);
      const before = (await outboxFor("image-shared-notification", caption)).length;
      expect((await deleteRaw(request, admin.accessToken, pending.id)).status()).toBe(200);
      created.delete(pending.id);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect((await outboxFor("image-shared-notification", caption)).length).toBe(before);
      expect(await outboxFor("image-rejected-notification", caption)).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------ GET /image-sections (fila)

  test("[image-section.get.image-sections#feliz] a fila do admin bate com o SELECT: pendentes e reprovadas entram, aprovadas (na galeria) não", async () => {
    const pending = await post(member.accessToken, label("fila-pendente"));
    const approved = await post(member.accessToken, label("fila-aprovada"));
    expect((await approve(request, admin.accessToken, approved, galleryId)).status()).toBe(200);

    const res = await getRaw(request, admin.accessToken, "");
    expect(res.status()).toBe(200);
    const list = (await res.json()) as SectionBody[];
    const ids = list.map((s) => s.id);
    expect(ids).toContain(pending.id);
    expect(ids).not.toContain(approved.id);
    const item = list.find((s) => s.id === pending.id)!;
    expect(item).toMatchObject({ reviewStatus: "pending", authorId: member.userId });
    expect(item.mediaItems).toHaveLength(1);

    const expected = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE pageId IS NULL");
    expect(list.length).toBe(Number(expected?.n));
  });

  test("[image-section.get.image-sections#escopo-proprio-x-outro] o filtro authorId devolve só as de quem foi pedido; id inválido é 400; só o admin filtra", async () => {
    const mine = await post(member.accessToken, label("filtro-membro"));
    const hers = await post(leader.accessToken, label("filtro-lider"));
    const idsFor = async (authorId: string): Promise<string[]> => {
      const res = await getRaw(request, admin.accessToken, `?authorId=${authorId}`);
      expect(res.status()).toBe(200);
      return ((await res.json()) as SectionBody[]).map((s) => s.id);
    };
    const memberIds = await idsFor(member.userId);
    expect(memberIds).toContain(mine.id);
    expect(memberIds).not.toContain(hers.id);
    const leaderIds = await idsFor(leader.userId);
    expect(leaderIds).toContain(hers.id);
    expect(leaderIds).not.toContain(mine.id);
    expect((await getRaw(request, admin.accessToken, "?authorId=nao-uuid")).status()).toBe(400);
    expect((await getRaw(request, member.accessToken, `?authorId=${member.userId}`)).status()).toBe(403);
  });

  // ------------------------------------------------------------------ GET /image-sections/:id

  test("[image-section.get.image-sections-id#feliz] o admin lê uma publicação: campos, autor e mídias batem com o SELECT", async () => {
    const pending = await post(member.accessToken, label("detalhe"), 2);
    const body = await fetchSection(request, admin.accessToken, pending.id);
    const row = await sectionRow(pending.id);
    expect(body).toMatchObject({ id: row?.id, caption: row?.caption, reviewStatus: row?.reviewStatus, authorId: member.userId });
    expect(body.author).not.toBeNull();
    expect(body.mediaItems.map((m) => m.id).sort()).toEqual((await mediaRows(pending.id)).map((m) => m.id).sort());
  });

  test("[image-section.get.image-sections-id#nao-encontrado] id inexistente: 404; id que não é UUID também não vaza nada", async () => {
    expect((await getRaw(request, admin.accessToken, `/${BAD_ID}`)).status()).toBe(404);
    expect([400, 404]).toContain((await getRaw(request, admin.accessToken, "/nao-uuid")).status());
  });

  test("[image-section.get.image-sections-id#escopo-proprio-x-outro] nem o autor lê pelo id: membro (dono) e líder (outro) recebem 403", async () => {
    const mine = await post(member.accessToken, label("escopo-get"));
    for (const token of [member.accessToken, leader.accessToken]) {
      expect((await getRaw(request, token, `/${mine.id}`)).status()).toBe(403);
    }
  });

  test("[image-section.get.image-sections-id#flag-desligada] com a moderação desligada: 403 FEATURE_DISABLED e nada muda", async () => {
    const mine = await post(member.accessToken, label("flag-get"));
    await setFlag("photo_moderation", false);
    try {
      await expectNoEffect(() => getRaw(request, admin.accessToken, `/${mine.id}`), [403]);
      const res = await getRaw(request, admin.accessToken, `/${mine.id}`);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    } finally {
      await setFlag("photo_moderation", true);
    }
  });

  // ------------------------------------------------------------------ GET /image-sections/pending-count

  test("pending-count: o admin recebe a contagem do SELECT; sobe ao enviar e desce ao aprovar ou reprovar", async () => {
    const read = async (): Promise<number> => {
      const res = await getRaw(request, admin.accessToken, "/pending-count");
      expect(res.status(), await res.text()).toBe(200);
      return ((await res.json()) as { pending: number }).pending;
    };
    expect(await read()).toBe(await pendingCount());
    const start = await read();
    const first = await post(member.accessToken, label("contagem-a"));
    const second = await post(member.accessToken, label("contagem-b"));
    expect(await read()).toBe(start + 2);
    expect((await approve(request, admin.accessToken, first, galleryId)).status()).toBe(200);
    expect(await read()).toBe(start + 1);
    const rejected = await request.patch(`${API_URL}/image-sections/${second.id}/reject`, {
      headers: authHeaders(admin.accessToken),
      data: { reason: `fora do tema ${RUN_TAG}` },
    });
    expect(rejected.status(), await rejected.text()).toBe(200);
    expect(await read()).toBe(start);
    expect(await pendingCount()).toBe(start);
  });

  test("pending-count: anônimo 401, membro e líder 403, e com a moderação desligada 403 FEATURE_DISABLED", async () => {
    expect((await getRaw(request, undefined, "/pending-count")).status()).toBe(401);
    expect((await getRaw(request, member.accessToken, "/pending-count")).status()).toBe(403);
    expect((await getRaw(request, leader.accessToken, "/pending-count")).status()).toBe(403);
    await setFlag("photo_moderation", false);
    try {
      const res = await getRaw(request, admin.accessToken, "/pending-count");
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    } finally {
      await setFlag("photo_moderation", true);
    }
  });
});
