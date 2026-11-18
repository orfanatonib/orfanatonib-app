import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { PNG_1X1 } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans, listObjects, uploadsPrefix } from "../support/s3";

/**
 * Ciclo de vida da foto de perfil contra MySQL + S3 (LocalStack) reais:
 * enviar, substituir, recusar arquivo inválido e trocar por link.
 * Invariante ao fim de cada cenário: nenhum objeto órfão e nenhuma referência quebrada.
 */
let userId: string;
let token: string;

const mediaRows = () =>
  queryAll<{ url: string; storageKey: string | null; isLocalFile: number }>(
    "SELECT url, storageKey, isLocalFile FROM media_items WHERE targetId = ? AND targetType = 'UserEntity'",
    [userId],
  );
const userObjects = () => listObjects(`${uploadsPrefix()}User/${userId}/`);

const sendImage = (request: import("@playwright/test").APIRequestContext, file: { name: string; mimeType: string; buffer: Buffer }) =>
  request.patch(`${API_URL}/profile/image`, {
    headers: authHeaders(token),
    multipart: {
      imageData: JSON.stringify({ title: "Foto", uploadType: "upload", fieldKey: "file" }),
      file,
    },
  });

test.describe.serial("Foto de perfil × S3 — ao vivo", () => {
  test.beforeAll(async ({ request }) => {
    const login = await loginAs(request, "member");
    userId = login.userId;
    token = login.accessToken;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("[user-profile.patch.profile-image#feliz] enviar a 1ª foto: objeto no bucket, linha com storageKey, sem órfão", async ({ request }) => {
    const res = await sendImage(request, { name: "a.png", mimeType: "image/png", buffer: PNG_1X1 });
    expect(res.ok()).toBe(true);

    const rows = await mediaRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(1);
    expect(rows[0].storageKey).toMatch(new RegExp(`/User/${userId}/[0-9a-f-]{36}\\.png$`));
    expect(await userObjects()).toEqual([rows[0].storageKey]);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[user-profile.s3.04] substituir: o objeto antigo some, o novo existe, uma única linha", async ({ request }) => {
    const [before] = await mediaRows();
    const res = await sendImage(request, { name: "b.png", mimeType: "image/png", buffer: PNG_1X1 });
    expect(res.ok()).toBe(true);

    const rows = await mediaRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].storageKey).not.toBe(before.storageKey);
    const objects = await userObjects();
    expect(objects).toEqual([rows[0].storageKey]);
    expect(objects).not.toContain(before.storageKey);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[user-profile.s3.10] arquivo que não é imagem: 400, bucket e linha inalterados", async ({ request }) => {
    const rowsBefore = await mediaRows();
    const objectsBefore = await userObjects();
    const res = await sendImage(request, { name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    expect(res.status()).toBe(400);
    expect(await mediaRows()).toEqual(rowsBefore);
    expect(await userObjects()).toEqual(objectsBefore);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("image/svg+xml é recusado pela política (sem executar script no bucket)", async ({ request }) => {
    const objectsBefore = await userObjects();
    const res = await sendImage(request, { name: "x.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg onload=alert(1)/>") });
    expect(res.status()).toBe(400);
    expect(await userObjects()).toEqual(objectsBefore);
  });

  test("trocar por link: o objeto antigo é removido do bucket", async ({ request }) => {
    const res = await request.patch(`${API_URL}/profile/image`, {
      headers: authHeaders(token),
      data: { title: "Link", url: "https://example.com/foto.png", uploadType: "link" },
    });
    expect(res.ok()).toBe(true);
    const rows = await mediaRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(0);
    expect(await userObjects()).toEqual([]);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
