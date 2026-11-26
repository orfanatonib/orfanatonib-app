/**
 * Contagens do `email_outbox` que não varrem a tabela inteira. Cada aviso para "todos" grava uma linha por usuário
 * (com o HTML), e a massa acumulada leva a tabela a gigabytes: filtrar só por `templateKey` leva segundos.
 *
 * A janela começa no início do teste (fixture automática em `live.ts`), com folga para o que o `beforeAll`
 * acabou de disparar, e usa o índice `(status, scheduledFor)`.
 */
import { test } from "@playwright/test";

import { queryAll } from "./db";

const STATUSES = "('pending','sent','failed','skipped')";
/** Folga para linhas disparadas pouco antes do teste (`beforeAll`, passo anterior de um bloco serial). */
const WINDOW_SLACK_MS = 120_000;

/** Aviso para todo mundo é gravado em segundo plano: pode chegar durante o teste de OUTRA funcionalidade. */
export const BROADCAST_TEMPLATE = "event-notice";

const anchors = new Map<string, Date>();

export function markOutboxWindow(testId: string): Date {
  const start = new Date(Date.now() - WINDOW_SLACK_MS);
  anchors.set(testId, start);
  return start;
}

function windowStart(): Date {
  const { testId } = test.info();
  return anchors.get(testId) ?? markOutboxWindow(testId);
}

/** Linhas do outbox dentro da janela do teste que casam com o filtro extra (parâmetros na ordem). */
export function outboxRows<T extends Record<string, unknown>>(columns: string, filter: string, params: string[]): Promise<T[]> {
  return queryAll<T>(
    `SELECT ${columns} FROM email_outbox WHERE status IN ${STATUSES} AND scheduledFor >= ? AND ${filter}`,
    [windowStart(), ...params],
  );
}

/** Linhas do tipo, por estado, desde o começo da janela do teste. */
export async function outboxStates(templateKey: string): Promise<Record<string, number>> {
  const rows = await queryAll<{ status: string; n: number }>(
    `SELECT status, COUNT(*) AS n FROM email_outbox WHERE status IN ${STATUSES} AND scheduledFor >= ? AND templateKey = ? GROUP BY status`,
    [windowStart(), templateKey],
  );
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.n)]));
}

export const outboxCountFor = async (templateKey: string, recipient?: string): Promise<number> => {
  const rows = await queryAll<{ n: number }>(
    `SELECT COUNT(*) AS n FROM email_outbox WHERE status IN ${STATUSES} AND scheduledFor >= ? AND templateKey = ?${recipient ? " AND recipient = ?" : ""}`,
    recipient ? [windowStart(), templateKey, recipient] : [windowStart(), templateKey],
  );
  return Number(rows[0]?.n ?? 0);
};

/** Para provar "este fluxo não manda e-mail": tudo o que entrou na janela, fora os avisos em segundo plano. */
export async function directOutboxCount(): Promise<number> {
  const rows = await queryAll<{ n: number }>(
    `SELECT COUNT(*) AS n FROM email_outbox WHERE status IN ${STATUSES} AND scheduledFor >= ? AND templateKey <> ?`,
    [windowStart(), BROADCAST_TEMPLATE],
  );
  return Number(rows[0]?.n ?? 0);
}
