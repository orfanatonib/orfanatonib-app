import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { cleanupData, massCount } from "../support/keep-data";
import { withFlagsOff } from "../support/flags";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  expectSameShell,
  hasHorizontalOverflow,
  measureShell as measureShellRaw,
  openFiltersIfMobile,
  pickFilter,
  resetSkeletonCount,
  skeletonCount,
  summaryOf,
  totalFromSummary,
  visibleIds,
  widthRatio,
} from "../support/people-list-ui";
import { ACTOR_PASSWORD } from "./support";
import { fillDate } from "../support/date-field";
import { localShift, localAddDays } from "../support/local-day";

/**
 * `/adm/usuarios` pela UI real: casca única (95% desktop / 98% mobile), toolbar padrão, tabela no desktop e
 * cartões no mobile, filtros/ordenação/paginação no servidor. Os 14 usuários da rodada são criados pela API
 * (tag no e-mail) e todo número da tela é conferido no banco.
 */
const P = "users";
let TAG = RUN_TAG;
const TOTAL = 14;
const PAGE_SIZE = 12;
const NOBODY = "zzzz-ninguem-tem-este-nome";

interface Seed {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "leader" | "member";
  active: boolean;
  completed: boolean;
}

const seeds: Seed[] = [];
const extraIds: string[] = [];
let adminToken = "";

const pad = (n: number): string => String(n).padStart(2, "0");

async function createUser(request: APIRequestContext, body: Record<string, unknown>): Promise<string> {
  const res = await request.post(`${API_URL}/users`, { headers: authHeaders(adminToken), data: body });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

/** Contagem no banco dos usuários DESTA rodada que atendem à condição SQL. */
async function dbCount(extra = "", params: Array<string | number> = []): Promise<number> {
  const row = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM users WHERE email LIKE ? ${extra}`, [`%${TAG}%`, ...params]);
  return Number(row?.n ?? 0);
}

async function dbIds(extra = "", params: Array<string | number> = [], order = "name ASC"): Promise<string[]> {
  const rows = await queryAll<{ id: string }>(`SELECT id FROM users WHERE email LIKE ? ${extra} ORDER BY ${order}`, [`%${TAG}%`, ...params]);
  return rows.map((r) => r.id);
}

/** Mede a casca com a rolagem no topo (a posição é relativa à janela; clicar na paginação rola a página). */
async function measureShell(page: Page, prefix: string) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
  });
  return measureShellRaw(page, prefix);
}

/** Conta quantas vezes o esqueleto apareceu (amostra a cada quadro; instalar ANTES do `goto`). */
async function watchLoading(page: Page): Promise<void> {
  await page.addInitScript((id) => {
    const w = window as unknown as { __skeletonSeen: number };
    w.__skeletonSeen = 0;
    let present = false;
    const tick = () => {
      const now = Boolean(document.querySelector(`[data-testid="${id}-loading"]`));
      if (now && !present) w.__skeletonSeen += 1;
      present = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, "users");
}

const isUsersCall = (url: string, method: string): boolean => {
  const u = new URL(url);
  return method === "GET" && u.pathname === "/users" && u.searchParams.has("page");
};

/** Executa a ação e espera a resposta paginada da lista + a barra de busca sumir. */
async function whenLoaded(page: Page, action: () => Promise<void>): Promise<URLSearchParams> {
  const waiting = page.waitForResponse((r) => isUsersCall(r.url(), r.request().method()), { timeout: 20_000 });
  await action();
  const res = await waiting;
  expect(res.status()).toBe(200);
  await expect(page.getByTestId(`${P}-fetching`)).toHaveCount(0, { timeout: 20_000 });
  return new URL(res.url()).searchParams;
}

async function open(page: Page, request: APIRequestContext): Promise<void> {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/usuarios");
  await expect(page.getByTestId(`${P}-content`)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0, { timeout: 20_000 });
}

const searchTag = (page: Page, term = TAG) => whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(term));
const ids = (page: Page, kind: "row" | "card") => visibleIds(page, kind, P);

test.describe.serial("Usuários — tela real", () => {
  test.beforeAll(async ({ request }, testInfo) => {
    TAG = `${RUN_TAG}-${testInfo.project.name === "live-ui-mobile" ? "m" : "d"}${Math.random().toString(36).slice(2, 5)}`; // um conjunto por execução do bloco
    adminToken = (await loginAs(request, "admin")).accessToken;
    for (let i = 0; i < TOTAL; i += 1) {
      const body = {
        name: `${TAG} Pessoa ${pad(i)}`,
        email: `${TAG}-u${pad(i)}@orfanatonib.test`,
        phone: `119999900${pad(i)}`,
        password: ACTOR_PASSWORD,
        role: i % 2 === 0 ? "member" : "leader",
        active: i % 3 !== 0,
        completed: i % 4 !== 0,
        commonUser: false,
      };
      const id = await createUser(request, body);
      seeds.push({ id, name: body.name, email: body.email, phone: body.phone, role: body.role as Seed["role"], active: body.active, completed: body.completed });
    }
    // o servidor decide o estado final: o que vale é o banco
    expect(await dbCount()).toBe(TOTAL);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of [...seeds.map((s) => s.id), ...extraIds]) {
        await request.delete(`${API_URL}/users/${id}`, { headers: authHeaders(adminToken) });
      }
      const left = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE email LIKE ?", [`%${TAG}%`]);
      expect(Number(left?.n), "sobraram usuários do E2E").toBe(0);
    });
    await closeDb();
  });

  test("carga inicial: esqueleto só na 1ª carga, depois tabela; filtros e paginação não voltam ao esqueleto", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await watchLoading(page);
    await page.goto("/adm/usuarios");
    await expect(page.getByTestId(`${P}-table`)).toBeVisible({ timeout: 20_000 });
    expect(await skeletonCount(page)).toBeGreaterThan(0);
    await expect(page.getByTestId(`${P}-cards`)).toHaveCount(0);
    await expect(page.getByTestId(`${P}-manager-heading`)).toBeVisible();
    await resetSkeletonCount(page);
    await searchTag(page);
    await whenLoaded(page, () => page.getByTestId(`${P}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click());
    await whenLoaded(page, () => pickFilter(page, P, "role", "leader"));
    expect(await skeletonCount(page)).toBe(0);
  });

  test("busca com debounce: digitar devagar não dispara uma requisição por letra e o total bate com o banco", async ({ page, request }) => {
    await open(page, request);
    const calls: string[] = [];
    page.on("request", (r) => {
      if (isUsersCall(r.url(), r.method())) calls.push(new URL(r.url()).searchParams.get("q") ?? "");
    });
    await page.getByTestId(`${P}-toolbar-search`).pressSequentially(TAG, { delay: 40 });
    await expect(summaryOf(page, P)).toContainText(new RegExp(`de ${TOTAL}(\\D|$)`), { timeout: 20_000 });
    expect(calls.filter((q) => q).length, `chamadas: ${calls.join("|")}`).toBeLessThanOrEqual(3);
    expect(calls.at(-1)).toBe(TAG);
    expect(await totalFromSummary(page, P)).toBe(await dbCount());
  });

  test("filtros isolados e combinados batem com o banco (papel, status, cadastro, datas)", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);

    const cases: Array<{ name: string; set: () => Promise<void>; sql: string; params?: Array<string | number> }> = [
      { name: "papel líder", set: () => pickFilter(page, P, "role", "leader"), sql: "AND role = 'leader'" },
      { name: "inativos", set: () => pickFilter(page, P, "active", "inactive"), sql: "AND active = 0" },
      { name: "cadastro incompleto", set: () => pickFilter(page, P, "completed", "incomplete"), sql: "AND completed = 0" },
    ];
    for (const c of cases) {
      await whenLoaded(page, c.set);
      const expected = await dbCount(c.sql, c.params);
      expect(await totalFromSummary(page, P), c.name).toBe(expected);
      expect((await ids(page, "row")).length, c.name).toBe(Math.min(PAGE_SIZE, expected));
      await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear-filters`).click());
      await searchTag(page);
    }

    await whenLoaded(page, () => pickFilter(page, P, "role", "member"));
    await whenLoaded(page, () => pickFilter(page, P, "active", "active"));
    await whenLoaded(page, () => pickFilter(page, P, "completed", "completed"));
    const combined = await dbCount("AND role = 'member' AND active = 1 AND completed = 1");
    expect(combined).toBeGreaterThan(0);
    expect(await totalFromSummary(page, P)).toBe(combined);
    expect((await ids(page, "row")).sort()).toEqual((await dbIds("AND role = 'member' AND active = 1 AND completed = 1")).sort());

    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear-filters`).click());
    await searchTag(page);
    const today = localShift(0);
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdFrom`), today));
    expect(await totalFromSummary(page, P)).toBe(await dbCount("AND createdAt >= ?", [`${today} 00:00:00`]));
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdFrom`), localAddDays(today, 2)));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdFrom`), ""));
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdTo`), localAddDays(today, -2)));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdTo`), localAddDays(today, 1)));
    expect(await totalFromSummary(page, P)).toBe(TOTAL);
  });

  test("ordenação pelo cabeçalho (sem seletor no desktop): a ordem das linhas é a do banco", async ({ page, request }) => {
    await open(page, request);
    await expect(page.getByTestId(`${P}-filter-sort`)).toHaveCount(0);
    await searchTag(page);
    await whenLoaded(page, () => page.getByTestId("users-sort-name").click());
    const rowsOf = async () => (await ids(page, "row"));
    expect(await rowsOf()).toEqual((await dbIds("", [], "name ASC")).slice(0, PAGE_SIZE));
    await whenLoaded(page, () => page.getByTestId("users-sort-name").click());
    expect(await rowsOf()).toEqual((await dbIds("", [], "name DESC")).slice(0, PAGE_SIZE));
    // cabeçalho: já está em name:DESC, o clique inverte para ASC
    await whenLoaded(page, () => page.getByTestId(`${P}-sort-name`).click());
    expect(await rowsOf()).toEqual((await dbIds("", [], "name ASC")).slice(0, PAGE_SIZE));
    await whenLoaded(page, () => page.getByTestId(`${P}-sort-createdAt`).click());
    await expect(page.getByTestId(`${P}-sort-createdAt`)).toHaveClass(/Mui-active/);
    // a ordenação não conta como filtro ativo
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeEnabled();
  });

  test("paginação: próxima, anterior e ir para a página 2, com resumo e linhas do banco", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);
    await whenLoaded(page, () => page.getByTestId("users-sort-name").click());
    const all = await dbIds("", [], "name ASC");
    await expect(summaryOf(page, P)).toHaveText(`1–${PAGE_SIZE} de ${TOTAL}`);
    const first = await ids(page, "row");
    expect(first).toEqual(all.slice(0, PAGE_SIZE));
    const pages = page.getByTestId(`${P}-pagination-pages`);
    await whenLoaded(page, () => pages.getByRole("button", { name: "Próxima página" }).click());
    await expect(summaryOf(page, P)).toHaveText(`${PAGE_SIZE + 1}–${TOTAL} de ${TOTAL}`);
    expect(await ids(page, "row")).toEqual(all.slice(PAGE_SIZE));
    await whenLoaded(page, () => pages.getByRole("button", { name: "Página anterior" }).click());
    expect(await ids(page, "row")).toEqual(first);
    await whenLoaded(page, () => pages.getByRole("button", { name: "Ir para a página 2" }).click());
    expect((await ids(page, "row")).length).toBe(TOTAL - PAGE_SIZE);
  });

  test("vazio por busca e por filtro; limpar filtros volta à lista", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page, NOBODY);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await expect(page.getByTestId(`${P}-empty`)).toContainText("ajustar");
    await expect(summaryOf(page, P)).toHaveText("0 itens");
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear`).click());
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
    await searchTag(page);
    await whenLoaded(page, () => pickFilter(page, P, "role", "leader"));
    await whenLoaded(page, () => pickFilter(page, P, "completed", "completed"));
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdTo`), localAddDays(localShift(0), -5)));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear-filters`).click());
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-filter-createdTo`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
    expect((await ids(page, "row")).length).toBeGreaterThan(0);
  });

  test("estabilidade: frame e toolbar não mudam de lugar entre carga, vazio, lista e página 2", async ({ page, request }) => {
    await open(page, request);
    const base = await measureShell(page, P);
    await searchTag(page);
    expectSameShell(await measureShell(page, P), base, "lista filtrada");
    await whenLoaded(page, () => page.getByTestId(`${P}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click());
    expectSameShell(await measureShell(page, P), base, "página 2");
    await searchTag(page, NOBODY);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    expectSameShell(await measureShell(page, P), base, "vazio");
    await searchTag(page);
    expectSameShell(await measureShell(page, P), base, "lista de novo");
  });

  test("largura: o frame ocupa 95% da área útil no desktop, sem rolagem lateral", async ({ page, request }) => {
    await open(page, request);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test("ações da linha: ver, WhatsApp, editar (grava no banco) e excluir (some do banco)", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);
    const target = seeds[1];
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(target.email));
    await expect(page.getByTestId(`${P}-row-${target.id}`)).toBeVisible();
    await expect(page.getByTestId(`${P}-row-name-${target.id}`)).toHaveText(target.name);
    await expect(page.getByTestId(`${P}-row-role-${target.id}`)).toHaveText("Líder");

    const wa = await page.getByTestId(`${P}-row-whatsapp-${target.id}`).getAttribute("href");
    expect(wa).toContain("wa.me");
    expect(wa).toContain(target.phone);

    await page.getByTestId(`${P}-row-view-${target.id}`).click();
    await expect(page.getByTestId("user-view-dialog")).toContainText(target.email);
    await page.getByTestId("user-view-close").click();
    await expect(page.getByTestId("user-view-dialog")).toHaveCount(0);

    await page.getByTestId(`${P}-row-edit-${target.id}`).click();
    const newName = `${TAG} Editada ${pad(1)}`;
    await page.getByTestId("user-edit-name").fill(newName);
    await page.getByTestId("user-edit-active").setChecked(false);
    await page.getByTestId("user-edit-submit").click();
    await expect(page.getByTestId("user-edit-dialog")).toHaveCount(0, { timeout: 15_000 });
    // o servidor normaliza o nome (primeira letra maiúscula): compara sem diferenciar caixa
    await expect.poll(async () => (await queryOne<{ name: string }>("SELECT name FROM users WHERE id = ?", [target.id]))?.name.toLowerCase()).toBe(newName.toLowerCase());
    expect((await queryOne<{ active: number }>("SELECT active FROM users WHERE id = ?", [target.id]))?.active).toBe(0);
    await expect(page.getByTestId(`${P}-row-name-${target.id}`)).toHaveText(new RegExp(`^${newName}$`, "i"), { timeout: 15_000 });
    await expect(page.getByTestId(`${P}-row-active-${target.id}`)).toHaveText("Não");
    seeds[1] = { ...target, name: newName, active: false };

    const victim = seeds[13];
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(victim.email));
    await page.getByTestId(`${P}-row-delete-${victim.id}`).click();
    await page.getByTestId("delete-confirmation-modal-cancel").first().click();
    expect(await countRows("users", { id: victim.id })).toBe(1);
    await page.getByTestId(`${P}-row-delete-${victim.id}`).click();
    await page.getByTestId("delete-confirmation-modal-confirm").first().click();
    await expect.poll(() => countRows("users", { id: victim.id }), { timeout: 15_000 }).toBe(0);
    await expect(page.getByTestId(`${P}-row-${victim.id}`)).toHaveCount(0, { timeout: 15_000 });
    seeds.splice(13, 1);
  });

  test("criar pela tela: o usuário aparece na lista e no banco; senhas diferentes são recusadas", async ({ page, request }) => {
    await open(page, request);
    const email = `${TAG}-novo@orfanatonib.test`;
    await page.getByTestId(`${P}-create-button`).click();
    await page.getByTestId("user-create-name").fill(`${TAG} Criado Pela Tela`);
    await page.getByTestId("user-create-email").fill(email);
    await page.getByTestId("user-create-password").fill(ACTOR_PASSWORD);
    await page.getByTestId("user-create-confirm-password").fill(`${ACTOR_PASSWORD}x`);
    await page.getByTestId("user-create-submit").click();
    await expect(page.getByTestId("user-create-error")).toBeVisible();
    expect(await countRows("users", { email })).toBe(0);
    await page.getByTestId("user-create-confirm-password").fill(ACTOR_PASSWORD);
    await page.getByTestId("user-create-role").click();
    await page.getByTestId("user-create-role-option-leader").click();
    await page.getByTestId("user-create-submit").click();
    await expect(page.getByTestId("user-create-dialog")).toHaveCount(0, { timeout: 15_000 });
    const row = await queryOne<{ id: string; role: string }>("SELECT id, role FROM users WHERE email = ?", [email]);
    expect(row?.role).toBe("leader");
    extraIds.push(String(row?.id));
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(email));
    await expect(page.getByTestId(`${P}-row-${row?.id}`)).toBeVisible();
  });

  test("erro real: com a flag user_management desligada a atualização falha e mostra o erro com 'tentar novamente'", async ({ page, request }) => {
    await open(page, request);
    await withFlagsOff(request, adminToken, ["user_management"], async () => {
      await page.getByTestId(`${P}-toolbar-refresh`).click();
      await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 20_000 });
    });
    await page.getByTestId(`${P}-toolbar-refresh`).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId(`${P}-table`)).toBeVisible();
  });

  test("flag desligada: a rota não carrega a gestão", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await withFlagsOff(request, adminToken, ["user_management"], async () => {
      await page.goto("/adm/usuarios");
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("users-manager")).toHaveCount(0);
    });
  });

  test("RBAC: líder e membro não acessam /adm/usuarios e a API recusa a listagem", async ({ page, request }) => {
    for (const role of ["leader", "member"] as const) {
      const tokens = await loginAs(request, role);
      const res = await request.get(`${API_URL}/users?page=1&limit=1`, { headers: authHeaders(tokens.accessToken) });
      expect(res.status(), role).toBe(403);
      await seedBrowserSession(page, tokens);
      await page.goto("/adm/usuarios");
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("users-manager"), role).toHaveCount(0);
    }
  });

  test("@mobile 375px: cartões (sem tabela), 98%, filtros atrás do botão, sem rolagem lateral e ações de 44px", async ({ page, request, context }) => {
    await open(page, request);
    await searchTag(page);
    await expect(page.getByTestId(`${P}-cards`)).toBeVisible();
    await expect(page.getByTestId(`${P}-table`)).toHaveCount(0);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toBeVisible();
    await expect(page.getByTestId(`${P}-filter-role`)).toBeHidden();
    await openFiltersIfMobile(page, P);
    await expect(page.getByTestId(`${P}-filter-role`)).toBeVisible();

    const first = (await ids(page, "card"))[0];
    for (const key of ["view", "edit", "delete", "whatsapp", "copy-email"]) {
      const box = await page.getByTestId(`${P}-card-${key}-${first}`).boundingBox();
      expect(box?.height ?? 0, key).toBeGreaterThanOrEqual(43.5);
      expect(box?.width ?? 0, key).toBeGreaterThanOrEqual(43.5);
    }
    const seed = seeds.find((s) => s.id === first);
    expect(seed).toBeTruthy();
    await expect(page.getByTestId(`${P}-card-title-${first}`)).toHaveText(seed!.name);
    await expect(page.getByTestId(`${P}-card-email-${first}`)).toHaveText(seed!.email);

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId(`${P}-card-copy-email-${first}`).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(seed!.email);

    await page.getByTestId(`${P}-card-view-${first}`).click();
    await expect(page.getByTestId("user-view-dialog")).toBeVisible();
    await page.getByTestId("user-view-close").click();
    await page.getByTestId(`${P}-card-edit-${first}`).click();
    await expect(page.getByTestId("user-edit-dialog")).toBeVisible();
    await page.getByTestId("user-edit-cancel").click();
    await expect(page.getByTestId("user-edit-dialog")).toHaveCount(0);
    await page.getByTestId(`${P}-card-delete-${first}`).click();
    await page.getByTestId("delete-confirmation-modal-cancel").first().click();
    expect(await countRows("users", { id: first })).toBe(1);
  });

  test("@mobile 375px: filtro combinado, ordenação, paginação e vazio no servidor; casca estável", async ({ page, request }) => {
    await open(page, request);
    const base = await measureShell(page, P);
    await searchTag(page);
    await openFiltersIfMobile(page, P);
    await whenLoaded(page, () => pickFilter(page, P, "sort", "name:ASC"));
    const all = await dbIds("", [], "name ASC");
    expect(await ids(page, "card")).toEqual(all.slice(0, PAGE_SIZE));
    await whenLoaded(page, () => page.getByTestId(`${P}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click());
    expect(await ids(page, "card")).toEqual(all.slice(PAGE_SIZE));
    await whenLoaded(page, () => pickFilter(page, P, "role", "leader"));
    const leaders = await dbCount("AND role = 'leader'");
    expect(await totalFromSummary(page, P)).toBe(leaders);
    await whenLoaded(page, () => pickFilter(page, P, "active", "inactive"));
    expect(await totalFromSummary(page, P)).toBe(await dbCount("AND role = 'leader' AND active = 0"));
    await searchTag(page, NOBODY);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    const shell = await measureShell(page, P);
    expect(Math.abs(shell.frame.x - base.frame.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(shell.frame.width - base.frame.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(shell.toolbar.y - base.toolbar.y)).toBeLessThanOrEqual(1);
  });

  // MASSA (regra do E2E): 5 a 10 usuários novos por execução, criados pela UI, que ficam e acumulam.
  test("massa: cria de 5 a 10 usuários pela tela e eles ficam no banco e na lista", async ({ page, request }) => {
    test.setTimeout(240_000);
    await open(page, request);
    const quantity = massCount();
    for (let i = 0; i < quantity; i += 1) {
      const email = `${TAG}-massa${pad(i)}@orfanatonib.test`;
      await page.getByTestId(`${P}-create-button`).click();
      await page.getByTestId("user-create-name").fill(`${TAG} Massa ${pad(i)}`);
      await page.getByTestId("user-create-email").fill(email);
      await page.getByTestId("user-create-password").fill(ACTOR_PASSWORD);
      await page.getByTestId("user-create-confirm-password").fill(ACTOR_PASSWORD);
      await page.getByTestId("user-create-phone").fill(`1198888${pad(i)}00`);
      await page.getByTestId("user-create-role").click();
      await page.getByTestId(`user-create-role-option-${i % 2 === 0 ? "member" : "leader"}`).click();
      await page.getByTestId("user-create-submit").click();
      await expect(page.getByTestId("user-create-dialog")).toHaveCount(0, { timeout: 15_000 });
      const row = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", [email]);
      expect(row?.id, email).toBeTruthy();
      extraIds.push(String(row?.id));
    }
    await searchTag(page, `${TAG}-massa`);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(quantity);
  });

});
