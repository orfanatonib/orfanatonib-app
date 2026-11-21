import type { APIRequestContext, Locator } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";

/** Flags que a casca lê (menu público, menu do usuário e painel). */
export const SHELL_FLAGS = ["about_page", "events_section", "member_area", "sheltered_area", "pagelas"] as const;
export type ShellFlag = (typeof SHELL_FLAGS)[number];

export interface FlagSnapshot {
  readonly enabled: boolean;
  readonly targetRoles: readonly string[];
}

type FlagRow = { enabled: number; metadata: string | Record<string, unknown> | null };

const rolesOf = (row: FlagRow): string[] => {
  const meta = typeof row.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : row.metadata;
  const roles = meta?.targetRoles;
  return Array.isArray(roles) ? (roles as string[]) : [];
};

/** Lê a flag direto do banco (SELECT em `feature_flags`). */
export async function readFlagFromDb(key: string): Promise<FlagSnapshot> {
  const row = await queryOne<FlagRow>("SELECT enabled, metadata FROM feature_flags WHERE `key` = ?", [key]);
  expect(row, `a flag ${key} deve existir no catálogo semeado`).not.toBeNull();
  return { enabled: (row as FlagRow).enabled === 1, targetRoles: rolesOf(row as FlagRow) };
}

export async function snapshotFlags(): Promise<Record<ShellFlag, FlagSnapshot>> {
  const entries = await Promise.all(SHELL_FLAGS.map(async (key) => [key, await readFlagFromDb(key)] as const));
  return Object.fromEntries(entries) as Record<ShellFlag, FlagSnapshot>;
}

export async function setFlag(
  request: APIRequestContext,
  adminToken: string,
  key: ShellFlag,
  data: { enabled: boolean; targetRoles?: readonly string[] },
): Promise<void> {
  // A API local reinicia quando alguém edita o código dela (watch): espera voltar em vez de falhar o teste.
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(adminToken), data });
      expect(res.ok(), `PATCH ${key} falhou (${res.status()})`).toBeTruthy();
      return;
    } catch (error) {
      if (error instanceof Error && !/ECONNREFUSED|ECONNRESET|socket hang up/.test(error.message)) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
  throw lastError;
}

/** Devolve cada flag ao estado exato do snapshot (ligada/desligada e público). */
export async function restoreFlags(
  request: APIRequestContext,
  adminToken: string,
  snapshot: Record<ShellFlag, FlagSnapshot>,
): Promise<void> {
  for (const key of SHELL_FLAGS) {
    await setFlag(request, adminToken, key, { enabled: snapshot[key].enabled, targetRoles: snapshot[key].targetRoles });
  }
}

/** Gate de acessibilidade mobile: alvo de toque com pelo menos 44 px de altura. */
export async function expectTouchTarget(locator: Locator, minPx = 44): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, "elemento sem caixa (não renderizou)").not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(minPx - 0.5);
}
