import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Auditoria e observabilidade (plano 12) contra a API ao vivo.
 *
 * - `/log-records/*` só admin e só com a flag `observability_audit` ligada;
 * - com storage `file` a consulta responde 409 `LOG_9101` (os JSONL existem
 *   para análise fora da aplicação);
 * - a mutação aparece no arquivo de auditoria com o `requestId` do cabeçalho,
 *   sem corpo, senha, e-mail, query string, IP nem nome do ator.
 */
const FLAG = "observability_audit";
const AUDIT_DIR = process.env.E2E_API_AUDIT_DIR ?? resolve(process.cwd(), "../orfanatonib-api/audit");

type FlagRow = { enabled: number };
type AuditLine = Record<string, unknown>;

const readAuditLines = (): AuditLine[] => {
  if (!existsSync(AUDIT_DIR)) return [];
  return readdirSync(AUDIT_DIR)
    .filter((name) => name.endsWith(".jsonl"))
    .flatMap((name) => readFileSync(join(AUDIT_DIR, name), "utf8").split("\n"))
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditLine);
};

const RANGE = "from=2026-11-18T00:00:00.000Z&to=2026-11-19T23:59:59.000Z";

test.describe.serial("Auditoria e observabilidade — API", () => {
  let admin: string;
  let member: string;
  let original: FlagRow;

  const setFlag = async (request: import("@playwright/test").APIRequestContext, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${FLAG}`, {
      headers: authHeaders(admin),
      data: { enabled },
    });
    expect(res.ok()).toBeTruthy();
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    const row = await queryOne<FlagRow>("SELECT enabled FROM feature_flags WHERE `key` = ?", [FLAG]);
    expect(row, `a flag ${FLAG} deve existir no catálogo semeado`).not.toBeNull();
    original = row as FlagRow;
  });

  test.afterAll(async ({ request }) => {
    await setFlag(request, original.enabled === 1);
    expect((await queryOne<FlagRow>("SELECT enabled FROM feature_flags WHERE `key` = ?", [FLAG]))?.enabled).toBe(
      original.enabled,
    );
    await closeDb();
  });

  /** Títulos literais (o gate de cenários lê o texto do arquivo, não o resultado de um template). */
  const TITLES = {
    audit: {
      anonimo: "[observability-audit.get.log-records-audit#perfil-anonimo] visitante recebe 401",
      membro: "[observability-audit.get.log-records-audit#perfil-membro] membro recebe 403",
      desligada:
        "[observability-audit.get.log-records-audit#flag-desligada] admin com a flag desligada recebe 403 FEATURE_DISABLED",
      arquivo:
        "[observability-audit.get.log-records-audit#storage-arquivo] com a flag ligada e storage em arquivo responde 409 LOG_9101",
    },
    observability: {
      anonimo: "[observability-audit.get.log-records-observability#perfil-anonimo] visitante recebe 401",
      membro: "[observability-audit.get.log-records-observability#perfil-membro] membro recebe 403",
      desligada:
        "[observability-audit.get.log-records-observability#flag-desligada] admin com a flag desligada recebe 403 FEATURE_DISABLED",
      arquivo:
        "[observability-audit.get.log-records-observability#storage-arquivo] com a flag ligada e storage em arquivo responde 409 LOG_9101",
    },
  } as const;

  for (const kind of ["audit", "observability"] as const) {
    const titles = TITLES[kind];

    test(titles.anonimo, async ({ request }) => {
      expect((await request.get(`${API_URL}/log-records/${kind}?${RANGE}`)).status()).toBe(401);
    });

    test(titles.membro, async ({ request }) => {
      const res = await request.get(`${API_URL}/log-records/${kind}?${RANGE}`, { headers: authHeaders(member) });
      expect(res.status()).toBe(403);
    });

    test(titles.desligada, async ({ request }) => {
      await setFlag(request, false);
      const res = await request.get(`${API_URL}/log-records/${kind}?${RANGE}`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    });

    test(titles.arquivo, async ({ request }) => {
      await setFlag(request, true);
      const res = await request.get(`${API_URL}/log-records/${kind}?${RANGE}`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(409);
      expect(JSON.stringify(await res.json())).toContain("LOG_9101");
    });
  }

  test("[observability-audit.delete.log-records-audit#perfil-anonimo] visitante não apaga registro (401)", async ({
    request,
  }) => {
    const res = await request.delete(
      `${API_URL}/log-records/audit/3f2504e0-4f89-41d3-9a0c-0305e82c3301?occurredAt=2026-11-19T10:00:00.000Z`,
    );
    expect(res.status()).toBe(401);
  });

  test("[observability-audit.delete.log-records-audit#perfil-membro] membro não apaga registro (403)", async ({
    request,
  }) => {
    const res = await request.delete(
      `${API_URL}/log-records/audit/3f2504e0-4f89-41d3-9a0c-0305e82c3301?occurredAt=2026-11-19T10:00:00.000Z`,
      { headers: authHeaders(member) },
    );
    expect(res.status()).toBe(403);
  });

  test("[observability-audit.post.auth-login#auditoria-sem-dado-pessoal] login recusado é auditado com o requestId do cabeçalho e sem dado pessoal", async ({
    request,
  }) => {
    const secretPassword = "SenhaQueNaoPodeVazar#9";
    const email = `auditoria.${Date.now()}@orfanatonib.test`;
    const res = await request.post(`${API_URL}/auth/login?token=nao-pode-vazar`, {
      data: { email, password: secretPassword },
    });
    expect([400, 401]).toContain(res.status());
    const requestId = res.headers()["x-request-id"];
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);

    // A gravação é assíncrona (fila de entrega): espera o arquivo.
    await expect
      .poll(() => readAuditLines().some((line) => line.requestId === requestId), { timeout: 10_000 })
      .toBe(true);

    const event = readAuditLines().find((line) => line.requestId === requestId) as AuditLine;
    // O mesmo evento repetido dentro da janela de 60 s vira `audit_repeat` (sem duplicar a linha de auditoria).
    expect(["audit", "audit_repeat"]).toContain(event.recordType);
    expect(event).toMatchObject({ actorType: "anonymous", actorId: null });
    expect(event).not.toHaveProperty("actorName");

    const raw = JSON.stringify(event);
    for (const forbidden of [secretPassword, email, "nao-pode-vazar", "127.0.0.1", "::1"]) {
      expect(raw).not.toContain(forbidden);
    }
  });
});
