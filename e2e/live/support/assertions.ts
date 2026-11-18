import { type APIResponse, expect } from "@playwright/test";

import { countRows, queryAll, type Where } from "./db";
import { expectBucketUnchanged, snapshotBucket } from "./s3";

/** Estados da fila de saída de e-mail (`email_outbox.status`). */
export type OutboxStatus = "pending" | "sent" | "failed" | "skipped";

/**
 * Prova no banco que a aplicação decidiu enviar (ou barrou por flag) um e-mail.
 * É a fronteira verificável do envio: o worker de SMTP não faz parte do E2E.
 */
export async function expectOutbox(filter: {
  templateKey: string;
  recipient: string;
  status?: OutboxStatus;
}): Promise<void> {
  const rows = await queryAll<{ status: OutboxStatus }>(
    "SELECT status FROM `email_outbox` WHERE `templateKey` = ? AND `recipient` = ?",
    [filter.templateKey, filter.recipient],
  );
  expect(rows.length, `e-mail ${filter.templateKey} → ${filter.recipient} no outbox`).toBeGreaterThan(0);
  if (filter.status) expect(rows.map((r) => r.status)).toContain(filter.status);
}

export async function expectNoOutbox(filter: { templateKey: string; recipient: string }): Promise<void> {
  expect(await countRows("email_outbox", { templateKey: filter.templateKey, recipient: filter.recipient })).toBe(0);
}

/**
 * Negativo de autorização: a API recusa **e** nada muda no banco nem no bucket.
 * `watch` lista as tabelas que não podem variar.
 */
export async function expectForbiddenWithoutSideEffects(
  action: () => Promise<APIResponse>,
  watch: ReadonlyArray<{ table: string; where?: Where }>,
  expectedStatuses: readonly number[] = [401, 403, 404],
): Promise<void> {
  const before = await Promise.all(watch.map((w) => countRows(w.table, w.where ?? {})));
  const bucketBefore = await snapshotBucket();
  const response = await action();
  expect(expectedStatuses, `status recebido: ${response.status()}`).toContain(response.status());
  const after = await Promise.all(watch.map((w) => countRows(w.table, w.where ?? {})));
  expect(after).toEqual(before);
  await expectBucketUnchanged(bucketBefore);
}
