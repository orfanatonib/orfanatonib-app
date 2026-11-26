import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, snapshotBucket } from "../support/s3";
import {
  BAD_ID,
  OVERSIZED_MEDIA_TITLE,
  create,
  createRaw,
  daysCount,
  defaultDays,
  label,
  mediaCount,
  meditationRow,
  meditationsWithTag,
  nextWeek,
  patchRaw,
  pdf,
  removeApi,
  routesCount,
  snapshotDb,
  type MeditationBody,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários de `/meditations` por handler (plano 29 §7.3): feliz, validação, conflito (semana ocupada), não encontrado,
 * escopo, flag, rollback, falha sem efeito parcial e S3 sem órfão. Cada cenário usa a sua semana futura, cria os
 * próprios dados pela API (prefixo RUN_TAG), prova o efeito por SELECT e o `afterAll` confere 0 sobras.
 */
interface WeekResponse {
  status?: string;
  meditation: (MeditationBody & { media?: { id: string; url: string } | null }) | null;
}

test.describe.serial("Meditações — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const created: string[] = [];

  /** A API devolve a data como timestamp; o que ela aceita de volta é só o dia (AAAA-MM-DD). */
  const day = (value: string): string => value.slice(0, 10);

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const make = async (request: APIRequestContext, name: string, extra: { file?: boolean } = {}): Promise<MeditationBody> => {
    const meditation = await create(request, admin, { topic: label(name), file: extra.file ? pdf(`${name}.pdf`) : undefined });
    created.push(meditation.id);
    return meditation;
  };

  const get = (request: APIRequestContext, token: string | undefined, path: string) =>
    request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

  const monthDay = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  /** Segunda e sexta da semana corrente (hora local, como a API calcula). */
  const currentWeek = (): { start: string; end: string } => {
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
    return { start: monthDay(monday), end: monthDay(friday) };
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await removeApi(request, admin, id);
    if (CLEANUP_ENABLED) expect(await meditationsWithTag(RUN_TAG), "a limpeza deixou meditações do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /meditations

  test("[meditation.post.meditations#feliz] admin cria com PDF: meditação, cinco dias, mídia e rota batem com o banco", async ({ request }) => {
    const meditation = await make(request, "post-feliz", { file: true });
    expect(await meditationRow(meditation.id)).toMatchObject({ topic: label("post-feliz") });
    expect(await daysCount(meditation.id)).toBe(5);
    expect(await mediaCount(meditation.id)).toBe(1);
    expect(await routesCount(meditation.id)).toBe(1);
  });

  test("[meditation.post.meditations#validacao] dias a menos, data que não é segunda/sexta, data inválida e tópico ausente: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const week = nextWeek();
    const base = { topic: label("validacao"), week };
    for (const input of [
      { ...base, days: defaultDays().slice(0, 4) },
      { ...base, startDate: week.end },
      { ...base, endDate: week.start },
      { ...base, startDate: "amanhã" },
    ]) {
      const res = await createRaw(request, admin, input);
      expect(res.status(), JSON.stringify(input).slice(0, 80)).toBe(400);
    }
    const noTopic = await request.post(`${API_URL}/meditations`, {
      headers: authHeaders(admin),
      multipart: { meditationData: JSON.stringify({ startDate: week.start, endDate: week.end, days: defaultDays(), media: { title: "x", uploadType: "link", isLocalFile: false, url: "https://x.test/a.pdf" } }) },
    });
    expect(noTopic.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  test("[meditation.post.meditations#conflito-ou-duplicidade] outra meditação na mesma semana (ou que a atravessa): 409 sem gravar; outra semana é livre", async ({ request }) => {
    const first = await make(request, "post-conflito");
    const before = await snapshotDb();
    const same = await createRaw(request, admin, { topic: label("post-conflito-2"), startDate: day(first.startDate), endDate: day(first.endDate) });
    expect(same.status(), await same.text()).toBe(409);
    expect(await snapshotDb()).toEqual(before);
    const other = await make(request, "post-conflito-livre");
    expect(other.id).not.toBe(first.id);
  });

  test("[meditation.post.meditations#falha-do-colaborador-sem-efeito-parcial] [meditation.post.meditations#rollback-de-transacao] [meditation.post.meditations#s3-sem-orfao] mídia com título que o banco recusa, DEPOIS do upload: nenhuma meditação, dia, mídia, rota nem objeto", async ({
    request,
  }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await createRaw(request, admin, { topic: label("post-rollback"), file: pdf("rollback.pdf"), mediaTitle: OVERSIZED_MEDIA_TITLE });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await meditationsWithTag(label("post-rollback"))).toBe(0);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- GET

  test("[meditation.get.meditations#feliz] [meditation.get.meditations-id#feliz] listagem (com busca) e leitura por id batem com o banco", async ({ request }) => {
    const meditation = await make(request, "get-feliz", { file: true });
    const list = await get(request, admin, `/meditations?search=${encodeURIComponent(label("get-feliz"))}`);
    expect(list.status()).toBe(200);
    const items = await json<WeekResponse[]>(list);
    expect(items.map((item) => item.meditation?.id)).toContain(meditation.id);

    const one = await get(request, admin, `/meditations/${meditation.id}`);
    expect(one.status()).toBe(200);
    const body = await json<WeekResponse>(one);
    expect(body.meditation?.topic).toBe((await meditationRow(meditation.id))?.topic);
    expect(body.meditation?.media?.url).toBeTruthy();
  });

  test("[meditation.get.meditations#escopo-proprio-x-outro] [meditation.get.meditations-id#escopo-proprio-x-outro] a leitura é igual para admin, líder e membro (o conteúdo é de todos); visitante é 401", async ({ request }) => {
    const meditation = await make(request, "get-escopo");
    for (const token of [admin, leader, member]) {
      const list = await json<WeekResponse[]>(await get(request, token, `/meditations?search=${encodeURIComponent(label("get-escopo"))}`));
      expect(list.map((item) => item.meditation?.id)).toContain(meditation.id);
      expect((await get(request, token, `/meditations/${meditation.id}`)).status()).toBe(200);
    }
    expect((await get(request, undefined, "/meditations")).status()).toBe(401);
    expect((await get(request, undefined, `/meditations/${meditation.id}`)).status()).toBe(401);
  });

  test("[meditation.get.meditations-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/meditations/${BAD_ID}`)).status()).toBe(404);
  });

  test("[meditation.get.meditations-id#flag-desligada] [meditation.get.meditations-this-week#flag-desligada] com weekly_meditation desligada: 403 FEATURE_DISABLED", async ({ request }) => {
    const meditation = await make(request, "get-flag");
    await withFlagsOff(request, admin, ["weekly_meditation"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/meditations/${meditation.id}`));
      await expectFeatureDisabled(await get(request, admin, "/meditations/this-week"));
    });
    expect((await get(request, admin, `/meditations/${meditation.id}`)).status()).toBe(200);
  });

  test("[meditation.get.meditations-this-week#feliz] [meditation.get.meditations-this-week#escopo-proprio-x-outro] a meditação desta semana vem igual para admin, líder e membro e bate com o banco (no fim de semana a API não devolve nenhuma)", async ({ request }) => {
    // "Esta semana" é segunda a sexta (hora local): sábado e domingo ficam fora, e a API responde "não encontrada"
    // mesmo existindo a meditação da semana que acabou de passar. O cenário prova o comportamento do dia em que roda.
    const weekend = [0, 6].includes(new Date().getDay());
    const week = currentWeek();
    let expectedId = "";
    const existing = await queryOne<{ id: string }>("SELECT id FROM meditations WHERE startDate <= ? AND endDate >= ? LIMIT 1", [week.end, week.start]);
    if (existing) expectedId = existing.id;
    else {
      const ours = await create(request, admin, { topic: label("this-week"), startDate: week.start, endDate: week.end });
      created.push(ours.id);
      expectedId = ours.id;
    }
    for (const token of [admin, leader, member]) {
      const res = await get(request, token, "/meditations/this-week");
      expect(res.status()).toBe(200);
      const body = await json<WeekResponse>(res);
      if (weekend) expect(body.meditation).toBeNull();
      else expect(body.meditation?.id).toBe(expectedId);
    }
  });

  // ---------------------------------------------------------------- PATCH /meditations/:id

  test("[meditation.patch.meditations-id#feliz] admin troca o tópico e o PDF: o banco reflete e o dia/mídia continuam", async ({ request }) => {
    const meditation = await make(request, "patch-feliz", { file: true });
    const media = await json<WeekResponse>(await get(request, admin, `/meditations/${meditation.id}`));
    const res = await patchRaw(
      request,
      admin,
      meditation.id,
      {
        topic: label("patch-feliz-novo"),
        media: { id: media.meditation?.media?.id, title: "Novo guia", mediaType: "document", uploadType: "upload", isLocalFile: true, fieldKey: "file" },
      },
      pdf("novo.pdf"),
    );
    expect(res.status(), await res.text()).toBe(200);
    expect((await meditationRow(meditation.id))?.topic).toBe(label("patch-feliz-novo"));
    expect(await mediaCount(meditation.id)).toBe(1);
    expect(await daysCount(meditation.id)).toBe(5);
  });

  test("[meditation.patch.meditations-id#validacao] data que não é segunda/sexta, data inválida, dias vazios/demais/incompletos e tópico que não é texto: 400 (nunca 500) e a meditação fica como estava", async ({ request }) => {
    const meditation = await make(request, "patch-validacao");
    const before = await meditationRow(meditation.id);
    for (const data of [{ startDate: day(meditation.endDate) }, { endDate: day(meditation.startDate) }, { startDate: "amanhã" }, { days: [] }, { days: [...defaultDays(), ...defaultDays()] }, { days: [{ verse: "só o versículo" }] }, { topic: 5 }]) {
      const res = await patchRaw(request, admin, meditation.id, data);
      expect(res.status(), JSON.stringify(data).slice(0, 60)).toBe(400);
    }
    expect(await meditationRow(meditation.id)).toEqual(before);
    expect(await daysCount(meditation.id)).toBe(5);
  });

  test("[meditation.patch.meditations-id#nao-encontrado] uuid inexistente: 404 e nada criado", async ({ request }) => {
    const before = await snapshotDb();
    expect((await patchRaw(request, admin, BAD_ID, { topic: label("patch-fantasma") })).status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[meditation.patch.meditations-id#conflito-ou-duplicidade] mover para a semana de outra meditação: 409 e as datas não mudam; manter a própria semana é aceito", async ({ request }) => {
    const first = await make(request, "patch-conflito-a");
    const second = await make(request, "patch-conflito-b");
    const res = await patchRaw(request, admin, second.id, { startDate: day(first.startDate), endDate: day(first.endDate) });
    expect(res.status(), await res.text()).toBe(409);
    expect(await meditationRow(second.id)).toMatchObject({ startDate: day(second.startDate), endDate: day(second.endDate) });
    expect((await patchRaw(request, admin, second.id, { startDate: day(second.startDate), endDate: day(second.endDate), topic: label("patch-mesma-semana") })).status()).toBe(200);
  });

  test("[meditation.patch.meditations-id#falha-do-colaborador-sem-efeito-parcial] [meditation.patch.meditations-id#rollback-de-transacao] [meditation.patch.meditations-id#s3-sem-orfao] mídia com título que o banco recusa junto de outras mudanças e PDF novo: tópico, dias, mídia e bucket intactos", async ({
    request,
  }) => {
    const meditation = await make(request, "patch-rollback", { file: true });
    const media = await json<WeekResponse>(await get(request, admin, `/meditations/${meditation.id}`));
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await patchRaw(
      request,
      admin,
      meditation.id,
      {
        topic: label("patch-nao-grava"),
        media: { id: media.meditation?.media?.id, title: OVERSIZED_MEDIA_TITLE, mediaType: "document", uploadType: "upload", isLocalFile: true, fieldKey: "file" },
      },
      pdf("never.pdf"),
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await meditationRow(meditation.id))?.topic).toBe(label("patch-rollback"));
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- DELETE

  test("[meditation.delete.meditations-id#feliz] [meditation.delete.meditations-id#s3-sem-orfao] admin remove: meditação, dias, mídia, rota e o objeto somem", async ({ request }) => {
    const meditation = await make(request, "delete-feliz", { file: true });
    const res = await request.delete(`${API_URL}/meditations/${meditation.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(204);
    expect(await meditationRow(meditation.id)).toBeNull();
    expect(await daysCount(meditation.id)).toBe(0);
    expect(await mediaCount(meditation.id)).toBe(0);
    expect(await routesCount(meditation.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[meditation.delete.meditations-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/meditations/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[meditation.delete.meditations-id#falha-do-colaborador-sem-efeito-parcial] [meditation.delete.meditations-id#rollback-de-transacao] id malformado: 4xx e nenhuma meditação, mídia nem objeto some", async ({ request }) => {
    const meditation = await make(request, "delete-colaborador", { file: true });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await request.delete(`${API_URL}/meditations/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    expect(await meditationRow(meditation.id)).not.toBeNull();
  });
});
