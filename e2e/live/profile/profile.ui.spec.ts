import { queryAll } from "../support/db";
import { cleanupData } from "../support/keep-data";
import {
  addDays,
  cardIds,
  clearAllFilters,
  expectCards,
  filtersVisible,
  openAs,
  PAGE_SIZE,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  type ListScreen,
} from "../support/admin-list-ui";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { profileSeeds, removeProfiles, seedProfile, usersWithTag, type SeededProfile } from "./support";
import { localShift } from "../support/local-day";

const SCREEN: ListScreen = { p: "profiles", path: "/adm/perfis", endpoint: "/profiles" };
const { p } = SCREEN;
const JOIN = "FROM users u LEFT JOIN personal_data pd ON pd.userId = u.id LEFT JOIN user_preferences up ON up.userId = u.id";
const ROLE_LABEL: Record<string, string> = { leader: "Líder", member: "Membro", admin: "Admin" };

test.describe.serial("Perfis (Nossa Família): casca única, filtros no servidor e cartões (UI real)", () => {
  const tag = `e2e-pf-${Date.now().toString(36)}`;
  let people: SeededProfile[] = [];
  let admin = "";

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const seed of profileSeeds(tag)) people.push(await seedProfile(request, admin, seed));
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await removeProfiles(request, admin, people.map((person) => person.id));
      expect(await usersWithTag(tag)).toBe(0);
    });
  });

  const ids = (): string[] => people.map((person) => person.id);
  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "u.name ASC"): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT u.id AS id ${JOIN} WHERE u.email LIKE ? ${extra} ORDER BY ${order}`, [`%${tag}%`, ...params])).map((row) => row.id);

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "profile_management",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids()[3],
    hasCreate: false,
    cardDeleteTestId: null,
    skipAccessTest: true,
  });

  test("acesso por papel: membro barrado; líder sem equipe vê o aviso (a lista com equipe está em profiles-leader-scope.ui); visitante vai para o login", async ({ page, request, browser }) => {
    const member = await browser.newContext();
    const memberPage = await member.newPage();
    await seedBrowserSession(memberPage, await loginAs(request, "member"));
    await memberPage.goto(SCREEN.path);
    await memberPage.waitForLoadState("networkidle");
    await expect(memberPage.getByTestId(`${p}-manager`)).toHaveCount(0);
    await expect(memberPage).not.toHaveURL(new RegExp(`${SCREEN.path}$`));
    await member.close();

    const leader = await browser.newContext();
    const leaderPage = await leader.newPage();
    await seedBrowserSession(leaderPage, await loginAs(request, "leader"));
    await leaderPage.goto(SCREEN.path);
    await expect(leaderPage).toHaveURL(new RegExp(`${SCREEN.path}$`));
    await expect(leaderPage.getByText("Nenhum abrigo vinculado")).toBeVisible({ timeout: 20_000 });
    await expect(leaderPage.getByTestId(`${p}-manager`)).toHaveCount(0);
    await leader.close();

    await page.goto(SCREEN.path);
    await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test("filtro de papel: líder e membro batem com o banco e com o rótulo do cartão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const leaders = await selectFilter(page, SCREEN, "role", "leader");
    expect(leaders.params.get("role")).toBe("leader");
    const dbLeaders = await expectedIds("AND u.role = 'leader'");
    expect(dbLeaders).toHaveLength(2);
    expect(leaders.body.meta?.totalItems).toBe(2);
    await expectCards(page, p, dbLeaders);
    for (const id of dbLeaders) await expect(page.getByTestId(`${p}-card-role-${id}`)).toHaveText("Líder");

    const members = await selectFilter(page, SCREEN, "role", "member");
    const dbMembers = await expectedIds("AND u.role = 'member'");
    expect(members.body.meta?.totalItems).toBe(dbMembers.length);
    await expectCards(page, p, dbMembers.slice(0, PAGE_SIZE));
    const all = await selectFilter(page, SCREEN, "role", "");
    expect(all.params.has("role")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(14);
  });

  test("filtro de gênero: feminino e masculino batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    for (const gender of ["Feminino", "Masculino"]) {
      const reply = await selectFilter(page, SCREEN, "gender", gender);
      expect(reply.params.get("gender")).toBe(gender);
      const db = await expectedIds("AND pd.gender = ?", [gender]);
      expect(db).toHaveLength(7);
      expect(reply.body.meta?.totalItems).toBe(7);
      await expectCards(page, p, db);
    }
  });

  test("filtro de mês de aniversário: cada mês bate com o banco e com a data do cartão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    for (const month of [1, 6, 12]) {
      const reply = await selectFilter(page, SCREEN, "birthMonth", String(month));
      expect(reply.params.get("birthMonth")).toBe(String(month));
      const db = await expectedIds("AND MONTH(pd.birthDate) = ?", [month]);
      expect(db.length).toBeGreaterThan(0);
      expect(reply.body.meta?.totalItems).toBe(db.length);
      await expectCards(page, p, db);
    }
    const any = await selectFilter(page, SCREEN, "birthMonth", "");
    expect(any.params.has("birthMonth")).toBe(false);
  });

  test("filtros de preferências (temperamento, linguagem do amor, cor): texto com debounce, no servidor", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await filtersVisible(page, p);
    const typed = async (key: string, value: string) => {
      const waiting = page.waitForResponse((response) => new URL(response.url()).searchParams.get(key) === value);
      await page.getByTestId(`${p}-filter-${key}`).fill(value);
      await waiting;
    };
    await typed("temperaments", "Colérico");
    const dbTemperament = await expectedIds("AND up.temperaments LIKE ?", ["%Colérico%"]);
    await expectCards(page, p, dbTemperament);
    for (const id of dbTemperament) await expect(page.getByTestId(`${p}-card-temperament-${id}`)).toHaveText("Colérico");

    await typed("favoriteColor", "Verde");
    const dbBoth = await expectedIds("AND up.temperaments LIKE ? AND up.favoriteColor LIKE ?", ["%Colérico%", "%Verde%"]);
    await expectCards(page, p, dbBoth);

    await typed("loveLanguages", "Toque");
    const dbThree = await expectedIds("AND up.temperaments LIKE ? AND up.favoriteColor LIKE ? AND up.loveLanguages LIKE ?", ["%Colérico%", "%Verde%", "%Toque%"]);
    await expectCards(page, p, dbThree);
    await clearAllFilters(page, SCREEN);
    await expect(page.getByTestId(`${p}-filter-temperaments`)).toHaveValue("");
  });

  test("filtro de datas de cadastro: de hoje, até ontem e a partir de amanhã batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = localShift();
    const from = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(from.body.meta?.totalItems).toBe((await expectedIds("AND u.createdAt >= ?", [today])).length);
    const to = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(to.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    const inclusive = await setDateFilter(page, SCREEN, "createdTo", today);
    expect(inclusive.body.meta?.totalItems).toBe((await expectedIds("AND u.createdAt >= ? AND u.createdAt < ?", [today, addDays(today, 1)])).length);
    await setDateFilter(page, SCREEN, "createdFrom", addDays(today, 1));
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação: nome, e-mail, cadastro e idade seguem o banco nas duas direções", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const cases: Array<[string, string]> = [
      ["name:DESC", "u.name DESC"],
      ["email:ASC", "u.email ASC"],
      ["email:DESC", "u.email DESC"],
      ["createdAt:ASC", "u.createdAt ASC"],
      ["createdAt:DESC", "u.createdAt DESC"],
      ["birthDate:ASC", "pd.birthDate ASC"],
      ["birthDate:DESC", "pd.birthDate DESC"],
      ["name:ASC", "u.name ASC"],
    ];
    for (const [value, order] of cases) {
      const reply = await selectFilter(page, SCREEN, "sort", value);
      const [sortBy, direction] = value.split(":");
      expect(reply.params.get("sortBy")).toBe(sortBy);
      expect(reply.params.get("order")).toBe(direction);
      await expectCards(page, p, (await expectedIds("", [], order)).slice(0, PAGE_SIZE));
    }
  });

  test("busca olha nome e e-mail; filtros combinados: busca + papel + gênero + mês + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byEmail = await searchFor(page, SCREEN, `g.${tag}@`);
    expect(byEmail.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids()[6]]);

    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "role", "member");
    await selectFilter(page, SCREEN, "gender", "Feminino");
    await selectFilter(page, SCREEN, "birthMonth", "5");
    const reply = await selectFilter(page, SCREEN, "sort", "email:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, role: "member", gender: "Feminino", birthMonth: "5", sortBy: "email", order: "DESC" });
    const expected = await expectedIds("AND u.role = 'member' AND pd.gender = 'Feminino' AND MONTH(pd.birthDate) = 5", [], "u.email DESC");
    expect(expected.length).toBeGreaterThan(0);
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected);
    const cleared = await clearAllFilters(page, SCREEN);
    for (const key of ["role", "gender", "birthMonth", "search"]) expect(cleared.params.has(key)).toBe(false);
    expect(cleared.params.get("sortBy")).toBe("email");
  });

  test("cartão: nome, papel, e-mail, aniversário com idade, preferências e data de cadastro", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const person = people[3];
    await expect(page.getByTestId(`${p}-card-title-${person.id}`)).toHaveText(person.name);
    await expect(page.getByTestId(`${p}-card-role-${person.id}`)).toHaveText(ROLE_LABEL[person.role]);
    await expect(page.getByTestId(`${p}-card-email-${person.id}`)).toHaveText(person.email);
    await expect(page.getByTestId(`${p}-card-birth-${person.id}`)).toContainText("15 ");
    await expect(page.getByTestId(`${p}-card-birth-${person.id}`)).toContainText("anos");
    await expect(page.getByTestId(`${p}-card-temperament-${person.id}`)).toHaveText(person.temperaments.split(" ")[0]);
    await expect(page.getByTestId(`${p}-card-color-${person.id}`)).toHaveText(person.favoriteColor);
    await expect(page.getByTestId(`${p}-card-created-${person.id}`)).toContainText("Cadastro em");
    await expect(page.getByTestId(`${p}-card-role-${people[0].id}`)).toHaveText("Líder");
  });

  test("abrir o cartão mostra o perfil com dados do banco e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const person = people[3];
    await page.getByTestId(`${p}-card-open-${person.id}`).click();
    const modal = page.getByTestId("profile-detail-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("profile-detail-name")).toHaveText(person.name);
    await expect(page.getByTestId("profile-detail-role")).toHaveText(ROLE_LABEL[person.role]);
    await expect(page.getByTestId("profile-detail-age")).toContainText("anos");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("painel de aniversariantes: pessoa que faz aniversário hoje aparece em 'Hoje' e abre o perfil", async ({ page, request }) => {
    const now = new Date();
    const birthDate = `1991-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const person = await seedProfile(request, admin, {
      name: `${tag} Aniversariante`,
      email: `aniversariante.${tag}@orfanatonib.test`,
      role: "member",
      gender: "Feminino",
      birthDate,
      temperaments: "Sanguíneo",
      loveLanguages: "Toque físico",
      favoriteColor: "Azul",
    });
    try {
      const birthdays = page.waitForResponse((response) => new URL(response.url()).searchParams.has("birthMonth"));
      await openAs(page, request, SCREEN);
      const reply = await birthdays;
      expect(new URL(reply.url()).searchParams.get("birthMonth")).toBe(String(now.getMonth() + 1));
      await expect(page.getByTestId("profiles-birthdays")).toBeVisible();
      const today = page.getByTestId("birthday-section-today");
      await expect(today).toBeVisible();
      await expect(page.getByTestId(`birthday-avatar-${person.id}`)).toBeVisible();
      await searchFor(page, SCREEN, `aniversariante.${tag}`);
      await expect(page.getByTestId(`${p}-card-birthday-today-${person.id}`)).toBeVisible();
      await page.getByTestId(`birthday-avatar-${person.id}`).click();
      await expect(page.getByTestId("profile-detail-modal")).toBeVisible();
      await expect(page.getByTestId("profile-detail-name")).toHaveText(person.name);
    } finally {
      await cleanupData(async () => { await removeProfiles(request, admin, [person.id]); });
    }
  });

  test("@mobile cartão no celular: toda a área do cartão abre o perfil e os filtros funcionam pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const person = people[3];
    const box = await page.getByTestId(`${p}-card-open-${person.id}`).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await filtersVisible(page, p);
    const reply = await selectFilter(page, SCREEN, "gender", "Feminino");
    expect(reply.params.get("gender")).toBe("Feminino");
    expect((await cardIds(page, p)).length).toBeGreaterThan(0);
    await page.getByTestId(`${p}-card-open-${(await cardIds(page, p))[0]}`).click();
    await expect(page.getByTestId("profile-detail-modal")).toBeVisible();
  });
});
