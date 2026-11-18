import { authHeaders, expect, loginAs, test } from "../support/live";
import { LIVE_ACCOUNTS, LIVE_PASSWORD } from "../support/credentials";

/**
 * Percorre `/auth` contra a API real e o MySQL real.
 *
 * O contrato destas rotas é o que o `authSlice` e o interceptor do axios
 * consomem: uma mudança de forma ou de status aqui derruba a sessão do
 * frontend inteiro. Por isso os status são afirmados um a um.
 */
type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  completed: boolean;
  commonUser: boolean;
};
type LoginBody = {
  message: string;
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
};

const RUN_TAG = `e2e-auth-${Date.now()}`;

test.describe.serial("Auth — API ao vivo", () => {
  let tokens: { accessToken: string; refreshToken: string };

  test.beforeAll(async ({ request }) => {
    const session = await loginAs(request, "admin");
    tokens = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  });

  test("login devolve usuário e par de tokens", async ({ request }) => {
    const response = await request.post("/auth/login", {
      data: LIVE_ACCOUNTS.admin,
    });

    expect(response.status()).toBe(201);
    const body = (await response.json()) as LoginBody;
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.email).toBe(LIVE_ACCOUNTS.admin.email);
  });

  test("login nunca devolve o hash da senha nem o refresh guardado", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: LIVE_ACCOUNTS.admin,
    });
    const body = (await response.json()) as LoginBody;

    expect(body.user).not.toHaveProperty("password");
    expect(body.user).not.toHaveProperty("refreshToken");
  });

  test("senha errada e e-mail inexistente respondem o mesmo 401", async ({
    request,
  }) => {
    const wrongPassword = await request.post("/auth/login", {
      data: { email: LIVE_ACCOUNTS.admin.email, password: "errada" },
    });
    const unknownEmail = await request.post("/auth/login", {
      data: { email: `${RUN_TAG}@orfanatonib.test`, password: LIVE_PASSWORD },
    });

    expect(wrongPassword.status()).toBe(401);
    expect(unknownEmail.status()).toBe(401);
    // A mesma mensagem nos dois: não revela quais e-mails existem.
    expect((await wrongPassword.json()).message).toBe(
      (await unknownEmail.json()).message,
    );
  });

  test("payload inválido responde 400 com os campos que falharam", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: { email: "nao-e-email" },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.category).toBe("RULE");
    expect(
      (body.details as Array<{ field: string }>).map((d) => d.field).sort(),
    ).toEqual(["email", "password"]);
  });

  test("me exige token e devolve a sessão do ator", async ({ request }) => {
    expect((await request.get("/auth/me")).status()).toBe(401);

    const response = await request.get("/auth/me", {
      headers: authHeaders(tokens.accessToken),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.email).toBe(LIVE_ACCOUNTS.admin.email);
    expect(body).toHaveProperty("image");
    expect(body).toHaveProperty("memberProfile");
    expect(body).toHaveProperty("leaderProfile");
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("refreshToken");
  });

  test("me de um líder traz o perfil com as equipes", async ({ request }) => {
    const leader = await loginAs(request, "leader");

    const response = await request.get("/auth/me", {
      headers: authHeaders(leader.accessToken),
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).role).toBe("leader");
  });

  test("refresh troca o par de tokens", async ({ request }) => {
    const session = await loginAs(request, "member");

    const response = await request.post("/auth/refresh", {
      data: { refreshToken: session.refreshToken },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  test("refresh recusa token ausente, inválido e já rotacionado", async ({
    request,
  }) => {
    const session = await loginAs(request, "member");

    expect((await request.post("/auth/refresh", { data: {} })).status()).toBe(
      401,
    );
    expect(
      (
        await request.post("/auth/refresh", { data: { refreshToken: "lixo" } })
      ).status(),
    ).toBe(401);

    // Rotaciona uma vez; o refresh anterior deixa de valer.
    await request.post("/auth/refresh", {
      data: { refreshToken: session.refreshToken },
    });
    const reused = await request.post("/auth/refresh", {
      data: { refreshToken: session.refreshToken },
    });

    expect(reused.status()).toBe(401);
  });

  test("logout invalida o refresh guardado", async ({ request }) => {
    const session = await loginAs(request, "member");

    const loggedOut = await request.post("/auth/logout", {
      headers: authHeaders(session.accessToken),
    });
    expect(loggedOut.status()).toBe(201);

    const afterLogout = await request.post("/auth/refresh", {
      data: { refreshToken: session.refreshToken },
    });
    expect(afterLogout.status()).toBe(401);
  });

  test("google recusa uma credencial que não é do Google", async ({
    request,
  }) => {
    const response = await request.post("/auth/google", {
      data: { token: "nao-e-um-id-token" },
    });

    expect(response.status()).toBe(401);
    expect((await response.json()).message).toContain("Google");
  });

  test("registro com e-mail já cadastrado responde 409", async ({ request }) => {
    const response = await request.post("/auth/register", {
      data: {
        name: "Conflito",
        email: LIVE_ACCOUNTS.admin.email,
        phone: "92999990000",
        password: LIVE_PASSWORD,
        role: "member",
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.category).toBe("BUSINESS");
    expect(body.message).toBe("User already exists");
  });

  test("complete-register de e-mail sem conta responde 404", async ({
    request,
  }) => {
    const response = await request.post("/auth/complete-register", {
      data: {
        email: `${RUN_TAG}@orfanatonib.test`,
        name: "Sem conta",
        phone: "92999990000",
      },
    });

    expect(response.status()).toBe(404);
  });

  test("recuperação de senha recusa e-mail desconhecido e token inválido", async ({
    request,
  }) => {
    expect(
      (
        await request.post("/auth/forgot-password", {
          data: { email: `${RUN_TAG}@orfanatonib.test` },
        })
      ).status(),
    ).toBe(400);

    expect(
      (await request.get("/auth/reset-password/validate?token=lixo")).status(),
    ).toBe(400);

    expect(
      (
        await request.post("/auth/reset-password", {
          data: { token: "lixo", newPassword: LIVE_PASSWORD },
        })
      ).status(),
    ).toBe(400);
  });

  test("um token de acesso vale nas rotas protegidas de outros módulos", async ({
    request,
  }) => {
    const response = await request.get("/shelters/simple", {
      headers: authHeaders(tokens.accessToken),
    });

    expect(response.status()).toBe(200);
  });
});
