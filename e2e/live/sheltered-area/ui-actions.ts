import type { Page } from "@playwright/test";

import { expect } from "../support/live";
import { fillDatePickerGroup } from "../support/date-field";
import { P, PAGELA, PG, DECISION } from "./support";

export interface ShelteredInput {
  name: string;
  gender: "M" | "F";
  guardianName?: string;
  /** Só dígitos; a máscara é da tela. */
  phone?: string;
  birth: string;
  joinedAt?: string;
  street?: string;
  number?: string;
  district?: string;
  city: string;
  state: string;
  postalCode?: string;
  complement?: string;
}

const FORM = "sheltered-form";

const input = (page: Page, testId: string) => page.getByTestId(testId).locator("input, textarea").first();

/** Preenche o formulário do `ShelteredFormDialog` (já aberto) como uma pessoa faria. */
export async function fillShelteredForm(page: Page, data: Partial<ShelteredInput>): Promise<void> {
  if (data.name !== undefined) await input(page, `${FORM}-name`).fill(data.name);
  if (data.gender) {
    await page.getByTestId(`${FORM}-gender`).getByRole("combobox").click();
    await page.getByTestId(`${FORM}-gender-${data.gender === "M" ? "male" : "female"}`).click();
  }
  if (data.guardianName !== undefined) await input(page, `${FORM}-guardian-name`).fill(data.guardianName);
  if (data.phone !== undefined) {
    await input(page, `${FORM}-guardian-phone`).fill("");
    await input(page, `${FORM}-guardian-phone`).pressSequentially(data.phone);
  }
  if (data.birth !== undefined) await fillDatePickerGroup(page.getByTestId(`${FORM}-birth-date`), data.birth);
  if (data.joinedAt !== undefined) await fillDatePickerGroup(page.getByTestId(`${FORM}-joined-at`), data.joinedAt);
  const addr: Array<[string, string | undefined]> = [
    ["street", data.street],
    ["number", data.number],
    ["district", data.district],
    ["city", data.city],
    ["state", data.state],
    ["complement", data.complement],
  ];
  for (const [key, value] of addr) if (value !== undefined) await input(page, `${FORM}-${key}`).fill(value);
  if (data.postalCode !== undefined) {
    await input(page, `${FORM}-postal-code`).fill("");
    await input(page, `${FORM}-postal-code`).pressSequentially(data.postalCode);
  }
}

/** Abre "Cadastrar acolhido" (botão do desktop ou FAB do celular). */
export async function openCreateDialog(page: Page): Promise<void> {
  const mobile = (page.viewportSize()?.width ?? 1440) < 900;
  await page.getByTestId(mobile ? `${P}-create-fab` : `${P}-create`).click();
  await expect(page.getByTestId(`${FORM}-dialog`)).toBeVisible();
}

/** Cria um acolhido PELA UI e devolve o id (lido do banco pelo nome, na hora do chamador). */
export async function createShelteredViaUi(page: Page, data: ShelteredInput): Promise<void> {
  await openCreateDialog(page);
  await fillShelteredForm(page, data);
  await page.getByTestId(`${FORM}-submit`).click();
  await expect(page.getByTestId(`${FORM}-dialog`)).toHaveCount(0, { timeout: 20_000 });
}

/** Busca pelo nome exato e espera o cartão (um só) aparecer. */
export async function searchByName(page: Page, name: string): Promise<void> {
  // A busca tem debounce: espera a resposta já filtrada, senão o próximo clique usa o filtro antigo.
  const filtered = page.waitForResponse(
    (r) => r.request().method() === "GET" && new URL(r.url()).searchParams.get("searchString") === name,
    { timeout: 20_000 },
  );
  await page.getByTestId(`${P}-search`).fill(name);
  await filtered;
  await expect(page.getByTestId(`${P}-list`)).toBeVisible({ timeout: 20_000 });
}

export interface PagelaInput {
  year: number;
  week: number;
  present: boolean;
  notes?: string;
}

/** Preenche o formulário rápido de pagela e salva. Em celular, abre antes a gaveta pelo FAB. */
export async function savePagela(page: Page, data: PagelaInput, options: { sheet?: boolean } = {}): Promise<void> {
  const mobile = (page.viewportSize()?.width ?? 1440) < 600;
  if (mobile && options.sheet !== false) await page.getByTestId(`${PG}-create-fab`).click();
  await page.getByTestId(`${PAGELA}-form-year`).fill(String(data.year));
  await page.getByTestId(`${PAGELA}-form-week`).fill(String(data.week));
  const present = page.getByTestId(`${PAGELA}-form-present`);
  if ((await present.isChecked()) !== data.present) await present.click();
  const notes = page.getByTestId(`${PAGELA}-form-notes`);
  await notes.fill(data.notes ?? "");
  await page.getByTestId(`${PAGELA}-form-save`).click();
}

/** Registra a decisão por Cristo pelo coração do cartão. */
export async function registerDecisionViaUi(page: Page, shelteredId: string, notes?: string): Promise<void> {
  await page.getByTestId(`${P}-card-decision-${shelteredId}`).click();
  await expect(page.getByTestId(`${DECISION}-dialog`)).toBeVisible();
  await page.getByTestId(`${DECISION}-switch`).check();
  if (notes) await page.getByTestId(`${DECISION}-notes`).fill(notes);
  await page.getByTestId(`${DECISION}-submit`).click();
  await expect(page.getByTestId(`${DECISION}-dialog`)).toHaveCount(0, { timeout: 20_000 });
}
