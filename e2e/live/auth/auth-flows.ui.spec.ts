import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows } from "../support/db";
import { expect, test } from "../support/live";
import {
  ACCOUNT_PASSWORD,
  NEW_PASSWORD,
  adminSession,
  authSnapshot,
  createAccount,
  flagStates,
  registerPublic,
  removeAccounts,
  awaitResetTokens,
  completionTokenFor,
  resetTokens,
  settleBackgroundWork,
  setFlag,
  uniqueEmail,
  userByEmail,
  userRow,
  verificationTokens,
  type Account,
  type AuthFlag,
} from "./support";

/**
 * Telas públicas de autenticação (plano 06) contra a pilha real: cadastro, esqueci a senha,
 * redefinição, confirmação de e-mail e flags. Cada ação na tela é provada por SELECT; os
 * negativos mostram o erro na tela e deixam o banco igual. Contas criadas pela API e apagadas no fim.
 */
const MIN_TOUCH_TARGET = 44;

test.describe.serial("Auth — telas públicas", () => {
  const created: string[] = [];
  const flagsBefore: Partial<Record<AuthFlag, boolean>> = {};
  let admin: string;

  const track = (account: Account): Account => {
    created.push(account.id);
    return account;
  };

  test.beforeEach(async ({ request }) => {
    admin = (await adminSession(request)).accessToken;
  });

  test.afterAll(async ({ request }) => {
    const token = (await adminSession(request)).accessToken;
    for (const [key, enabled] of Object.entries(flagsBefore) as Array<[AuthFlag, boolean]>) {
      await setFlag(request, token, key, enabled);
    }
    await removeAccounts(request, token, created);
    await closeDb();
  });

  const fillRegister = async (page: Page, email: string): Promise<void> => {
    await page.getByTestId("register-name").fill("Maria da Silva");
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-confirm-email").fill(email);
    await page.getByTestId("register-phone").fill("11999990000");
    await page.getByLabel("Você é").click();
    await page.getByTestId("register-role-member").click();
    await page.getByTestId("register-password").fill(ACCOUNT_PASSWORD);
    await page.getByTestId("register-confirm-password").fill(ACCOUNT_PASSWORD);
  };

  const noHorizontalScroll = async (page: Page): Promise<void> => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  };

  const expectTouchTarget = async (page: Page, testId: string): Promise<void> => {
    const box = await page.getByTestId(testId).boundingBox();
    expect(box, `${testId} visível`).not.toBeNull();
    expect(box?.height ?? 0, `${testId} altura`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  };

  const issueResetToken = async (request: APIRequestContext) => {
    const account = track(await createAccount(request, admin, "member"));
    const res = await request.post(`${API_URL}/auth/forgot-password`, { data: { email: account.email } });
    expect(res.status()).toBe(201);
    return { account, token: (await awaitResetTokens(account.id))[0].token };
  };

  /* ------------------------------ cadastro ------------------------------ */

  test("[auth.post.auth-register#ui-feliz] cadastro pela tela: mostra a confirmação e o banco tem a conta inativa com token de verificação", async ({ page }) => {
    const email = uniqueEmail("ui");
    await page.goto("/cadastrar");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await fillRegister(page, email);
    await expect(page.getByTestId("register-submit")).toBeEnabled();
    await page.getByTestId("register-submit").click();

    await expect(page.getByTestId("register-success")).toBeVisible({ timeout: 20_000 });
    const row = await userByEmail(email);
    expect(row).not.toBeNull();
    created.push(row!.id);
    expect(row).toMatchObject({ role: "member", active: 0, completed: 1, name: "Maria Da Silva", phone: "11999990000" });
    expect(await verificationTokens(row!.id)).toHaveLength(1);
  });

  test("[auth.post.auth-register#ui-validacao] formulário inválido: botão desligado, erros na tela e nenhuma linha criada", async ({ page }) => {
    const before = await authSnapshot();
    await page.goto("/cadastrar");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("register-email").fill("nao-e-email");
    await page.getByTestId("register-password").fill("123");
    await page.getByTestId("register-confirm-password").fill("456");
    await expect(page.getByTestId("register-submit")).toBeDisabled();
    await expect(page.getByText("Email inválido")).toBeVisible();
    await expect(page.getByText("Senha deve ter pelo menos 6 caracteres")).toBeVisible();
    expect(await authSnapshot()).toEqual(before);
  });

  test("[auth.post.auth-register#ui-conflito-na-tela] e-mail já cadastrado: a tela mostra o erro da API e o banco não ganha usuário", async ({ page, request }) => {
    const { account } = await registerPublic(request);
    created.push(account.id);
    const before = await authSnapshot();

    await page.goto("/cadastrar");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await fillRegister(page, account.email);
    await page.getByTestId("register-submit").click();

    await expect(page.getByTestId("register-error")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("register-success")).toHaveCount(0);
    expect(await authSnapshot()).toEqual(before);
  });

  /* ------------------------------ esqueci a senha / redefinição ------------------------------ */

  test("[auth.post.auth-forgot-password#ui-feliz] 'Esqueci minha senha' no login leva à tela, que cria o token no banco", async ({ page, request }) => {
    const account = track(await createAccount(request, admin, "member"));
    await page.goto("/login");
    await page.getByTestId("login-forgot-password").click();
    await expect(page).toHaveURL(/\/esqueci-minha-senha$/);

    await page.getByTestId("forgot-password-email").fill(account.email);
    await page.getByTestId("forgot-password-submit").click();
    await expect(page.getByTestId("forgot-password-success")).toBeVisible({ timeout: 20_000 });
    expect(await awaitResetTokens(account.id)).toHaveLength(1);
  });

  test("[auth.post.auth-forgot-password#ui-erro-na-tela] e-mail sem conta: a tela mostra a MESMA mensagem genérica de sucesso (sem afirmar inexistência) e nenhum token é criado", async ({ page }) => {
    const before = await countRows("password_reset_tokens");
    await page.goto("/esqueci-minha-senha");
    await page.getByTestId("forgot-password-email").fill(uniqueEmail("fantasma"));
    await page.getByTestId("forgot-password-submit").click();
    await expect(page.getByTestId("forgot-password-success")).toContainText("Se o e-mail estiver cadastrado", { timeout: 20_000 });
    await expect(page.getByTestId("forgot-password-error")).toHaveCount(0);
    await expect(page.getByText(/não encontrado/i)).toHaveCount(0);
    await settleBackgroundWork();
    expect(await countRows("password_reset_tokens")).toBe(before);
  });

  test("[auth.post.auth-reset-password#ui-feliz] link do e-mail: define a senha pela tela, o token some do banco e a senha nova entra", async ({ page, request }) => {
    const { account, token } = await issueResetToken(request);
    await page.goto(`/recuperar-senha/${token}`);
    await expect(page.getByTestId("reset-password-form")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/recuperar-senha$/);

    await page.getByTestId("reset-password-new").fill(NEW_PASSWORD);
    await page.getByTestId("reset-password-confirm").fill(NEW_PASSWORD);
    await page.getByTestId("reset-password-submit").click();
    await expect(page.getByTestId("reset-password-success")).toBeVisible({ timeout: 20_000 });

    expect(await resetTokens(account.id)).toHaveLength(0);
    const login = await request.post(`${API_URL}/auth/login`, { data: { email: account.email, password: NEW_PASSWORD } });
    expect(login.status()).toBe(201);
  });

  test("[auth.post.auth-reset-password#ui-token-usado] link já usado: a tela mostra link inválido e a senha não muda", async ({ page, request }) => {
    const { account, token } = await issueResetToken(request);
    await request.post(`${API_URL}/auth/reset-password`, { data: { token, newPassword: NEW_PASSWORD } });
    const hash = (await userRow(account.id)).password;

    await page.goto(`/recuperar-senha/${token}`);
    await expect(page.getByTestId("reset-password-invalid")).toBeVisible({ timeout: 20_000 });
    expect((await userRow(account.id)).password).toBe(hash);
  });

  /* ------------------------------ confirmação de e-mail ------------------------------ */

  test("[auth.post.auth-verify-email#ui-feliz] link de confirmação: a tela confirma, o banco marca o e-mail e o segundo acesso ao link falha", async ({ page, request }) => {
    const { account } = await registerPublic(request);
    created.push(account.id);
    const token = (await verificationTokens(account.id))[0].token;

    await page.goto(`/verificar-email/${token}`);
    await expect(page.getByTestId("confirm-email-confirmed")).toBeVisible({ timeout: 20_000 });
    const verifiedAt = (await userRow(account.id)).emailVerifiedAt;
    expect(verifiedAt).not.toBeNull();

    await page.goto(`/verificar-email/${token}`);
    await expect(page.getByTestId("confirm-email-failed")).toBeVisible({ timeout: 20_000 });
    expect((await userRow(account.id)).emailVerifiedAt).toBe(verifiedAt);
  });

  /* ------------------------------ flags ------------------------------ */

  test("[auth.post.auth-register#ui-flag-desligada] public_registration desligada: 'Cadastre-se' some do login, /cadastrar volta para a Home e a API recusa", async ({ page, request }) => {
    Object.assign(flagsBefore, { public_registration: (await flagStates()).public_registration });
    await setFlag(request, admin, "public_registration", false);
    const before = await authSnapshot();

    await page.goto("/login");
    await expect(page.getByTestId("login-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("login-submit")).toBeVisible();
    await expect(page.getByTestId("login-register")).toHaveCount(0);

    await page.goto("/cadastrar");
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByTestId("register-form")).toHaveCount(0);

    const res = await request.post(`${API_URL}/auth/register`, { data: { email: uniqueEmail("off"), password: ACCOUNT_PASSWORD, name: "X", phone: "11999990000", role: "member" } });
    expect(res.status()).toBe(403);
    expect(await authSnapshot()).toEqual(before);

    await setFlag(request, admin, "public_registration", true);
    await page.goto("/login");
    await expect(page.getByTestId("login-register")).toBeVisible({ timeout: 20_000 });
  });

  test("[auth.post.auth-forgot-password#ui-flag-desligada] password_recovery desligada: 'Esqueci minha senha' some, a tela e o link do e-mail voltam para a Home", async ({ page, request }) => {
    Object.assign(flagsBefore, { password_recovery: (await flagStates()).password_recovery });
    const { token } = await issueResetToken(request);
    await setFlag(request, admin, "password_recovery", false);

    await page.goto("/login");
    await expect(page.getByTestId("login-submit")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("login-forgot-password")).toHaveCount(0);

    await page.goto("/esqueci-minha-senha");
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await page.goto(`/recuperar-senha/${token}`);
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

    await setFlag(request, admin, "password_recovery", true);
    await page.goto("/login");
    await expect(page.getByTestId("login-forgot-password")).toBeVisible({ timeout: 20_000 });
  });

  /* ------------------------------ mobile 375×812 ------------------------------ */

  test("[auth.get.login#mobile-alvos] @mobile login em 375×812: sem rolagem horizontal e botões com 44 px de altura", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-page")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    for (const id of ["login-submit", "login-register", "login-forgot-password"]) await expectTouchTarget(page, id);
  });

  test("[auth.get.register#mobile] @mobile cadastro em 375×812: fluxo feliz sem rolagem horizontal, alvos de 44 px e conta no banco", async ({ page }) => {
    const email = uniqueEmail("mobile");
    await page.goto("/cadastrar");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await fillRegister(page, email);
    for (const id of ["register-submit", "register-login-link"]) await expectTouchTarget(page, id);
    await page.getByTestId("register-submit").click();
    await expect(page.getByTestId("register-success")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await expectTouchTarget(page, "register-back-to-login");

    const row = await userByEmail(email);
    expect(row).not.toBeNull();
    created.push(row!.id);
  });

  test("[auth.get.esqueci-senha#mobile] @mobile esqueci a senha em 375×812: sem rolagem horizontal, alvos de 44 px e token no banco", async ({ page, request }) => {
    const account = track(await createAccount(request, admin, "member"));
    await page.goto("/esqueci-minha-senha");
    await expect(page.getByTestId("forgot-password-page")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await page.getByTestId("forgot-password-email").fill(account.email);
    for (const id of ["forgot-password-submit", "forgot-password-back"]) await expectTouchTarget(page, id);
    await page.getByTestId("forgot-password-submit").click();
    await expect(page.getByTestId("forgot-password-success")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await expect(page.getByTestId("forgot-password-success")).toContainText("Se o e-mail estiver cadastrado");
    expect(await awaitResetTokens(account.id)).toHaveLength(1);
  });

  /* ------------------------------ cadastro pelo Google (complemento) ------------------------------ */

  /**
   * O Google real não entra nos E2E. O estado que o login Google deixaria na memória da aba
   * (nome, e-mail e token de conclusão) é posto no MESMO store da aplicação; o token é válido e a
   * API é a real. Nada disso vai para o localStorage.
   */
  const seedGoogleUser = async (page: Page, googleUser: { name: string; email: string; completionToken?: string }): Promise<void> => {
    await page.evaluate((payload) => {
      const store = (window as Window & { __APP_STORE__?: { dispatch: (action: { type: string; payload: unknown }) => unknown } }).__APP_STORE__;
      if (!store) throw new Error("store do dev server não exposto (__APP_STORE__)");
      store.dispatch({ type: "auth/setGoogleUser", payload });
    }, googleUser);
  };

  const newGooglePending = async (request: APIRequestContext): Promise<Account> =>
    track(await createAccount(request, admin, "member", { completed: false, label: "google" }));

  const fillGoogleComplement = async (page: Page): Promise<void> => {
    await page.getByTestId("register-phone").fill("11988887777");
    await page.getByLabel("Você é").click();
    await page.getByTestId("register-role-leader").click();
  };

  test("[auth.post.auth-complete-register#ui-feliz] /cadastrar-google com o token em memória: completa a conta pendente e o banco prova (e-mail não vai no corpo)", async ({ page, request }) => {
    const pending = await newGooglePending(request);
    const bodies: string[] = [];
    page.on("request", (req) => {
      if (req.url().endsWith("/auth/complete-register")) bodies.push(req.postData() ?? "");
    });
    await page.goto("/cadastrar-google");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await seedGoogleUser(page, { name: "Maria Google", email: pending.email, completionToken: completionTokenFor(pending.id) });
    await expect(page.getByTestId("register-email")).toHaveValue(pending.email);
    await fillGoogleComplement(page);
    await expect(page.getByTestId("register-submit")).toBeEnabled();
    await page.getByTestId("register-submit").click();

    await expect(page.getByTestId("register-success")).toBeVisible({ timeout: 20_000 });
    expect(await userRow(pending.id)).toMatchObject({ completed: 1, phone: "11988887777", role: "leader" });
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toContain("completionToken");
    expect(bodies[0]).not.toContain(pending.email);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("completionToken");
  });

  test("[auth.post.auth-complete-register#ui-token-ausente] /cadastrar-google sem token (página recarregada): a tela pede novo login com o Google e a conta pendente não muda", async ({ page, request }) => {
    const pending = await newGooglePending(request);
    const before = await userRow(pending.id);
    await page.goto("/cadastrar-google");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await seedGoogleUser(page, { name: "Maria Google", email: pending.email });
    await expect(page.getByTestId("register-email")).toHaveValue(pending.email);
    await fillGoogleComplement(page);
    await page.getByTestId("register-submit").click();
    await expect(page.getByTestId("register-error")).toContainText("Google", { timeout: 20_000 });
    await expect(page.getByTestId("register-success")).toHaveCount(0);
    expect(await userRow(pending.id)).toEqual(before);
  });

  test("[auth.get.cadastrar-google#mobile] @mobile /cadastrar-google em 375×812: sem rolagem horizontal, alvos de 44 px e a conta pendente completa no banco", async ({ page, request }) => {
    const pending = await newGooglePending(request);
    await page.goto("/cadastrar-google");
    await expect(page.getByTestId("register-form")).toBeVisible({ timeout: 20_000 });
    await seedGoogleUser(page, { name: "Maria Google", email: pending.email, completionToken: completionTokenFor(pending.id) });
    await noHorizontalScroll(page);
    await fillGoogleComplement(page);
    for (const id of ["register-submit", "register-login-link"]) await expectTouchTarget(page, id);
    await page.getByTestId("register-submit").click();
    await expect(page.getByTestId("register-success")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await expectTouchTarget(page, "register-back-to-login");
    expect(await userRow(pending.id)).toMatchObject({ completed: 1, phone: "11988887777" });
  });

  test("[auth.get.recuperar-senha#mobile] @mobile redefinir senha em 375×812: sem rolagem horizontal, alvo de 44 px e senha trocada no banco", async ({ page, request }) => {
    const { account, token } = await issueResetToken(request);
    await page.goto(`/recuperar-senha/${token}`);
    await expect(page.getByTestId("reset-password-form")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await expectTouchTarget(page, "reset-password-submit");
    const hash = (await userRow(account.id)).password;
    await page.getByTestId("reset-password-new").fill(NEW_PASSWORD);
    await page.getByTestId("reset-password-confirm").fill(NEW_PASSWORD);
    await page.getByTestId("reset-password-submit").click();
    await expect(page.getByTestId("reset-password-success")).toBeVisible({ timeout: 20_000 });
    expect((await userRow(account.id)).password).not.toBe(hash);
  });
});
