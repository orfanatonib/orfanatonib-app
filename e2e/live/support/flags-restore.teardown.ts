import { existsSync, readFileSync, rmSync } from "node:fs";

import { test as teardown } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "./db";
import { FLAG_SNAPSHOT_FILE, readFlags, type FlagSnapshot } from "./flags-snapshot";
import { authHeaders, expect, loginAs } from "./live";

teardown("nenhuma spec deixa flag diferente de como a rodada encontrou", async ({ request }) => {
  if (!existsSync(FLAG_SNAPSHOT_FILE)) return;
  const before = JSON.parse(readFileSync(FLAG_SNAPSHOT_FILE, "utf8")) as FlagSnapshot;
  const after = await readFlags();
  const leaked = Object.keys(before).filter((key) => key in after && after[key] !== before[key]);

  // Restaura primeiro (o ambiente não pode ficar alterado) e só então acusa o vazamento.
  const { accessToken } = await loginAs(request, "admin");
  for (const key of leaked) {
    const response = await request.patch(`${API_URL}/feature-flags/${key}`, {
      headers: authHeaders(accessToken),
      data: { enabled: before[key] },
    });
    expect(response.ok(), `restaurar ${key}`).toBe(true);
  }
  rmSync(FLAG_SNAPSHOT_FILE, { force: true });
  await closeDb();
  expect(leaked, "flags que alguma spec não restaurou (já restauradas agora)").toEqual([]);
});
