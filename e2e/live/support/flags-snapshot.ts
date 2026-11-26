/**
 * Retrato das flags (fora as de e-mail, que a rodada desliga de propósito) para o `setup` guardar e o
 * `teardown` conferir: spec que muda flag tem de devolvê-la como encontrou, senão muda o resultado das seguintes.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import { queryAll } from "./db";

export const FLAG_SNAPSHOT_FILE = join(tmpdir(), "orfanato-e2e-flags-snapshot.json");

export type FlagSnapshot = Record<string, boolean>;

export async function readFlags(): Promise<FlagSnapshot> {
  const rows = await queryAll<{ key: string; enabled: number }>("SELECT `key`, enabled FROM feature_flags");
  return Object.fromEntries(
    rows.filter((row) => !/e-?mail/i.test(row.key)).map((row) => [row.key, Number(row.enabled) === 1]),
  );
}
