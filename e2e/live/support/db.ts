import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";

import { dbConfig } from "./env";
import { assertIdentifier, assertSelectOnly } from "./sql-guards";

/**
 * Acesso **somente leitura** ao MySQL dos E2E: prova no banco o efeito de cada
 * ação feita pela UI/API. Só aceita um único `SELECT`; nomes de tabela e
 * coluna vêm de constantes (nunca de entrada externa).
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const { host, port, user, password, database } = dbConfig();
    pool = createPool({
      host, port, user, password, database,
      connectionLimit: 2,
      multipleStatements: false,
      dateStrings: true,
    });
  }
  return pool;
}

export async function queryAll<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<string | number | boolean | Date | null> = [],
): Promise<T[]> {
  assertSelectOnly(sql);
  const [rows] = await getPool().query<RowDataPacket[]>(sql, [...params]);
  return rows as unknown as T[];
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<string | number | boolean | null> = [],
): Promise<T | null> {
  return (await queryAll<T>(sql, params))[0] ?? null;
}

export type Where = Readonly<Record<string, string | number | boolean | null>>;

function whereClause(where: Where): { clause: string; params: Array<string | number | boolean | null> } {
  const entries = Object.entries(where);
  if (entries.length === 0) return { clause: "", params: [] };
  return {
    clause: " WHERE " + entries.map(([col, v]) => (v === null ? `\`${assertIdentifier(col)}\` IS NULL` : `\`${assertIdentifier(col)}\` = ?`)).join(" AND "),
    params: entries.filter(([, v]) => v !== null).map(([, v]) => v as string | number | boolean),
  };
}

export async function countRows(table: string, where: Where = {}): Promise<number> {
  const { clause, params } = whereClause(where);
  const row = await queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM \`${assertIdentifier(table)}\`${clause}`, params);
  return Number(row?.total ?? 0);
}

export async function expectRow<T extends Record<string, unknown> = Record<string, unknown>>(table: string, where: Where): Promise<T> {
  const { clause, params } = whereClause(where);
  const rows = await queryAll<T>(`SELECT * FROM \`${assertIdentifier(table)}\`${clause} LIMIT 2`, params);
  if (rows.length !== 1) {
    throw new Error(`Esperava exatamente 1 linha em ${table} (${JSON.stringify(where)}), achei ${rows.length}.`);
  }
  return rows[0];
}

export async function expectNoRow(table: string, where: Where): Promise<void> {
  const total = await countRows(table, where);
  if (total !== 0) throw new Error(`Esperava 0 linhas em ${table} (${JSON.stringify(where)}), achei ${total}.`);
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
