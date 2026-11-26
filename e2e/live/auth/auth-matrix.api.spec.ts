import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Matriz de autenticação (plano 06): flags desligadas ⇒ 403 FEATURE_DISABLED **e o
 * banco não muda**; sessão ausente, malformada ou adulterada ⇒ 401; validação ⇒ 400.
 * Cada teste liga/desliga a flag pela API e o `afterAll` restaura o estado original.
 */
const FLAGS = ["public_registration", "google_login", "password_recovery"] as const;
type FlagKey = (typeof FLAGS)[number];

test.describe.serial("Auth — matriz", () => {
  let admin: string;
  const original: Partial<Record<FlagKey, number>> = {};

  const setFlag = async (request: import("@playwright/test").APIRequestContext, key: FlagKey, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled } });
    expect(res.ok()).toBeTruthy();
  };

  /** Desliga a flag, chama o handler e prova: 403 FEATURE_DISABLED + a tabela observada não mudou. */
  const expectDisabled = async (
    request: import("@playwright/test").APIRequestContext,
    flag: FlagKey,
    call: () => Promise<import("@playwright/test").APIResponse>,
    table: string,
  ) => {
    await setFlag(request, flag, false);
    const before = await countRows(table);
    const res = await call();
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows(table)).toBe(before);
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const key of FLAGS) {
      const row = await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]);
      expect(row, `flag ${key} no catálogo`).not.toBeNull();
      original[key] = (row as { enabled: number }).enabled;
    }
  });

  test.afterAll(async ({ request }) => {
    for (const key of FLAGS) await setFlag(request, key, original[key] === 1);
    await closeDb();
  });

  test("[auth.post.auth-register#flag-desligada] POST /auth/register com public_registration desligada: 403 FEATURE_DISABLED e nenhum usuário criado", async ({
    request,
  }) => {
    await expectDisabled(
      request,
      "public_registration",
      () =>
        request.post(`${API_URL}/auth/register`, {
          data: { email: `matriz.${Date.now()}@orfanatonib.test`, password: "Aa1!aaaaaa", name: "Teste", phone: "11999999999" },
        }),
      "users",
    );
  });

  test("[auth.post.auth-complete-register#flag-desligada] POST /auth/complete-register com public_registration desligada: 403 FEATURE_DISABLED e nenhum usuário criado", async ({
    request,
  }) => {
    await expectDisabled(
      request,
      "public_registration",
      () => request.post(`${API_URL}/auth/complete-register`, { data: {} }),
      "users",
    );
  });

  test("[auth.post.auth-google#flag-desligada] POST /auth/google com google_login desligada: 403 FEATURE_DISABLED e nenhum usuário criado", async ({
    request,
  }) => {
    await expectDisabled(
      request,
      "google_login",
      () => request.post(`${API_URL}/auth/google`, { data: { idToken: "x" } }),
      "users",
    );
  });

  test("[auth.post.auth-forgot-password#flag-desligada] POST /auth/forgot-password com password_recovery desligada: 403 FEATURE_DISABLED e nenhum token criado", async ({
    request,
  }) => {
    await expectDisabled(
      request,
      "password_recovery",
      () => request.post(`${API_URL}/auth/forgot-password`, { data: { email: "e2e.member@orfanatonib.test" } }),
      "password_reset_tokens",
    );
  });

  test("[auth.get.auth-reset-password-validate#flag-desligada] GET /auth/reset-password/validate com password_recovery desligada: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    await expectDisabled(
      request,
      "password_recovery",
      () => request.get(`${API_URL}/auth/reset-password/validate?token=x`),
      "password_reset_tokens",
    );
  });

  test("[auth.post.auth-reset-password#flag-desligada] POST /auth/reset-password com password_recovery desligada: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await expectDisabled(
      request,
      "password_recovery",
      () => request.post(`${API_URL}/auth/reset-password`, { data: { token: "x", newPassword: "Aa1!aaaaaa" } }),
      "password_reset_tokens",
    );
  });

  test("[auth.post.auth-forgot-password#flag-ligada] com a flag religada o endpoint volta a responder (não é 403)", async ({
    request,
  }) => {
    await setFlag(request, "password_recovery", true);
    const res = await request.post(`${API_URL}/auth/forgot-password`, { data: { email: "nao.existe@orfanatonib.test" } });
    expect(res.status()).not.toBe(403);
  });

  test("[auth.get.auth-me#perfil-anonimo] GET /auth/me sem sessão: 401", async ({ request }) => {
    expect((await request.get(`${API_URL}/auth/me`)).status()).toBe(401);
  });

  test("[auth.post.auth-logout#perfil-anonimo] POST /auth/logout sem sessão: 401", async ({ request }) => {
    expect((await request.post(`${API_URL}/auth/logout`)).status()).toBe(401);
  });

  test("[auth.get.auth-me#token-malformado] token malformado: 401", async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`, { headers: { Authorization: "Bearer isto.nao.e-um-jwt" } });
    expect(res.status()).toBe(401);
  });

  test("[auth.get.auth-me#token-adulterado] token com a assinatura alterada: 401", async ({ request }) => {
    const [head, payload, sig] = admin.split(".");
    const forged = `${head}.${payload}.${sig.slice(0, -2)}${sig.endsWith("AA") ? "BB" : "AA"}`;
    const res = await request.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${forged}` } });
    expect(res.status()).toBe(401);
  });

  test("[auth.get.auth-me#token-sem-assinatura] token alg=none: 401", async ({ request }) => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const noneToken = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "x", role: "admin" })}.`;
    const res = await request.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${noneToken}` } });
    expect(res.status()).toBe(401);
  });

  test("[auth.post.auth-login#validacao] login sem senha: 400 e nada é gravado", async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, { data: { email: "e2e.member@orfanatonib.test" } });
    expect(res.status()).toBe(400);
  });

  test("[auth.post.auth-login#credenciais-invalidas] senha errada: 401 sem revelar se o e-mail existe", async ({ request }) => {
    const wrongPassword = await request.post(`${API_URL}/auth/login`, {
      data: { email: "e2e.member@orfanatonib.test", password: "SenhaErrada#1" },
    });
    const unknownEmail = await request.post(`${API_URL}/auth/login`, {
      data: { email: "nao.existe@orfanatonib.test", password: "SenhaErrada#1" },
    });
    expect(wrongPassword.status()).toBe(401);
    expect(unknownEmail.status()).toBe(401);
    const a = (await wrongPassword.json()) as { message: unknown };
    const b = (await unknownEmail.json()) as { message: unknown };
    expect(a.message, "mesma mensagem para e-mail inexistente e senha errada").toEqual(b.message);
  });

  test("[auth.post.auth-refresh#token-invalido] refresh com token inválido: 401", async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/refresh`, { data: { refreshToken: "invalido" } });
    expect(res.status()).toBe(401);
  });
});
