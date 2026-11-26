import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import {
  addDays,
  cardIds,
  clearAllFilters,
  deleteAllByTag,
  expectCards,
  goToPage,
  openAs,
  PAGE_SIZE,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  summaryText,
  todayUtc,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { cleanupData, massCount } from "../support/keep-data";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import { buildMultipart, daysCount, mediaCount, meditationRow, routesCount, type MeditationBody } from "./support";

const SCREEN: ListScreen = { p: "meditations", path: "/adm/meditacoes", endpoint: "/meditations" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLMN".split("");
const DAY_MS = 86_400_000;
const PAST_COUNT = 6;

const mondayOnOrAfter = (ms: number): number => {
  const date = new Date(ms);
  return ms + ((8 - date.getUTCDay()) % 7) * DAY_MS;
};
const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

test.describe.serial("Meditações: casca única, período e filtros no servidor, dias em diálogo (UI real)", () => {
  const tag = `e2e-med-${Date.now().toString(36)}`;
  const ids = new Map<string, string>();
  const usedWeeks = new Set<number>();
  let token = "";

  /** Cria uma meditação numa segunda-feira sorteada na faixa; repete o sorteio se a semana já estiver ocupada (409). */
  const createInRange = async (
    request: Parameters<typeof loginAs>[0],
    topic: string,
    fromMs: number,
    spanWeeks: number,
  ): Promise<MeditationBody> => {
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const monday = mondayOnOrAfter(fromMs) + Math.floor(Math.random() * spanWeeks) * 7 * DAY_MS;
      if (usedWeeks.has(monday)) continue;
      const response = await request.post(`${API_URL}/meditations`, {
        headers: authHeaders(token),
        multipart: buildMultipart({ topic, startDate: iso(monday), endDate: iso(monday + 4 * DAY_MS) }),
      });
      if (response.status() === 409) continue;
      expect(response.status(), await response.text()).toBe(201);
      usedWeeks.add(monday);
      return (await response.json()) as MeditationBody;
    }
    throw new Error("sem semana livre para a meditação do cenário");
  };

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;
    const today = Date.parse(`${todayUtc()}T00:00:00Z`);
    const weekday = new Date(today).getUTCDay();
    let letters = [...LETTERS];
    if (weekday >= 1 && weekday <= 5) {
      const thisMonday = today - (weekday - 1) * DAY_MS;
      const response = await request.post(`${API_URL}/meditations`, {
        headers: authHeaders(token),
        multipart: buildMultipart({ topic: `${tag} ${letters[0]}`, startDate: iso(thisMonday), endDate: iso(thisMonday + 4 * DAY_MS) }),
      });
      if (response.status() === 201) {
        ids.set(letters[0], ((await response.json()) as MeditationBody).id);
        usedWeeks.add(thisMonday);
        letters = letters.slice(1);
      }
    }
    for (const [index, letter] of letters.entries()) {
      const created =
        index < PAST_COUNT
          ? await createInRange(request, `${tag} ${letter}`, Date.UTC(2001, 0, 1), 1000)
          : await createInRange(request, `${tag} ${letter}`, Date.UTC(2028, 0, 1), 400);
      ids.set(letter, created.id);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await deleteAllByTag(request, "/meditations", tag, (row) => (row.meditation as { id?: string } | undefined)?.id);
      expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM meditations WHERE topic LIKE ?", [`%${tag}%`])).toMatchObject({ n: 0 });
    });
  });

  const allIds = (): string[] => [...ids.values()];

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "m.startDate DESC, m.id DESC"): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT m.id AS id FROM meditations m WHERE m.topic LIKE ? ${extra} ORDER BY ${order}`, [`%${tag}%`, ...params])).map((r) => r.id);

  const idOfPeriod = async (period: "past" | "upcoming"): Promise<string> => {
    const today = todayUtc();
    const list = await expectedIds(period === "past" ? "AND m.endDate < ?" : "AND m.startDate > ?", [today]);
    return list[0];
  };

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "meditation_management",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => allIds()[1],
  });

  test("a API recebeu 14 meditações da execução e a ordem padrão é início mais recente primeiro", async ({ page, request }) => {
    expect(allIds()).toHaveLength(LETTERS.length);
    await openAs(page, request, SCREEN);
    const reply = await searchFor(page, SCREEN, tag);
    expect(reply.params.get("sortBy")).toBe("startDate");
    expect(reply.params.get("order")).toBe("DESC");
    const starts = (await queryAll<{ id: string; startDate: string }>("SELECT id, startDate FROM meditations WHERE topic LIKE ?", [`%${tag}%`]));
    const startOf = new Map(starts.map((r) => [r.id, r.startDate]));
    const shown = (await cardIds(page, p)).map((id) => startOf.get(id) as string);
    expect([...shown].sort().reverse()).toEqual(shown);
  });

  test("filtro de período: semana atual, próximas e encerradas batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = todayUtc();

    const past = await selectFilter(page, SCREEN, "period", "past");
    expect(past.params.get("period")).toBe("past");
    const dbPast = await expectedIds("AND m.endDate < ?", [today]);
    expect(past.body.meta?.totalItems).toBe(dbPast.length);
    expect(dbPast.length).toBeGreaterThanOrEqual(PAST_COUNT);
    await expectCards(page, p, dbPast.slice(0, PAGE_SIZE));
    for (const id of dbPast.slice(0, 3)) await expect(page.getByTestId(`${p}-card-period-${id}`)).toHaveText("Encerrada");

    const upcoming = await selectFilter(page, SCREEN, "period", "upcoming");
    const dbUpcoming = await expectedIds("AND m.startDate > ?", [today]);
    expect(upcoming.body.meta?.totalItems).toBe(dbUpcoming.length);
    await expectCards(page, p, dbUpcoming.slice(0, PAGE_SIZE));
    for (const id of dbUpcoming.slice(0, 3)) await expect(page.getByTestId(`${p}-card-period-${id}`)).toHaveText("Próxima");

    const current = await selectFilter(page, SCREEN, "period", "current");
    const dbCurrent = await expectedIds("AND m.startDate <= ? AND m.endDate >= ?", [today, today]);
    expect(current.body.meta?.totalItems).toBe(dbCurrent.length);
    if (dbCurrent.length === 0) await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    else for (const id of dbCurrent) await expect(page.getByTestId(`${p}-card-period-${id}`)).toHaveText("Semana atual");
    expect(dbPast.length + dbUpcoming.length + dbCurrent.length).toBe(LETTERS.length);

    const all = await selectFilter(page, SCREEN, "period", "");
    expect(all.params.has("period")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length);
  });

  test("filtro de período sem busca: o total é o do banco para toda a tabela", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const reply = await selectFilter(page, SCREEN, "period", "past");
    const row = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM meditations WHERE endDate < ?", [todayUtc()]);
    expect(reply.body.meta?.totalItems).toBe(Number(row?.n));
  });

  test("datas de início (de/até) e de criação filtram no servidor", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const byStart = await queryAll<{ id: string; startDate: string }>("SELECT id, startDate FROM meditations WHERE topic LIKE ? ORDER BY startDate", [`%${tag}%`]);
    const lower = byStart[3].startDate;
    const upper = byStart[9].startDate;

    const from = await setDateFilter(page, SCREEN, "startFrom", lower);
    expect(from.params.get("startFrom")).toBe(lower);
    expect(from.body.meta?.totalItems).toBe(byStart.filter((r) => r.startDate >= lower).length);

    const both = await setDateFilter(page, SCREEN, "startTo", upper);
    expect(both.params.get("startTo")).toBe(upper);
    const window = byStart.filter((r) => r.startDate >= lower && r.startDate <= upper).map((r) => r.id);
    expect(both.body.meta?.totalItems).toBe(window.length);
    await expectCards(page, p, window, false);

    await clearAllFilters(page, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = todayUtc();
    const created = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(created.body.meta?.totalItems).toBe((await expectedIds("AND m.createdAt >= ?", [today])).length);
    const none = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(none.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação por tema e por criação segue o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const asc = await selectFilter(page, SCREEN, "sort", "topic:ASC");
    expect(asc.params.get("sortBy")).toBe("topic");
    await expectCards(page, p, (await expectedIds("", [], "m.topic ASC")).slice(0, PAGE_SIZE));
    await selectFilter(page, SCREEN, "sort", "topic:DESC");
    await expectCards(page, p, (await expectedIds("", [], "m.topic DESC")).slice(0, PAGE_SIZE));
    const starts = await selectFilter(page, SCREEN, "sort", "startDate:ASC");
    expect(starts.params.get("order")).toBe("ASC");
    await expectCards(page, p, (await expectedIds("", [], "m.startDate ASC")).slice(0, PAGE_SIZE));
    const created = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(created.params.get("sortBy")).toBe("createdAt");
    const times = new Map((await queryAll<{ id: string; createdAt: string }>("SELECT id, createdAt FROM meditations WHERE topic LIKE ?", [`%${tag}%`])).map((r) => [r.id, r.createdAt]));
    const shown = (await cardIds(page, p)).map((id) => times.get(id) as string);
    expect([...shown].sort()).toEqual(shown);
  });

  test("filtros combinados: busca + período + data de início + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "period", "upcoming");
    const today = todayUtc();
    await setDateFilter(page, SCREEN, "startFrom", addDays(today, 1));
    const reply = await selectFilter(page, SCREEN, "sort", "topic:ASC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, period: "upcoming", startFrom: addDays(today, 1), sortBy: "topic", order: "ASC" });
    const expected = await expectedIds("AND m.startDate > ? AND m.startDate >= ?", [today, addDays(today, 1)], "m.topic ASC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
  });

  test("cartão: tema, período, nº de dias, data de criação e ações; sem capa e sem expandir por cima", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "period", "past");
    const id = await idOfPeriod("past");
    await expect(page.getByTestId(`${p}-card-${id}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toContainText(tag);
    await expect(page.getByTestId(`${p}-card-period-${id}`)).toHaveText("Encerrada");
    await expect(page.getByTestId(`${p}-card-days-count-${id}`)).toHaveText("5 dias");
    await expect(page.getByTestId(`${p}-card-created-${id}`)).toContainText("Criada em");
    for (const action of ["days", "material", "edit", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${id}`)).toBeVisible();
    const row = await meditationRow(id);
    expect(row).not.toBeNull();
  });

  test("Ver dias abre o diálogo com os cinco dias em ordem e o detalhe do dia; a grade não se mexe", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = (await expectedIds()).at(0) as string;
    const before = await Promise.all((await cardIds(page, p)).map((c) => page.getByTestId(`${p}-card-${c}`).boundingBox()));

    await page.getByTestId(`${p}-card-days-${id}`).click();
    await expect(page.getByTestId(`${p}-days-dialog`)).toBeVisible();
    const dayRows = await queryAll<{ id: string; day: string; verse: string; topic: string }>(
      "SELECT id, day, verse, topic FROM meditation_days WHERE meditationId = ?",
      [id],
    );
    expect(dayRows).toHaveLength(5);
    const rowsText = await page.locator(`[data-testid^="${p}-days-dialog-day-"]`).allInnerTexts();
    expect(rowsText.map((t) => t.split("\n")[0])).toEqual(["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"]);

    const wednesday = dayRows.find((d) => d.day === "Wednesday")!;
    await page.getByTestId(`${p}-days-dialog-view-${wednesday.id}`).click();
    await expect(page.getByTestId(`${p}-day-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-day-dialog-topic`)).toHaveText(wednesday.topic);
    await expect(page.getByTestId(`${p}-day-dialog-verse`)).toHaveText(wednesday.verse);
    await page.getByTestId(`${p}-day-dialog-close`).click();
    await expect(page.getByTestId(`${p}-day-dialog`)).toBeHidden();
    await page.getByTestId(`${p}-days-dialog-close`).click();
    await expect(page.getByTestId(`${p}-days-dialog`)).toBeHidden();

    const after = await Promise.all((await cardIds(page, p)).map((c) => page.getByTestId(`${p}-card-${c}`).boundingBox()));
    // Tolerância de 3px: o cartão sob o mouse sobe 2px no hover; o que não pode acontecer é a grade reorganizar.
    after.forEach((box, index) => {
      expect(Math.abs(box!.x - before[index]!.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(box!.y - before[index]!.y)).toBeLessThanOrEqual(3);
      expect(Math.abs(box!.height - before[index]!.height)).toBeLessThanOrEqual(3);
    });
  });

  test("Ver material abre o documento da meditação e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "topic:ASC");
    const id = allIds()[2];
    await page.getByTestId(`${p}-card-material-${id}`).click();
    await expect(page.getByTestId("document-preview-modal")).toBeVisible();
    await expect(page.getByTestId("document-preview-frame")).toHaveAttribute("src", "https://example.com/meditacao.pdf");
    await page.getByTestId("document-preview-close").click();
    await expect(page.getByTestId("document-preview-modal")).toBeHidden();
  });

  test("Editar leva ao formulário já preenchido com o tema do banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "topic:ASC");
    const id = allIds()[3];
    await page.getByTestId(`${p}-card-edit-${id}`).click();
    await expect(page).toHaveURL(/\/adm\/editar-meditacao$/);
    await expect(page.getByTestId("meditation-page-creator")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel(/Tema/).first()).toHaveValue((await meditationRow(id))!.topic);
  });

  test("Nova meditação leva ao criador de meditação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await page.getByTestId(`${p}-create`).click();
    await expect(page).toHaveURL(/\/adm\/criar-pagina\/meditacao$/);
    await expect(page.getByTestId("meditation-page-creator")).toBeVisible({ timeout: 20_000 });
  });

  test("excluir: cancelar mantém; confirmar apaga meditação, dias, mídia e rota no banco", async ({ page, request }) => {
    const victim = await createInRange(request, `${tag} apagar`, Date.UTC(2040, 0, 1), 300);
    expect(await daysCount(victim.id)).toBe(5);
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await meditationRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await meditationRow(victim.id)).toBeNull();
    expect(await daysCount(victim.id)).toBe(0);
    expect(await mediaCount(victim.id)).toBe(0);
    expect(await routesCount(victim.id)).toBe(0);
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const extra = `${tag} extra`;
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) await createInRange(request, `${extra} ${String(i).padStart(2, "0")}`, Date.UTC(2045, 0, 1), 400);
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE + 1}`);
    await goToPage(page, SCREEN, 2);
    const last = (await cardIds(page, p))[0];
    expect(await cardIds(page, p)).toHaveLength(1);
    await page.getByTestId(`${p}-card-delete-${last}`).click();
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    }, (params) => params.get("page") === "1" && params.get("search") === extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE}`);
    expect(await meditationRow(last)).toBeNull();
  });

  test("@mobile cartão no celular: ações empilhadas com 44px e Ver dias abre o diálogo", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "topic:ASC");
    const id = allIds()[2];
    const days = await page.getByTestId(`${p}-card-days-${id}`).boundingBox();
    const edit = await page.getByTestId(`${p}-card-edit-${id}`).boundingBox();
    expect(days!.height).toBeGreaterThanOrEqual(44);
    expect(edit!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(days!.x - edit!.x)).toBeLessThanOrEqual(1);
    await page.getByTestId(`${p}-card-days-${id}`).click();
    await expect(page.getByTestId(`${p}-days-dialog`)).toBeVisible();
    const dialog = await page.getByTestId(`${p}-days-dialog`).locator(".MuiDialog-paper").boundingBox();
    expect(dialog!.x).toBeGreaterThanOrEqual(0);
    expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(376);
  });

  test("massa: cada execução deixa de 5 a 10 meditações pelo criador (/adm/criar-pagina/meditacao), com PDF no S3 consistente", async ({ page, request }) => {
    const total = massCount();
    test.setTimeout(60_000 + total * 45_000); // cada meditação passa por ~20 passos de formulário
    await openAs(page, request, SCREEN);
    const freeMonday = async (index: number): Promise<number> => {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const monday = mondayOnOrAfter(Date.UTC(2100 + index, 0, 1)) + Math.floor(Math.random() * 40) * 7 * DAY_MS;
        const clash = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM meditations WHERE startDate <= ? AND endDate >= ?", [iso(monday + 4 * DAY_MS), iso(monday)]);
        if (Number(clash?.n) === 0 && !usedWeeks.has(monday)) return monday;
      }
      throw new Error("sem semana livre para a massa de meditações");
    };
    const topics: string[] = [];
    for (let index = 0; index < total; index += 1) {
      const topic = `${tag} massa ${String(index + 1).padStart(2, "0")}`;
      const monday = await freeMonday(index);
      usedWeeks.add(monday);
      await page.goto("/adm/criar-pagina/meditacao");
      const form = page.getByTestId("meditation-page-creator");
      await expect(form).toBeVisible({ timeout: 20_000 });
      await page.getByTestId("meditation-page-creator-topic-input").fill(topic);
      await page.getByTestId("meditation-page-creator-start-input").fill(iso(monday));
      await page.getByTestId("meditation-page-creator-end-input").fill(iso(monday + 4 * DAY_MS));

      await page.getByRole("button", { name: "Adicionar Doc da meditação" }).click();
      if (index % 2 === 0) {
        await page.getByRole("combobox", { name: "Tipo de conteúdo" }).click();
        await page.getByRole("option", { name: "Upload" }).click();
        await page.locator('input[type="file"]').setInputFiles({ name: `massa-${index}.pdf`, mimeType: "application/pdf", buffer: Buffer.from(`%PDF-1.4 massa ${tag} ${index}`) });
      } else {
        await page.getByLabel("Insira o link").fill(`https://example.com/${tag}-massa-${index}.pdf`);
      }

      const dayLabels = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
      for (const [dayIndex, label] of dayLabels.entries()) {
        if (dayIndex > 0) {
          await page.getByRole("combobox", { name: "Dia da Semana" }).click();
          await page.getByRole("option", { name: label }).click();
        }
        await page.getByLabel("Tema *").fill(`Tema ${label} ${index + 1}`);
        await page.getByLabel("Versículo *").fill(`Salmos 23:${dayIndex + 1}`);
        await page.getByRole("button", { name: "Adicionar Dia" }).click();
      }
      await expect(page.getByText("Dias da Semana (5/5)")).toBeVisible();
      await page.getByTestId("meditation-page-creator-save").click();
      await expect(page).toHaveURL(/\/adm\/meditacoes$/, { timeout: 30_000 });
      topics.push(topic);
    }

    for (const [index, topic] of topics.entries()) {
      const row = await queryOne<{ id: string }>("SELECT id FROM meditations WHERE topic = ?", [topic]);
      expect(row, topic).not.toBeNull();
      expect(await daysCount(row!.id)).toBe(5);
      expect(await mediaCount(row!.id)).toBe(1);
      expect(await routesCount(row!.id)).toBe(1);
      const media = await queryOne<{ uploadType: string; url: string }>("SELECT uploadType, url FROM media_items WHERE targetType = 'Meditation' AND targetId = ?", [row!.id]);
      expect(media?.uploadType).toBe(index % 2 === 0 ? "upload" : "link");
    }
    await searchFor(page, SCREEN, `${tag} massa`);
    await expect(summaryText(page, p)).toHaveText(new RegExp(`de ${total}$`));
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
