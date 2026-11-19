import { type APIRequestContext, type APIResponse, expect } from "@playwright/test";

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

/**
 * Prova na API de auditoria (plano 12) que a ação foi registrada, sem dado pessoal.
 * Lê `/log-records/audit` como admin; se o ambiente grava em arquivo (409 `LOG_9101`),
 * não há como consultar e a asserção é ignorada com aviso explícito no resultado.
 *
 * Dentro da janela de repetição (60 s) o mesmo evento vira contador no original,
 * então `requestId` pode não existir como linha: `actionName` cobre esse caso.
 */
export async function expectAuditEvent(
  request: APIRequestContext,
  adminToken: string,
  apiUrl: string,
  filter: { requestId?: string; actionName: string; outcome?: string },
): Promise<"found" | "storage-unavailable"> {
  const day = new Date().toISOString().slice(0, 10);
  const query = `from=${day}T00:00:00.000Z&to=${day}T23:59:59.000Z&actionName=${encodeURIComponent(filter.actionName)}`;
  await expect
    .poll(
      async () => {
        const res = await request.get(`${apiUrl}/log-records/audit?${query}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.status() === 409) return "storage-unavailable";
        expect(res.status()).toBe(200);
        const body = (await res.json()) as { data: Array<Record<string, unknown>> };
        const hit = body.data.find(
          (row) =>
            (!filter.requestId || row.requestId === filter.requestId) &&
            (!filter.outcome || row.outcome === filter.outcome),
        );
        return hit ? "found" : "missing";
      },
      { timeout: 15_000, message: `evento de auditoria ${filter.actionName}` },
    )
    .not.toBe("missing");
  const final = await request.get(`${apiUrl}/log-records/audit?${query}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  return final.status() === 409 ? "storage-unavailable" : "found";
}
