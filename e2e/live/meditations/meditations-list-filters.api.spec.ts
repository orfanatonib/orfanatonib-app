import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { cleanupData, massCount } from "../support/keep-data";
import { localShift } from "../support/local-day";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createRaw, label, meditationsWithTag, removeApi, type MeditationBody } from "./support";

/**
 * Filtros de `GET /meditations` aplicados no banco: search, period, startFrom/startTo, createdFrom/To, sortBy, page/limit.
 * Cria as próprias meditações (prefixo RUN_TAG) e as apaga no afterAll. Sem `page` segue o array legado.
 */
interface Paged {
  data: Array<{ meditation: { id: string; topic: string; startDate: string } | null }>;
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}

const DAY_MS = 86_400_000;
const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const mondayOf = (year: number, offsetWeeks: number): { start: string; end: string } => {
  const first = Date.UTC(year, 0, 1);
  const toMonday = (8 - new Date(first).getUTCDay()) % 7;
  const monday = first + toMonday * DAY_MS + offsetWeeks * 7 * DAY_MS;
  return { start: iso(monday), end: iso(monday + 4 * DAY_MS) };
};
const localIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

test.describe.serial("Meditações — filtros da listagem no servidor", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];
  /** Ano aleatório distante para o passado/futuro não colidirem com dados reais nem entre execuções. */
  const rnd = (min: number, span: number): number => min + Math.floor(Math.random() * span);
  const byTopic: Record<string, MeditationBody> = {};
  let currentId: string | null = null;

  const list = (request: APIRequestContext, query: string, token = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/meditations${query}`, { headers: authHeaders(token) });
  const scoped = (extra = ""): string => `search=${encodeURIComponent(RUN_TAG)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string): Promise<Paged> => {
    const res = await list(request, `?${query}`);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const ids = (page: Paged): string[] => page.data.map((item) => item.meditation?.id ?? "");
  const idsFlat = async (request: APIRequestContext, query: string): Promise<string[]> => ids(await paged(request, `${query}&page=1&limit=100`));

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;

    // A massa acumula entre execuções: cada semana é sorteada e, se já estiver ocupada (409), sorteia outra.
    const make = async (key: string, kind: "past" | "future", order: number, topic = label(key)) => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const year = kind === "past" ? rnd(1900, 100) : rnd(2200, 7000);
        const week = mondayOf(year, order);
        const res = await createRaw(request, admin, { topic, week });
        if (res.status() === 201) {
          const meditation = (await res.json()) as MeditationBody;
          created.push(meditation.id);
          byTopic[key] = meditation;
          return;
        }
        expect(res.status(), "só 409 (semana ocupada) é aceitável").toBe(409);
      }
      throw new Error(`sem semana livre para ${key}`);
    };
    await make("past-a", "past", 1, label("past-a-banana"));
    await make("past-b", "past", 3);
    await make("future-a", "future", 1);
    await make("future-b", "future", 5);
    await make("future-c", "future", 9, label("future-c-50%_x"));

    // Semana corrente (só existe em dia útil e se ninguém ocupa a semana): senão o bucket "current" fica vazio.
    const now = new Date();
    const weekday = now.getDay();
    if (weekday >= 1 && weekday <= 5) {
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (weekday - 1));
      const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
      const res = await createRaw(request, admin, { topic: label("current"), startDate: localIso(monday), endDate: localIso(friday) });
      if (res.status() === 201) {
        currentId = ((await res.json()) as MeditationBody).id;
        created.push(currentId);
      } else {
        expect(res.status(), "só 409 (semana já ocupada) é aceitável").toBe(409);
      }
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await removeApi(request, admin, id);
      expect(await meditationsWithTag(RUN_TAG), "a limpeza deixou meditações do E2E").toBe(0);
    });
    await closeDb();
  });

  test("sem page: array legado em startDate ASC, sem envelope", async ({ request }) => {
    const res = await list(request, `?${scoped()}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ meditation: { id: string; startDate: string } | null }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(await meditationsWithTag(RUN_TAG));
    const dates = body.map((item) => item.meditation?.startDate ?? "");
    expect(dates).toEqual([...dates].sort());
  });

  test("com page: envelope { data, meta } com total, startDate DESC por padrão", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta.totalItems).toBe(await meditationsWithTag(RUN_TAG));
    expect(page.meta.orderBy).toBe("startDate");
    const dates = page.data.map((item) => item.meditation?.startDate ?? "");
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test("search isolado (topic) e escapando curinga", async ({ request }) => {
    expect(await idsFlat(request, `search=${encodeURIComponent(label("past-a-banana"))}`)).toEqual([byTopic["past-a"].id]);
    expect(await idsFlat(request, `search=${encodeURIComponent(`${RUN_TAG}-future-c-50%_x`)}`)).toEqual([byTopic["future-c"].id]);
    // "%" literal não é curinga: "50%_y" não casa com "50%_x"
    expect(await idsFlat(request, `search=${encodeURIComponent(`${RUN_TAG}-future-c-50%_y`)}`)).toEqual([]);
    expect(await idsFlat(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("period isolado: past, upcoming e current batem com as datas e com o banco", async ({ request }) => {
    const past = await idsFlat(request, scoped("period=past"));
    expect(past).toEqual(expect.arrayContaining([byTopic["past-a"].id, byTopic["past-b"].id]));
    for (const key of ["future-a", "future-b", "future-c"]) expect(past).not.toContain(byTopic[key].id);

    const upcoming = await idsFlat(request, scoped("period=upcoming"));
    for (const key of ["future-a", "future-b", "future-c"]) expect(upcoming).toContain(byTopic[key].id);
    for (const key of ["past-a", "past-b"]) expect(upcoming).not.toContain(byTopic[key].id);

    const current = await idsFlat(request, scoped("period=current"));
    for (const key of Object.keys(byTopic)) expect(current).not.toContain(byTopic[key].id);
    if (currentId) {
      expect(current).toContain(currentId);
      expect(past).not.toContain(currentId);
      expect(upcoming).not.toContain(currentId);
    } else {
      expect(current).toEqual([]);
    }

    const dbPast = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM meditations WHERE topic LIKE ? AND endDate < ?", [`%${RUN_TAG}%`, localIso(new Date())]);
    expect((await paged(request, scoped("period=past&page=1&limit=100"))).meta.totalItems).toBe(Number(dbPast?.n));
  });

  test("startFrom/startTo isolados e combinados (intervalo inclusivo sobre startDate)", async ({ request }) => {
    // As semanas são sorteadas: o esperado sai das próprias datas criadas, ordenadas.
    const all = Object.values(byTopic)
      .map((m) => ({ id: m.id, start: m.startDate.slice(0, 10) }))
      .sort((x, y) => x.start.localeCompare(y.start));
    const lo = all[1];
    const hi = all[3];
    const idsWhere = (test: (start: string) => boolean): string[] => all.filter((m) => test(m.start)).map((m) => m.id).sort();

    expect((await idsFlat(request, scoped(`startFrom=${lo.start}`))).sort()).toEqual(idsWhere((start) => start >= lo.start));
    expect((await idsFlat(request, scoped(`startTo=${lo.start}`))).sort()).toEqual(idsWhere((start) => start <= lo.start));
    expect((await idsFlat(request, scoped(`startFrom=${lo.start}&startTo=${hi.start}`))).sort()).toEqual(
      idsWhere((start) => start >= lo.start && start <= hi.start),
    );
    expect((await idsFlat(request, scoped(`startFrom=${hi.start}&startTo=${lo.start}`)))).toEqual([]);
  });

  test("createdFrom/createdTo: hoje inclui, amanhã exclui, ontem como fim exclui", async ({ request }) => {
    const total = await meditationsWithTag(RUN_TAG);
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).meta.totalItems).toBe(total);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1&limit=100`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1&limit=100`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + period + startFrom", async ({ request }) => {
    const out = await idsFlat(request, `search=${encodeURIComponent(RUN_TAG)}&period=upcoming&startFrom=${byTopic["future-b"].startDate.slice(0, 10)}`);
    const pivot = byTopic["future-b"].startDate.slice(0, 10);
    const expected = ["future-a", "future-b", "future-c"].map((key) => byTopic[key]).filter((m) => m.startDate.slice(0, 10) >= pivot).map((m) => m.id);
    expect(out.sort()).toEqual(expected.sort());
  });

  test("sortBy topic/startDate/createdAt com order; página 2 e total", async ({ request }) => {
    const topicAsc = await paged(request, scoped("sortBy=topic&order=ASC&page=1&limit=100"));
    const topics = topicAsc.data.map((item) => item.meditation?.topic ?? "");
    expect(topics).toEqual([...topics].sort());
    expect(topicAsc.meta.orderBy).toBe("topic");

    const startAsc = await paged(request, scoped("sortBy=startDate&order=ASC&page=1&limit=100"));
    const starts = startAsc.data.map((item) => item.meditation?.startDate ?? "");
    expect(starts).toEqual([...starts].sort());

    expect((await paged(request, scoped("sortBy=createdAt&page=1&limit=100"))).meta.orderBy).toBe("createdAt");

    const total = await meditationsWithTag(RUN_TAG);
    const p1 = await paged(request, scoped("order=ASC&page=1&limit=2"));
    const p2 = await paged(request, scoped("order=ASC&page=2&limit=2"));
    expect(p1.meta).toMatchObject({ page: 1, limit: 2, totalItems: total, totalPages: Math.ceil(total / 2) });
    expect(p2.data).toHaveLength(Math.min(2, total - 2));
    expect(ids(p1).filter((id) => ids(p2).includes(id))).toEqual([]);
  });

  test("página fora do alcance: data vazia e total preservado", async ({ request }) => {
    const total = await meditationsWithTag(RUN_TAG);
    const out = await paged(request, scoped("page=50&limit=10"));
    expect(out.data).toEqual([]);
    expect(out.meta.totalItems).toBe(total);
    const empty = await paged(request, `search=${encodeURIComponent(`${RUN_TAG}-nao-existe`)}&page=1`);
    expect(empty.data).toEqual([]);
    expect(empty.meta.totalItems).toBe(0);
  });

  test("validação: sortBy/period/data inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=id", "period=future", "startFrom=01/01/2026", "startTo=2026-02-31", "createdFrom=ontem", "page=0", "limit=101", "order=UP", "page=1&limit=0", "foo=bar"]) {
      const res = await list(request, `?${query}`);
      expect(res.status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 200 com os mesmos filtros", async ({ request }) => {
    const anon = await request.get(`${API_URL}/meditations?${scoped("period=past")}`);
    expect(anon.status()).toBe(401);
    const asMember = await list(request, `?${scoped("period=past&page=1&limit=100")}`, member);
    expect(asMember.status()).toBe(200);
    expect(((await asMember.json()) as Paged).meta.totalItems).toBeGreaterThanOrEqual(2);
  });

  test("/this-week continua respondendo para usuário logado", async ({ request }) => {
    const res = await request.get(`${API_URL}/meditations/this-week`, { headers: authHeaders(member) });
    expect(res.status()).toBe(200);
    if (currentId) {
      const body = (await res.json()) as { meditation: { id: string } | null };
      expect(body.meditation?.id).toBe(currentId);
    }
  });

  test("massa: deixa 5 a 10 meditações novas em semanas livres", async ({ request }) => {
    const total = massCount();
    for (let index = 0; index < total; index += 1) {
      let made: MeditationBody | null = null;
      for (let attempt = 0; attempt < 30 && !made; attempt += 1) {
        const res = await createRaw(request, admin, { topic: label(`massa-${index + 1}`), week: mondayOf(rnd(2200, 7000), index) });
        if (res.status() === 201) made = (await res.json()) as MeditationBody;
        else expect(res.status(), "só 409 (semana ocupada) é aceitável").toBe(409);
      }
      if (!made) throw new Error("sem semana livre para a massa");
      created.push(made.id);
    }
    expect(await idsFlat(request, `search=${encodeURIComponent(label("massa-"))}`)).toHaveLength(total);
  });
});
