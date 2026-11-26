import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "./db";
import { authHeaders, expect } from "./live";

/** Estado atual de uma flag no banco (ausente conta como ligada, como o catálogo padrão). */
export const flagEnabled = async (key: string): Promise<boolean> =>
  ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;

/** Desliga as flags, roda o trabalho e restaura o estado de cada uma, mesmo se o trabalho falhar. */
export async function withFlagsOff(
  request: APIRequestContext,
  adminToken: string,
  keys: readonly string[],
  work: () => Promise<void>,
): Promise<void> {
  const initial = new Map<string, boolean>();
  for (const key of keys) initial.set(key, await flagEnabled(key));
  try {
    for (const key of keys) {
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(adminToken), data: { enabled: false } });
    }
    await work();
  } finally {
    for (const key of keys) {
      await request.patch(`${API_URL}/feature-flags/${key}`, {
        headers: authHeaders(adminToken),
        data: { enabled: initial.get(key) ?? true },
      });
    }
  }
}

/** Flag desligada ⇒ 403 com o código FEATURE_DISABLED. */
export async function expectFeatureDisabled(response: APIResponse): Promise<void> {
  expect(response.status()).toBe(403);
  expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
}
