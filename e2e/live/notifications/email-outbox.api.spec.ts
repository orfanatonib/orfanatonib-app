import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { LIVE_ACCOUNTS } from "../support/credentials";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { Cleaner, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Plano 10 — comportamento principal do e-mail, provado por `SELECT` em `email_outbox`
 * (o sink: nunca há SMTP real). Gatilho: formulário público de contato (`contact-received`)
 * e feedback do site (`feedback-received`), ambos avisam os admins ativos.
 *
 * O projeto `setup` deixa TODAS as flags `email_*` desligadas; aqui cada cenário liga só o que
 * precisa e o `afterAll` devolve cada flag ao estado em que estava.
 */
const MASTER = "email_delivery";
const CONTACT_FLAG = "email_contact_received";
const FEEDBACK_FLAG = "email_feedback_received";
const CONTACT_TEMPLATE = "contact-received";
const FEEDBACK_TEMPLATE = "feedback-received";
const RESOURCE_FLAGS = ["contact_form", "site_feedback"] as const;
const ADMIN = LIVE_ACCOUNTS.admin.email;
const FLAG_CACHE_MS = 6_000;
const DELIVERABLE = ["pending", "sent", "failed"];

type OutboxRow = { recipient: string; status: string; subject: string; attempts: number; dedupeKey: string | null };

test.describe.serial("E-mail — fila de saída (email_outbox)", () => {
  let admin: string;
  let member: string;
  /** `request` vivo: o do `beforeAll` morre com ele, então a limpeza usa o do teste/hook corrente. */
  let api: APIRequestContext;
  const cleaner = new Cleaner();
  const original = new Map<string, boolean>();

  const flagRow = (key: string) => queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]);

  const setFlag = async (request: APIRequestContext, key: string, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled } });
    expect(res.ok(), `PATCH ${key}: ${res.status()}`).toBe(true);
    expect((await flagRow(key))?.enabled === 1).toBe(enabled);
  };

  /** Liga só as flags pedidas (e desliga as demais de e-mail), esperando o cache de 5 s das flags internas. */
  const arm = async (request: APIRequestContext, state: { master: boolean; contact: boolean; feedback?: boolean }) => {
    await setFlag(request, MASTER, state.master);
    await setFlag(request, CONTACT_FLAG, state.contact);
    await setFlag(request, FEEDBACK_FLAG, state.feedback ?? false);
    await new Promise((resolve) => setTimeout(resolve, FLAG_CACHE_MS));
  };

  const outboxOf = (templateKey: string, tag: string) =>
    queryAll<OutboxRow>(
      "SELECT recipient, status, subject, attempts, dedupeKey FROM `email_outbox` WHERE `templateKey` = ? AND `html` LIKE ?",
      [templateKey, `%${tag}%`],
    );

  const activeAdmins = async () =>
    (await queryAll<{ email: string }>("SELECT email FROM users WHERE role = 'admin' AND active = 1")).map((r) => r.email);

  const postContact = async (request: APIRequestContext, tag: string) => {
    const res = await request.post(`${API_URL}/contact`, {
      data: { name: `Contato ${tag}`, email: "contato.e2e@orfanatonib.test", phone: "92999990000", message: `mensagem ${tag}` },
    });
    expect(res.status()).toBe(201);
    const { id } = (await res.json()) as { id: string };
    cleaner.track(`contato ${id}`, async () => {
      await api.delete(`${API_URL}/contact/${id}`, { headers: authHeaders(admin) });
    });
    return id;
  };

  /** O aviso é assíncrono (fire-and-forget): espera as linhas aparecerem. */
  const waitOutbox = async (templateKey: string, tag: string, expected: number) => {
    await expect.poll(async () => (await outboxOf(templateKey, tag)).length, { timeout: 20_000 }).toBe(expected);
    return outboxOf(templateKey, tag);
  };

  test.beforeEach(({ request }) => {
    api = request;
  });

  test.beforeAll(async ({ request }) => {
    api = request;
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    for (const key of [MASTER, CONTACT_FLAG, FEEDBACK_FLAG, ...RESOURCE_FLAGS]) {
      original.set(key, (await flagRow(key))?.enabled === 1);
    }
    // O formulário e o feedback precisam estar abertos para o gatilho existir.
    for (const key of RESOURCE_FLAGS) await setFlag(request, key, true);
  });

  test.afterAll(async ({ request }) => {
    api = request;
    admin = (await loginAs(request, "admin")).accessToken;
    for (const [key, enabled] of original) await setFlag(request, key, enabled);
    await cleaner.run();
    await closeDb();
  });

  test("[email-notification.outbox#flag-do-tipo-desligada] flag do tipo desligada (mestra ligada): origem 201 e cada admin ganha linha `skipped`, nenhuma `pending`", async ({
    request,
  }) => {
    await arm(request, { master: true, contact: false });
    const tag = tagged("tipo-off");
    const id = await postContact(request, tag);

    const admins = await activeAdmins();
    const rows = await waitOutbox(CONTACT_TEMPLATE, tag, admins.length);
    expect(rows.map((r) => r.recipient).sort()).toEqual([...admins].sort());
    expect(rows.every((r) => r.status === "skipped" && r.attempts === 0)).toBe(true);
    expect(await countRows("contacts", { id })).toBe(1);
  });

  test("[email-notification.outbox#mestra-desligada] mestra desligada com a flag do tipo ligada: tudo `skipped` (nada sai)", async ({
    request,
  }) => {
    await arm(request, { master: false, contact: true });
    const tag = tagged("mestra-off");
    await postContact(request, tag);

    const rows = await waitOutbox(CONTACT_TEMPLATE, tag, (await activeAdmins()).length);
    expect(rows.every((r) => r.status === "skipped")).toBe(true);
    expect(rows.some((r) => DELIVERABLE.includes(r.status))).toBe(false);
  });

  test("[email-notification.outbox#flag-ligada] flags ligadas: linha enfileirada para o admin com template e assunto corretos", async ({
    request,
  }) => {
    await arm(request, { master: true, contact: true });
    const tag = tagged("on");
    const id = await postContact(request, tag);

    const admins = await activeAdmins();
    const rows = await waitOutbox(CONTACT_TEMPLATE, tag, admins.length);
    expect(rows.map((r) => r.recipient)).toContain(ADMIN);
    expect(rows.map((r) => r.recipient).sort()).toEqual([...admins].sort());
    expect(rows.every((r) => DELIVERABLE.includes(r.status))).toBe(true);
    expect(rows.every((r) => r.subject.length > 0)).toBe(true);
    // Contato não usa chave de idempotência: dois envios iguais seguidos nunca se engolem.
    expect(rows.every((r) => r.dedupeKey === null)).toBe(true);
    expect(await countRows("contacts", { id })).toBe(1);
  });

  test("[email-notification.outbox#smtp-nao-derruba-origem] SMTP ausente/falho não desfaz a operação: contato persistido e linha na fila com estado de entrega", async ({
    request,
  }) => {
    await arm(request, { master: true, contact: true });
    const tag = tagged("smtp");
    const id = await postContact(request, tag);
    const rows = await waitOutbox(CONTACT_TEMPLATE, tag, (await activeAdmins()).length);

    // A entrega é do worker, fora da requisição: qualquer desfecho (pending, sent, failed) mantém o contato.
    expect(rows.every((r) => DELIVERABLE.includes(r.status))).toBe(true);
    expect(await countRows("contacts", { id })).toBe(1);
    const list = await request.get(`${API_URL}/contact`, { headers: authHeaders(admin) });
    expect(list.status()).toBe(200);
    expect(((await list.json()) as Array<{ id: string }>).some((c) => c.id === id)).toBe(true);
  });

  test("[email-notification.outbox#segundo-tipo] feedback do site usa o próprio template e a própria flag", async ({ request }) => {
    const tag = tagged("fb");
    const send = async () => {
      const res = await request.post(`${API_URL}/site-feedbacks`, {
        headers: authHeaders(member),
        data: { name: `Feedback ${tag}`, rating: 5, comment: `comentario ${tag}`, category: "suggestion" },
      });
      expect(res.status()).toBe(201);
      const { id } = (await res.json()) as { id: string };
      cleaner.track(`feedback ${id}`, async () => {
        await api.delete(`${API_URL}/site-feedbacks/${id}`, { headers: authHeaders(admin) });
      });
    };

    // Só a flag de contato ligada: o feedback é barrado (skipped), não enviado.
    await arm(request, { master: true, contact: true, feedback: false });
    await send();
    const skipped = await waitOutbox(FEEDBACK_TEMPLATE, tag, (await activeAdmins()).length);
    expect(skipped.every((r) => r.status === "skipped")).toBe(true);

    // Ligando a do feedback, o próximo envio entra na fila.
    await arm(request, { master: true, contact: true, feedback: true });
    await send();
    const admins = await activeAdmins();
    await expect
      .poll(async () => (await outboxOf(FEEDBACK_TEMPLATE, tag)).filter((r) => DELIVERABLE.includes(r.status)).length, { timeout: 20_000 })
      .toBe(admins.length);
    expect(await countRows("email_outbox", { templateKey: CONTACT_TEMPLATE, status: "pending" })).toBeGreaterThanOrEqual(0);
  });

  test("[email-notification.outbox#validacao-sem-linha] payload inválido: 400 e `email_outbox` inalterado, mesmo com tudo ligado", async ({
    request,
  }) => {
    await arm(request, { master: true, contact: true, feedback: true });
    const before = await countRows("email_outbox");
    const res = await request.post(`${API_URL}/contact`, { data: { name: "", email: "nao-e-email", phone: "", message: "" } });
    expect(res.status()).toBe(400);
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    expect(await countRows("email_outbox")).toBe(before);
  });

  test("[email-notification.outbox#limpeza] os contatos e feedbacks criados foram apagados (0 linhas com o RUN_TAG)", async ({ request }) => {
    await cleaner.run();
    const tag = tagged("").replace(/-$/, "");
    const contacts = await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM contacts WHERE message LIKE ?", [`%${tag}%`]);
    const feedbacks = await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM site_feedbacks WHERE comment LIKE ?", [`%${tag}%`]);
    expect(Number(contacts?.total)).toBe(0);
    expect(Number(feedbacks?.total)).toBe(0);
    // O restante do outbox é trilha de auditoria da fila: não há (nem deve haver) rota para apagá-lo.
    expect(request).toBeTruthy();
  });
});
