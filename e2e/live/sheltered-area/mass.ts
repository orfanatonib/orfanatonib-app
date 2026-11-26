import type { APIRequestContext, Browser, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession } from "../support/live";
import { createShelter } from "../shelters/support";
import { ACTOR_PASSWORD } from "../users/support";
import { P, linkLeader, linkMember } from "./support";
import { createShelteredViaUi, registerDecisionViaUi, savePagela, searchByName, type ShelteredInput } from "./ui-actions";

/** Massa persistente da Área dos Acolhidos: nomes fixos (prefixo `MASSA E2E`), criada e acumulada pela UI. */
export const MASSA = "MASSA E2E";
export const MASSA_SHELTER = `${MASSA} Abrigo Acolhidos`;
export const MASSA_LEADER_EMAIL = "massa.e2e.lider.acolhidos@orfanatonib.test";
export const MASSA_MEMBER_EMAIL = "massa.e2e.membro.acolhidos@orfanatonib.test";
export const PAGELA_WEEKS = 4;
const YEAR = 2026;

export interface Session {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface MassWorld {
  admin: string;
  shelter: { id: string; name: string };
  leader: Session;
  member: Session;
  memberProfileId: string;
}

async function ensureUser(request: APIRequestContext, admin: string, role: "leader" | "member", email: string, name: string): Promise<Session> {
  let row = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", [email]);
  if (!row) {
    const res = await request.post(`${API_URL}/users`, {
      headers: authHeaders(admin),
      data: { name, email, phone: "11999990000", password: ACTOR_PASSWORD, role, active: true, completed: true, commonUser: false },
    });
    expect(res.status(), await res.text()).toBe(201);
    row = { id: ((await res.json()) as { id: string }).id };
  }
  const login = await request.post(`${API_URL}/auth/login`, { data: { email, password: ACTOR_PASSWORD } });
  expect(login.status(), await login.text()).toBe(201);
  const body = (await login.json()) as { accessToken: string; refreshToken: string };
  return { id: row.id, email, accessToken: body.accessToken, refreshToken: body.refreshToken };
}

/** Abrigo, equipe, líder e membro com nomes fixos: reaproveita o que já existe e só completa o que falta. */
export async function ensureMassWorld(request: APIRequestContext): Promise<MassWorld> {
  const admin = (await loginAs(request, "admin")).accessToken;
  let shelter = await queryOne<{ id: string; name: string }>("SELECT id, name FROM shelters WHERE name = ?", [MASSA_SHELTER]);
  if (!shelter) {
    const created = await createShelter(request, admin, { name: MASSA_SHELTER, teamsQuantity: 1 });
    shelter = { id: created.id, name: MASSA_SHELTER };
  }
  const leader = await ensureUser(request, admin, "leader", MASSA_LEADER_EMAIL, `${MASSA} Líder`);
  const member = await ensureUser(request, admin, "member", MASSA_MEMBER_EMAIL, `${MASSA} Membro`);
  await linkLeader(request, admin, leader.id, shelter.id);
  await linkMember(request, admin, member.id, shelter.id);
  const profile = await queryOne<{ id: string }>("SELECT id FROM member_profiles WHERE user_id = ?", [member.id]);
  return { admin, shelter, leader, member, memberProfileId: profile!.id };
}

const nn = (i: number): string => String(i + 1).padStart(2, "0");
export const massName = (i: number): string => `${MASSA} ${RUN_TAG} acolhido ${nn(i)}`;

const CITIES = ["Manaus", "Manaus", "Iranduba", "Manacapuru", "Parintins", "Manaus"];
const BIRTHS = ["2011-02-14", "2013-08-01", "2015-05-20", "2017-11-03", "2018-01-27", "2019-09-09", "2012-12-12", "2014-06-30"];

export const massInput = (i: number, shelterName: string): ShelteredInput => ({
  name: massName(i),
  gender: i % 2 === 0 ? "M" : "F",
  guardianName: `${MASSA} Resp ${nn(i)}`,
  phone: `9298${String(Date.now()).slice(-5)}${i % 10}`.slice(0, 11),
  birth: BIRTHS[i % BIRTHS.length],
  joinedAt: "2025-02-10",
  street: `Rua ${shelterName.slice(-5)} ${i + 1}`,
  number: String(100 + i),
  district: i % 2 === 0 ? "Centro" : "Cidade Nova",
  city: CITIES[i % CITIES.length],
  state: "AM",
  postalCode: "69000000",
});

const MEDITATIONS = ["Salmo 23: o Senhor é o meu pastor", "João 3:16: Deus amou o mundo", "Filipenses 4:13: tudo posso", "Provérbios 3:5: confie no Senhor"];

export const massPagelaNote = (i: number, week: number): string =>
  `Meditação: ${MEDITATIONS[(i + week) % MEDITATIONS.length]}. Versículo ${(i + week) % 3 === 0 ? "decorado" : "em andamento"}. ${week % 2 ? "Participou bem." : "Precisa de incentivo."}`;

export async function newSessionPage(browser: Browser, session: Session, width = 1440): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 }, locale: "pt-BR", timezoneId: "America/Manaus" });
  const page = await context.newPage();
  await seedBrowserSession(page, { accessToken: session.accessToken, refreshToken: session.refreshToken, userId: session.id });
  await page.goto("/area-dos-acolhidos");
  await expect(page.getByTestId(`${P}-list`).or(page.getByTestId(`${P}-empty`))).toBeVisible({ timeout: 30_000 });
  return page;
}

const idOf = async (name: string): Promise<string> => {
  const row = await queryOne<{ id: string }>("SELECT id FROM sheltered WHERE name = ?", [name]);
  expect(row, `acolhido ${name} gravado`).not.toBeNull();
  return row!.id;
};

export interface MassResult {
  names: string[];
  ids: string[];
}

/**
 * Cria `count` acolhidos PELA UI: o líder cadastra a primeira metade (e registra decisões/desativa alguns), o membro a
 * segunda; depois o membro lança `PAGELA_WEEKS` semanas de pagela (presença/observação variadas) para todos.
 */
export async function createMassViaUi(browser: Browser, world: MassWorld, count: number): Promise<MassResult> {
  const names = Array.from({ length: count }, (_, i) => massName(i));
  const half = Math.ceil(count / 2);

  const leaderPage = await newSessionPage(browser, world.leader);
  for (let i = 0; i < half; i += 1) await createShelteredViaUi(leaderPage, massInput(i, world.shelter.name));
  for (let i = 0; i < half; i += 1) {
    const id = await idOf(names[i]);
    if (i % 2 === 0 || i % 3 === 0) {
      await searchByName(leaderPage, names[i]);
      await expect(leaderPage.getByTestId(`${P}-card-${id}`)).toBeVisible({ timeout: 15_000 });
      if (i % 2 === 0) await registerDecisionViaUi(leaderPage, id, `Decisão de ${names[i]}`);
      if (i % 3 === 0 && i > 0) {
        await leaderPage.getByTestId(`${P}-card-status-${id}`).click({ force: true });
        await leaderPage.getByTestId(`${P}-card-status-dialog-${id}-confirm`).click();
        await expect.poll(async () => (await queryOne<{ active: number }>("SELECT active FROM sheltered WHERE id = ?", [id]))?.active).toBe(0);
      }
    }
  }
  await leaderPage.context().close();

  const memberPage = await newSessionPage(browser, world.member);
  for (let i = half; i < count; i += 1) await createShelteredViaUi(memberPage, massInput(i, world.shelter.name));
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = await idOf(names[i]);
    ids.push(id);
    if (i >= half && i % 2 === 0) {
      await searchByName(memberPage, names[i]);
      await expect(memberPage.getByTestId(`${P}-card-${id}`)).toBeVisible({ timeout: 15_000 });
      await registerDecisionViaUi(memberPage, id, `Decisão de ${names[i]}`);
    }
  }
  for (let i = 0; i < count; i += 1) {
    await memberPage.goto(`/area-dos-acolhidos/${ids[i]}`);
    await expect(memberPage.getByTestId("pagela-form")).toBeVisible({ timeout: 20_000 });
    for (let k = 0; k < PAGELA_WEEKS; k += 1) {
      const week = 3 + k + (i % 3);
      await savePagela(memberPage, { year: YEAR, week, present: (i + k) % 4 !== 0, notes: massPagelaNote(i, week) });
      await expect(memberPage.getByTestId("sheltered-pagelas-snackbar")).toContainText(/Pagela (salva|atualizada)!/, { timeout: 15_000 });
    }
  }
  await memberPage.context().close();

  await verifyMass(world, names);
  return { names, ids };
}

/** Prova no banco: cada acolhido existe no abrigo, tem endereço e ≥ `PAGELA_WEEKS` pagelas do membro. */
export async function verifyMass(world: MassWorld, names: string[]): Promise<void> {
  for (const name of names) {
    const row = await queryOne<{ id: string; shelter_id: string; city: string | null }>(
      "SELECT s.id, s.shelter_id, a.city AS city FROM sheltered s LEFT JOIN addresses a ON a.id = s.address_id WHERE s.name = ?",
      [name],
    );
    expect(row, name).not.toBeNull();
    expect(row!.shelter_id).toBe(world.shelter.id);
    expect(row!.city).toBeTruthy();
    const pagelas = await queryAll<{ member_profile_id: string }>("SELECT member_profile_id FROM pagelas WHERE sheltered_id = ?", [row!.id]);
    expect(pagelas.length, `${name}: pagelas`).toBeGreaterThanOrEqual(PAGELA_WEEKS);
    expect(pagelas.every((p) => p.member_profile_id === world.memberProfileId)).toBe(true);
  }
}

export function printMass(world: MassWorld, result: MassResult): void {
  // eslint-disable-next-line no-console
  console.log(
    [
      "",
      `=== Massa da Área dos Acolhidos: +${result.names.length} acolhidos (cada um com ${PAGELA_WEEKS}+ semanas de pagela) ===`,
      `Líder:  ${world.leader.email} / ${ACTOR_PASSWORD}`,
      `Membro: ${world.member.email} / ${ACTOR_PASSWORD}`,
      `Abrigo: ${world.shelter.name} (${world.shelter.id})`,
      "URL: http://localhost:5173/area-dos-acolhidos",
      `Primeiros: ${result.names.slice(0, 3).join(" | ")}`,
      "",
    ].join("\n"),
  );
}
