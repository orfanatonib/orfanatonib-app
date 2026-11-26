/**
 * Formulário público "Fale Conosco" (`/contato`): tela → API → MySQL → tela, sem interceptação.
 * A falha de rede é a do próprio navegador (`setOffline`), não um mock.
 */
import type { Page } from "@playwright/test";

import { APP_URL } from "../../../playwright.live.config";
import { closeDb, queryAll } from "../support/db";
import { tagged } from "../support/factory";
import { massCount } from "../support/keep-data";
import { expect, test } from "../support/live";

interface ContactRow extends Record<string, unknown> {
  name: string;
  email: string;
  phone: string;
  message: string;
  read: number;
}

/** O nome só aceita letras e espaços: converte a tag da execução (que tem dígitos) em letras. */
const letters = (value: string): string =>
  value.replace(/[0-9]/g, (digit) => "abcdefghij"[Number(digit)]).replace(/[^A-Za-z]/g, " ");

const RUN_NAME = `Visitante ${letters(tagged("contato"))}`;
const SUCCESS = "Mensagem enviada com sucesso!";

const rowsByEmail = (email: string) =>
  queryAll<ContactRow>("SELECT name, email, phone, message, `read` FROM contacts WHERE email = ?", [email]);

const emailFor = (label: string): string => `${tagged(label)}@orfanatonib.test`;

async function fill(page: Page, values: { name?: string; email?: string; phone?: string; message?: string }) {
  const form = page.getByTestId("contact-form");
  if (values.name !== undefined) await form.getByLabel("Nome").fill(values.name);
  if (values.email !== undefined) await form.getByLabel("Email").fill(values.email);
  if (values.phone !== undefined) await form.getByLabel("Telefone").fill(values.phone);
  if (values.message !== undefined) await form.getByLabel("Mensagem").fill(values.message);
}

const submit = (page: Page) => page.getByRole("button", { name: "Enviar Mensagem" }).click();

const valid = (label: string) => ({
  name: RUN_NAME,
  email: emailFor(label),
  phone: "11987654321",
  message: `Mensagem enviada pela tela (${label}).`,
});

test.afterAll(async () => closeDb());

test.beforeEach(async ({ page }) => {
  await page.goto("/contato");
  await expect(page.getByTestId("contact-form")).toBeVisible();
  expect(page.url()).toBe(`${APP_URL}/contato`);
});

test("@responsive envia pela tela: grava no banco (e-mail e telefone normalizados), confirma e limpa o formulário", async ({ page }) => {
  const input = valid("feliz");
  await fill(page, { ...input, email: `  ${input.email.toUpperCase()} ` });
  await expect(page.getByTestId("contact-form").getByLabel("Telefone")).toHaveValue("(11) 98765-4321");
  await submit(page);

  await expect(page.getByText(SUCCESS)).toBeVisible();
  expect(await rowsByEmail(input.email)).toEqual([
    { name: input.name, email: input.email, phone: "11987654321", message: input.message, read: 0 },
  ]);
  for (const label of ["Nome", "Email", "Telefone", "Mensagem"]) {
    await expect(page.getByTestId("contact-form").getByLabel(label)).toHaveValue("");
  }
});

test("@responsive obrigatórios: cada campo vazio mostra a sua mensagem e nada é enviado", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/contact")) posts.push(request.url());
  });
  await submit(page);
  for (const message of ["Nome é obrigatório", "Email é obrigatório", "Telefone é obrigatório", "Mensagem é obrigatória"]) {
    await expect(page.getByText(message)).toBeVisible();
  }
  expect(posts).toEqual([]);
});

test("@responsive formatos inválidos: nome com número, e-mail sem domínio, telefone curto e mensagem curta", async ({ page }) => {
  await fill(page, { name: "Ana 2", email: "ana@", phone: "1198", message: "curta" });
  await submit(page);
  for (const message of [
    "Nome deve conter apenas letras",
    "Email inválido",
    "Telefone inválido (ex.: (11) 91234-5678)",
    "Mensagem deve ter pelo menos 10 caracteres",
  ]) {
    await expect(page.getByText(message)).toBeVisible();
  }
});

test("@responsive só espaços não vale como nome nem como mensagem (a API recusaria com erro genérico)", async ({ page }) => {
  const input = valid("espacos");
  await fill(page, { ...input, name: "     ", message: "              " });
  await submit(page);
  await expect(page.getByText("Nome é obrigatório")).toBeVisible();
  await expect(page.getByText("Mensagem é obrigatória")).toBeVisible();
  expect(await rowsByEmail(input.email)).toEqual([]);
});

test("@responsive limites da API aparecem no campo: nome acima de 255 e mensagem acima de 5000 caracteres", async ({ page }) => {
  const input = valid("limites");
  await fill(page, { ...input, name: "a".repeat(256), message: "m".repeat(5001) });
  await submit(page);
  await expect(page.getByText("Nome deve ter no máximo 255 caracteres")).toBeVisible();
  await expect(page.getByText("Mensagem deve ter no máximo 5000 caracteres")).toBeVisible();
  expect(await rowsByEmail(input.email)).toEqual([]);

  await fill(page, { name: "a".repeat(255), message: "m".repeat(5000) });
  await submit(page);
  await expect(page.getByText(SUCCESS)).toBeVisible();
  const [row] = await rowsByEmail(input.email);
  expect([row.name.length, row.message.length]).toEqual([255, 5000]);
});

test("@responsive falha no envio: mostra o erro, PRESERVA o que foi digitado e permite reenviar", async ({ page, context }) => {
  const first = valid("antes-da-falha");
  await fill(page, first);
  await submit(page);
  await expect(page.getByText(SUCCESS)).toBeVisible();

  const retry = valid("falha");
  await fill(page, retry);
  await context.setOffline(true);
  await submit(page);

  await expect(page.getByTestId("contact-error")).toBeVisible();
  // O sucesso do envio anterior não pode continuar na tela junto com o erro.
  await expect(page.getByText(SUCCESS)).toHaveCount(0);
  const form = page.getByTestId("contact-form");
  await expect(form.getByLabel("Nome")).toHaveValue(retry.name);
  await expect(form.getByLabel("Email")).toHaveValue(retry.email);
  await expect(form.getByLabel("Telefone")).toHaveValue("(11) 98765-4321");
  await expect(form.getByLabel("Mensagem")).toHaveValue(retry.message);
  expect(await rowsByEmail(retry.email)).toEqual([]);

  await context.setOffline(false);
  await submit(page);
  await expect(page.getByText(SUCCESS)).toBeVisible();
  await expect(page.getByTestId("contact-error")).toHaveCount(0);
  expect(await rowsByEmail(retry.email)).toHaveLength(1);
});

test("massa: 5 a 10 mensagens criadas pela tela ficam no banco", async ({ page }) => {
  const emails: string[] = [];
  for (let index = 0; index < massCount(); index += 1) {
    const input = valid(`massa-${index}`);
    emails.push(input.email);
    await fill(page, input);
    await submit(page);
    await expect(page.getByTestId("contact-form").getByLabel("Email")).toHaveValue("");
    await expect(page.getByText(SUCCESS)).toBeVisible();
  }
  for (const email of emails) expect(await rowsByEmail(email)).toHaveLength(1);
});
