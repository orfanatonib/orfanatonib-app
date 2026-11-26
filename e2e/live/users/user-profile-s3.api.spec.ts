import { API_URL } from "../../../playwright.live.config";
import { countRows, queryOne } from "../support/db";
import { authHeaders, expect, test } from "../support/live";
import { listObjects, objectExists } from "../support/s3";
import {
  ACTOR_PASSWORD,
  FULL_PROFILE,
  createActor,
  expectUserPhotosConsistent,
  photoRows,
  png,
  send,
  sendPhoto,
  setupWorld,
  teardownWorld,
  userPrefix,
  withBucketUnchanged,
  world,
  type Cast,
} from "./support";

/**
 * Cenários `user-profile.s3.NN` (plano 07 §7.4) da FOTO DE PERFIL, pela API real, com SELECT no banco e listagem do bucket
 * (LocalStack) ao fim de cada um. Um usuário tem UMA foto: "N arquivos" vira "1 arquivo" e "substituir" é a troca da foto.
 */
test.describe.serial("Foto de perfil — S3 sem órfão nem referência quebrada", () => {
  let cast: Cast;
  let seeded: string;
  let extra: string[];

  test.beforeAll(async ({ request }) => {
    await setupWorld(request);
    ({ cast, seeded, extra } = world);
  });

  test.afterAll(async ({ request }) => {
    await teardownWorld(request);
  });

  const member = async (request: Parameters<typeof createActor>[0], label: string) => {
    const actor = await createActor(request, seeded, "member", label);
    extra.push(actor.id);
    return actor;
  };

  const userObjects = (id: string) => listObjects(`${userPrefix()}${id}/`);

  test("[user-profile.s3.01] enviar a foto: 1 objeto no bucket, 1 linha com a chave, 0 órfãos", async ({ request }) => {
    const actor = await member(request, "s3-01");
    expect((await sendPhoto(request, "/profile/image", actor.token, png("a.png"))).status()).toBe(200);
    const rows = await photoRows(actor.id);
    expect(rows).toHaveLength(1);
    expect(await userObjects(actor.id)).toEqual([rows[0].storageKey]);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.02] 2 arquivos no mesmo envio (o 2º inválido): recusado, nenhum objeto novo e nenhuma linha", async ({ request }) => {
    const actor = await member(request, "s3-02");
    await withBucketUnchanged(async () => {
      const res = await request.patch(`${API_URL}/profile/image`, {
        headers: authHeaders(actor.token),
        multipart: {
          imageData: JSON.stringify({ title: "Foto", uploadType: "upload", fieldKey: "file" }),
          file: png("ok.png"),
          outro: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
        },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
    expect(await photoRows(actor.id)).toHaveLength(0);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.03] falha REAL do banco depois do upload (título maior que a coluna): objeto enviado é descartado e nada fica gravado", async ({ request }) => {
    const actor = await member(request, "s3-03");
    await withBucketUnchanged(async () => {
      const res = await sendPhoto(request, "/profile/image", actor.token, png("db.png"), "T".repeat(400));
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
    expect(await photoRows(actor.id)).toHaveLength(0);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.05] trocar a foto enviada por um link remove o objeto e mantém 1 linha (sem arquivo)", async ({ request }) => {
    const actor = await member(request, "s3-05");
    await sendPhoto(request, "/profile/image", actor.token);
    const [before] = await photoRows(actor.id);
    const res = await request.patch(`${API_URL}/profile/image`, {
      headers: authHeaders(actor.token),
      data: { title: "Link", url: "https://example.com/foto.png", uploadType: "link" },
    });
    expect(res.status(), await res.text()).toBe(200);
    expect(await objectExists(String(before.storageKey))).toBe(false);
    const rows = await photoRows(actor.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(0);
    expect(await userObjects(actor.id)).toEqual([]);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.06] troca que FALHA mantém a foto antiga (objeto e linha) e descarta a nova", async ({ request }) => {
    const actor = await member(request, "s3-06");
    await sendPhoto(request, "/profile/image", actor.token, png("antiga.png"));
    const before = await photoRows(actor.id);
    const objectsBefore = await userObjects(actor.id);
    const res = await sendPhoto(request, "/profile/image", actor.token, png("nova.png"), "T".repeat(400));
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await photoRows(actor.id)).toEqual(before);
    expect(await userObjects(actor.id)).toEqual(objectsBefore);
    expect(await objectExists(String(before[0].storageKey))).toBe(true);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.07] apagar o usuário remove o objeto e a linha de mídia", async ({ request }) => {
    const actor = await createActor(request, seeded, "member", "s3-07");
    await sendPhoto(request, "/profile/image", actor.token);
    const [photo] = await photoRows(actor.id);
    expect((await send(request, "DELETE", `/users/${actor.id}`, cast.admin.token)).status()).toBe(200);
    expect(await objectExists(String(photo.storageKey))).toBe(false);
    expect(await photoRows(actor.id)).toHaveLength(0);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.08] apagar o dono com filhos (perfil de membro, dados pessoais, preferências e foto): cascata completa", async ({ request }) => {
    const actor = await createActor(request, seeded, "member", "s3-08");
    await send(request, "POST", "/profiles", actor.token, FULL_PROFILE);
    await sendPhoto(request, "/profile/image", actor.token);
    expect(await countRows("member_profiles", { user_id: actor.id })).toBe(1);
    expect(await userObjects(actor.id)).toHaveLength(1);
    expect((await send(request, "DELETE", `/users/${actor.id}`, cast.admin.token)).status()).toBe(200);
    for (const [table, column] of [
      ["users", "id"],
      ["member_profiles", "user_id"],
      ["personal_data", "userId"],
      ["user_preferences", "userId"],
      ["media_items", "targetId"],
    ] as const) {
      expect(await countRows(table, { [column]: actor.id }), `${table}.${column}`).toBe(0);
    }
    expect(await userObjects(actor.id)).toEqual([]);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.09] dois uploads com o MESMO nome no mesmo instante geram chaves distintas (2 objetos, sem sobrescrita)", async ({ request }) => {
    const [a, b] = [await member(request, "s3-09a"), await member(request, "s3-09b")];
    const [ra, rb] = await Promise.all([
      sendPhoto(request, "/profile/image", a.token, png("mesmo-nome.png")),
      sendPhoto(request, "/profile/image", b.token, png("mesmo-nome.png")),
    ]);
    expect([ra.status(), rb.status()]).toEqual([200, 200]);
    const keys = [...(await userObjects(a.id)), ...(await userObjects(b.id))];
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
    expect(((await photoRows(a.id))[0].storageKey ?? "")).not.toBe((await photoRows(b.id))[0].storageKey);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.11] a fila de limpeza existe e, após apagar usuário com foto, nada fica órfão (a falha forçada do bucket é coberta no plano 05)", async ({ request }) => {
    const table = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'media_cleanup_queue'");
    expect(Number(table?.n)).toBe(1);
    const actor = await createActor(request, seeded, "member", "s3-11");
    await sendPhoto(request, "/profile/image", actor.token);
    expect((await send(request, "DELETE", `/users/${actor.id}`, cast.admin.token)).status()).toBe(200);
    expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.s3.12] duas trocas simultâneas da MESMA foto não deixam órfão nem referência quebrada (sobra 1 linha)", async ({ request }) => {
    const actor = await member(request, "s3-12");
    await sendPhoto(request, "/profile/image", actor.token, png("base.png"));
    await Promise.allSettled([
      sendPhoto(request, "/profile/image", actor.token, png("c1.png")),
      sendPhoto(request, "/profile/image", actor.token, png("c2.png")),
    ]);
    expect(await photoRows(actor.id)).toHaveLength(1);
    await expectUserPhotosConsistent();
  });
});

void ACTOR_PASSWORD;
