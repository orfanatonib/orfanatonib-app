import { test as setup } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { authHeaders, loginAs } from "./live";

/**
 * REGRA: toda rodada de E2E começa com TODAS as flags de disparo de e-mail (`email_*` e as legadas `email-*`)
 * desligadas — sem exceção, e mesmo as que já estavam desligadas são enviadas de novo (PATCH `enabled:false`).
 * A suíte cria usuário, publica, comenta, aprova e reprova; cada ação dispararia e-mail de verdade e estoura a cota.
 *
 * Roda uma vez, como projeto `setup`, antes de `live-api`, `live-ui` e `live-ui-mobile` (dependência no config).
 * Os testes que PROVAM e-mail ligam só a flag do caso no próprio `beforeAll` e restauram no `afterAll`.
 * As flags FICAM desligadas depois da rodada (lado seguro; um Ctrl+C não deixa nada religado de surpresa).
 *
 * Só roda contra API local: `E2E_ALLOW_REMOTE_FLAGS=1` libera outro destino.
 */
/** Qualquer chave que mencione e-mail (email_*, email-*, ou nome futuro fora do padrão). */
const EMAIL_KEY = /e-?mail/i;
const PAGE_SIZE = 100;

interface FlagRow {
  key: string;
  enabled?: boolean;
}
interface FlagPage {
  data?: FlagRow[];
  items?: FlagRow[];
  meta?: { totalPages?: number };
  totalPages?: number;
}

setup("desliga TODAS as flags de e-mail antes da rodada", async ({ request }) => {
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(API_URL);
  if (!isLocal && process.env.E2E_ALLOW_REMOTE_FLAGS !== "1") {
    throw new Error(`Recusado: ${API_URL} não é uma API local. Use E2E_ALLOW_REMOTE_FLAGS=1 se for de propósito.`);
  }

  const { accessToken } = await loginAs(request, "admin");
  const headers = authHeaders(accessToken);

  const listEmailFlags = async (): Promise<FlagRow[]> => {
    const found: FlagRow[] = [];
    for (let page = 1; page <= 20; page += 1) {
      const response = await request.get(`${API_URL}/feature-flags?page=${page}&limit=${PAGE_SIZE}`, { headers });
      if (!response.ok()) throw new Error(`Listar flags falhou: ${response.status()}`);
      const body = (await response.json()) as FlagPage;
      const rows = body.data ?? body.items ?? [];
      found.push(...rows.filter((row) => EMAIL_KEY.test(row.key)));
      const totalPages = body.meta?.totalPages ?? body.totalPages ?? 1;
      if (page >= totalPages || rows.length === 0) break;
    }
    return found;
  };

  const keys = (await listEmailFlags()).map((row) => row.key);
  if (keys.length === 0) throw new Error("Nenhuma flag email_* encontrada: a listagem mudou? Falhar alto evita gastar cota.");

  for (const key of keys) {
    const response = await request.patch(`${API_URL}/feature-flags/${key}`, { headers, data: { enabled: false } });
    if (!response.ok()) throw new Error(`Desligar ${key} falhou: ${response.status()} ${await response.text()}`);
  }
  const stillOn = (await listEmailFlags()).filter((row) => row.enabled !== false).map((row) => row.key);
  if (stillOn.length > 0) throw new Error(`Flags de e-mail ainda ligadas após desligar: ${stillOn.join(", ")}`);
  console.log(`[e2e] ${keys.length} flag(s) de e-mail desligada(s): ${keys.join(", ")}`);
});
