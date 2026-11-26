import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows } from "../support/db";
import { expect, test } from "../support/live";

/** A isca anti-robô do formulário público: preenchida ⇒ aparente sucesso, nada gravado. */
const message = { name: "Ana E2E", email: "ana.e2e@orfanatonib.test", phone: "11999999999", message: "mensagem e2e" };

test.afterAll(async () => closeDb());

test("[contact.post.contact#validacao] isca preenchida: 201 aparente e NENHUMA linha nova em contacts", async ({ request }) => {
  const before = await countRows("contacts");
  const res = await request.post(`${API_URL}/contact`, { data: { ...message, website: "http://spam.example" } });
  expect(res.status()).toBe(201);
  expect(((await res.json()) as { id: string }).id).toBeTruthy();
  expect(await countRows("contacts")).toBe(before);
});
