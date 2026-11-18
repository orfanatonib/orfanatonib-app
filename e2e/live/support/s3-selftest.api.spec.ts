import { expect, test } from "@playwright/test";

import { RUN_TAG } from "./factory";
import { closeDb } from "./db";
import { expectBucketUnchanged, expectNoOrphans, listObjects, objectExists, plantObject, removeObject, snapshotBucket, uploadsPrefix } from "./s3";

/**
 * Auto-teste dos helpers de S3 contra o LocalStack (`./run.sh local`).
 * Sem o LocalStack este spec **falha** (não é pulado): os cenários de mídia
 * dependem dele.
 */
test.describe("helpers de S3 dos E2E", () => {
  const key = `${uploadsPrefix()}${RUN_TAG}_planted.txt`;

  test.afterAll(async () => {
    await removeObject(key).catch(() => undefined);
    await closeDb();
  });

  test("[e2e.s3.orfao-detectado] objeto plantado sem referência é detectado como órfão", async () => {
    await plantObject(key, "x");
    expect(await objectExists(key)).toBe(true);
    await expect(expectNoOrphans()).rejects.toThrow(key);
    await removeObject(key);
    expect(await listObjects(key)).toEqual([]);
  });

  test("[e2e.s3.bucket-inalterado] detecta objeto novo depois do snapshot", async () => {
    const before = await snapshotBucket();
    await expectBucketUnchanged(before);
    await plantObject(key, "y");
    await expect(expectBucketUnchanged(before)).rejects.toThrow(key);
    await removeObject(key);
  });
});
