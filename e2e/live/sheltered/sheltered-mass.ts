import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";
import { createShelter } from "../shelters/support";

/**
 * Massa de acolhidos (regra de massa do E2E): criada PELA UI de /adm/acolhidos e deixada no banco.
 * Compartilhada pelo bloco "massa" da suíte normal (`sheltered.ui.spec.ts`) e pelo spec `@seed`.
 * Nomes: `MASSA E2E Acolhido <runTag> NN <Nome>`; abrigos `MASSA E2E Abrigo <Sol|Lua|Estrela>` (idempotentes).
 */
export const MASS_PREFIX = "MASSA E2E";
export const MASS_SHELTER_NAMES = [`${MASS_PREFIX} Abrigo Sol`, `${MASS_PREFIX} Abrigo Lua`, `${MASS_PREFIX} Abrigo Estrela`] as const;

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Davi", "Elisa", "Fábio", "Gabi", "Hugo", "Isis", "João", "Kátia", "Lucas", "Maria", "Nuno", "Olívia", "Pedro", "Quézia", "Rafael", "Sara", "Tiago", "Úrsula", "Vitor", "Wanda", "Yuri"] as const;
const PLACES = [
  { city: "Manaus", state: "AM", district: "Centro" },
  { city: "Parintins", state: "AM", district: "Palmares" },
  { city: "Itacoatiara", state: "AM", district: "Jauary" },
  { city: "Manacapuru", state: "AM", district: "Morada do Sol" },
  { city: "Tefé", state: "AM", district: "Abial" },
  { city: "Belém", state: "PA", district: "Marco" },
] as const;

export type MassPlan = {
  name: string;
  gender: "M" | "F";
  shelter: string;
  guardian: string | null;
  phone: string | null;
  birth: Date;
  joined: Date;
  place: (typeof PLACES)[number];
  active: boolean;
  acceptedJesus: boolean;
};

const daysAgo = (days: number): Date => new Date(Date.now() - days * 86_400_000);
const ddmmyyyy = (date: Date): string =>
  `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;

/** Plano determinístico por posição: idade 2–16 anos, entrada nos últimos 3 anos, cidades e abrigos alternados. */
export function buildMassPlans(runTag: string, count: number, offset = 0): MassPlan[] {
  return Array.from({ length: count }, (_, k) => {
    const i = offset + k;
    const n = String(k + 1).padStart(2, "0");
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    return {
      name: `${MASS_PREFIX} Acolhido ${runTag} ${n} ${first}`,
      gender: i % 2 === 0 ? "F" : "M",
      shelter: MASS_SHELTER_NAMES[i % MASS_SHELTER_NAMES.length],
      guardian: i % 6 === 5 ? null : `Responsável ${FIRST_NAMES[(i + 5) % FIRST_NAMES.length]} ${n}`,
      phone: i % 6 === 5 ? null : `9298${String(1000000 + ((i * 4231) % 9000000)).slice(0, 7)}`,
      birth: daysAgo((2 + ((i * 7) % 15)) * 365 + ((i * 37) % 300)),
      joined: daysAgo(30 + ((i * 41) % 1000)),
      place: PLACES[i % PLACES.length],
      active: i % 5 !== 4,
      acceptedJesus: i % 3 === 0,
    };
  });
}

export async function ensureMassShelter(request: APIRequestContext, token: string, name: string): Promise<string> {
  const found = await queryOne<{ id: string }>("SELECT id FROM shelters WHERE name = ?", [name]);
  if (found) return found.id;
  return (await createShelter(request, token, { name, teamsQuantity: 2 })).id;
}

async function typeDate(page: Page, testId: string, date: Date): Promise<void> {
  // MUI X v8: o campo é um grupo de partes (dia/mês/ano) e não um textbox. Clica na 1ª parte e digita só
  // os dígitos; o foco avança sozinho (`getByRole("textbox")` aqui ficava esperando até estourar o teste).
  const firstPart = page.getByTestId(testId).getByRole("spinbutton").first();
  await firstPart.click();
  await page.keyboard.type(ddmmyyyy(date));
}

/** Cria um acolhido pelo formulário da tela (a tela precisa estar aberta em /adm/acolhidos). */
export async function createMassThroughUi(page: Page, plan: MassPlan): Promise<string> {
  await page.getByTestId("sheltered-create").click();
  await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
  await page.getByTestId("sheltered-form-name").locator("input").fill(plan.name);
  await page.getByTestId("sheltered-form-gender").click();
  await page.getByTestId(plan.gender === "M" ? "sheltered-form-gender-male" : "sheltered-form-gender-female").click();
  await typeDate(page, "sheltered-form-birth-date", plan.birth);
  await typeDate(page, "sheltered-form-joined-at", plan.joined);
  if (plan.guardian) await page.getByTestId("sheltered-form-guardian-name").locator("input").fill(plan.guardian);
  if (plan.phone) await page.getByTestId("sheltered-form-guardian-phone").locator("input").fill(plan.phone);
  await page.getByTestId("sheltered-form-shelter-autocomplete").getByRole("combobox").fill(plan.shelter);
  await page.getByRole("option", { name: plan.shelter }).first().click();
  await page.getByTestId("sheltered-form-street").locator("input").fill(`Rua ${plan.place.district} ${plan.name.slice(-2)}`);
  await page.getByTestId("sheltered-form-number").locator("input").fill(String(100 + plan.name.length));
  await page.getByTestId("sheltered-form-district").locator("input").fill(plan.place.district);
  await page.getByTestId("sheltered-form-city").locator("input").fill(plan.place.city);
  await page.getByTestId("sheltered-form-state").locator("input").fill(plan.place.state);
  await page.getByTestId("sheltered-form-submit").click();
  await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 20_000 });
  await expect
    .poll(async () => (await queryOne<{ id: string }>("SELECT id FROM sheltered WHERE name = ?", [plan.name]))?.id ?? "", { timeout: 15_000 })
    .not.toBe("");
  return (await queryOne<{ id: string }>("SELECT id FROM sheltered WHERE name = ?", [plan.name]))!.id;
}

/** Status inativo e decisão "aceitou Jesus" (que a tela não edita) aplicados pela API real. */
export async function finishMassViaApi(request: APIRequestContext, token: string, id: string, plan: MassPlan): Promise<void> {
  const row = await queryOne<{ active: number }>("SELECT active FROM sheltered WHERE id = ?", [id]);
  if (Boolean(row?.active) !== plan.active) {
    const res = await request.patch(`${API_URL}/sheltered/${id}/status`, { headers: authHeaders(token), data: { active: plan.active } });
    expect(res.status(), await res.text()).toBeLessThan(300);
  }
  const decisions = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM accepted_christs WHERE sheltered_id = ?", [id]))?.n ?? 0);
  if (plan.acceptedJesus && decisions === 0) {
    const res = await request.post(`${API_URL}/accepted-christs`, {
      headers: authHeaders(token),
      data: { shelteredId: id, decision: "ACCEPTED", notes: `${MASS_PREFIX}: decisão de massa` },
    });
    expect(res.status(), await res.text()).toBeLessThan(300);
  }
}
