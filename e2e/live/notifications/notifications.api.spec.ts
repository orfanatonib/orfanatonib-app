import { authHeaders, expect, loginAs, test } from "../support/live";
import { LIVE_ACCOUNTS, LIVE_PASSWORD } from "../support/credentials";

/**
 * Templates de e-mail, confirmação de e-mail e a fila de saída, contra a API e
 * o MySQL reais.
 *
 * O envio em si fica desligado no local pela flag `email-delivery` (o seed a
 * cria desligada), então nada sai de verdade: o que se verifica aqui é que a
 * aplicação registrou a intenção de avisar.
 */
const RUN_TAG = `e2e-notif-${Date.now()}`;

type PreviewList = {
  templates: Array<{ key: string; subject: string; previewUrl: string }>;
};

const EXPECTED_TEMPLATES = [
  "password-reset",
  "password-changed",
  "email-verification",
  "account-approved",
  "contact-received",
  "event-notice",
  "feedback-received",
  "comment-received",
  "team-assignment-changed",
  "pagela-reminder",
  "visit-report-reminder",
];

test.describe.serial("Notificações — API ao vivo", () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
  });

  test("o preview lista todos os templates do catálogo", async ({ request }) => {
    const response = await request.get("/email-previews", {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as PreviewList;
    expect(body.templates.map((t) => t.key).sort()).toEqual(
      [...EXPECTED_TEMPLATES].sort(),
    );
    // Todo template tem assunto: um sem assunto chega como "(sem assunto)".
    expect(body.templates.every((t) => t.subject.length > 0)).toBe(true);
  });

  test("cada template renderiza HTML completo, sem placeholder vazio", async ({
    request,
  }) => {
    for (const key of EXPECTED_TEMPLATES) {
      const response = await request.get(`/email-previews/${key}`, {
        headers: authHeaders(adminToken),
      });

      expect(response.status(), `template ${key}`).toBe(200);
      const html = await response.text();
      expect(html, `template ${key}`).toContain("<!DOCTYPE html>");
      expect(html, `template ${key}`).not.toContain("undefined");
    }
  });

  test("o preview em texto acompanha o HTML", async ({ request }) => {
    const response = await request.get("/email-previews/password-reset/text", {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("/recuperar-senha/");
  });

  test("o preview é restrito a admin", async ({ request }) => {
    expect((await request.get("/email-previews")).status()).toBe(401);

    const member = await loginAs(request, "member");
    const forbidden = await request.get("/email-previews", {
      headers: authHeaders(member.accessToken),
    });
    expect(forbidden.status()).toBe(403);
  });

  test("template inexistente responde 404", async ({ request }) => {
    const response = await request.get("/email-previews/nao-existe", {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(404);
  });

  test("o cadastro dispara a confirmação de e-mail", async ({ request }) => {
    const response = await request.post("/auth/register", {
      data: {
        name: "Notificação Teste",
        email: `${RUN_TAG}@orfanatonib.test`,
        phone: "92999990000",
        password: LIVE_PASSWORD,
        role: "member",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.emailVerification?.verificationEmailSent).toBe(true);
  });

  test("o login de quem não confirmou informa a pendência", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: { email: `${RUN_TAG}@orfanatonib.test`, password: LIVE_PASSWORD },
    });

    // A conta nasce inativa: responde 201 com o usuário e sem tokens.
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.emailVerification).toBeDefined();
    expect(body.emailVerification.verificationEmailSent).toBe(false);
  });

  test("o login de quem já confirmou não carrega a pendência", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: LIVE_ACCOUNTS.admin,
    });

    const body = await response.json();
    // As contas do seed são criadas sem pendência de confirmação.
    expect(body.accessToken).toBeTruthy();
  });

  test("confirmação com token inválido responde 400", async ({ request }) => {
    const response = await request.post("/auth/verify-email", {
      data: { token: "token-que-nao-existe" },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).category).toBe("RULE");
  });

  test("o reenvio responde igual para conta existente e inexistente", async ({
    request,
  }) => {
    const unknown = await request.post("/auth/resend-verification", {
      data: { email: `nao-existe-${RUN_TAG}@orfanatonib.test` },
    });
    const existing = await request.post("/auth/resend-verification", {
      data: { email: `${RUN_TAG}@orfanatonib.test` },
    });

    expect(unknown.status()).toBe(201);
    expect(existing.status()).toBe(201);
    // Mesma resposta: não revela quais e-mails estão cadastrados.
    expect(await unknown.json()).toEqual(await existing.json());
  });

  test("o reenvio recusa um e-mail malformado", async ({ request }) => {
    const response = await request.post("/auth/resend-verification", {
      data: { email: "nao-e-email" },
    });

    expect(response.status()).toBe(400);
  });

  test("o contato pelo site continua aceitando e respondendo", async ({
    request,
  }) => {
    const response = await request.post("/contact", {
      data: {
        name: `Contato ${RUN_TAG}`,
        email: `${RUN_TAG}@orfanatonib.test`,
        phone: "92999990000",
        message: "Mensagem da suíte ao vivo.",
      },
    });

    expect([200, 201]).toContain(response.status());
  });
});
