import { queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, test } from "../support/live";
import { buildAreaWorld, disposeAreaWorld, openAs, P, type AreaWorld } from "./support";
import { createShelteredViaUi, fillShelteredForm, openCreateDialog, registerDecisionViaUi, searchByName, type ShelteredInput } from "./ui-actions";

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  gender: string;
  guardianName: string | null;
  guardianPhone: string | null;
  birthDate: string | null;
  active: number;
  shelter_id: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
}

const rowByName = (name: string): Promise<Row | null> =>
  queryOne<Row>(
    `SELECT s.id, s.name, s.gender, s.guardianName, s.guardianPhone, s.birthDate, s.active, s.shelter_id,
            a.city AS city, a.state AS state, a.street AS street
       FROM sheltered s LEFT JOIN addresses a ON a.id = s.address_id WHERE s.name = ?`,
    [name],
  );

/** Criar/editar/ativar/decidir acolhidos PELA UI de /area-dos-acolhidos, provando cada efeito no banco. */
test.describe.serial("Área dos Acolhidos — cadastro pela tela (UI real)", () => {
  let w: AreaWorld;

  test.beforeAll(async ({ request }) => {
    w = await buildAreaWorld(request);
  });
  test.afterAll(async ({ request }) => {
    const mine = await queryAll<{ id: string }>("SELECT id FROM sheltered WHERE name LIKE ? AND name LIKE ?", [`%${RUN_TAG}%`, "%-ui-%"]);
    w.extraSheltered.push(...mine.map((m) => m.id));
    await disposeAreaWorld(request, w);
  });

  const base = (label: string, extra: Partial<ShelteredInput> = {}): ShelteredInput => ({
    name: `${RUN_TAG}-ui-${label}`,
    gender: "F",
    guardianName: `Mãe ${label}`,
    phone: "92987654321",
    birth: "2016-04-05",
    joinedAt: "2025-01-10",
    street: "Rua das Flores",
    number: "12",
    district: "Centro",
    city: "Manaus",
    state: "AM",
    postalCode: "69000000",
    complement: "Casa",
    ...extra,
  });

  test("validações: formulário vazio, data incompleta e telefone curto não gravam nada", async ({ page }) => {
    const before = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE shelter_id = ?", [w.shelterA.id]))?.n);
    await openAs(page, w.leader);
    await openCreateDialogWhenReady(page);
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog").getByText("Informe o nome")).toBeVisible();
    await expect(page.getByTestId("sheltered-form-dialog").getByText("Informe a cidade")).toBeVisible();
    await expect(page.getByTestId("sheltered-form-dialog").getByText("Informe a UF")).toBeVisible();

    // sem data de nascimento: a tela recusa antes de chamar a API
    await fillShelteredForm(page, { name: `${RUN_TAG}-ui-invalido`, gender: "M", city: "Manaus", state: "AM" });
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-error")).toContainText("Data de nascimento inválida");

    // telefone curto: a API recusa (400) e a tela mostra o erro
    await fillShelteredForm(page, { birth: "2016-04-05", guardianName: "Resp", phone: "92" });
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-error")).toBeVisible();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();

    await page.getByTestId("sheltered-form-cancel").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0);
    expect(await rowByName(`${RUN_TAG}-ui-invalido`)).toBeNull();
    const after = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE shelter_id = ?", [w.shelterA.id]))?.n);
    expect(after).toBe(before);
  });

  test("líder cria um acolhido completo: cartão na lista e linha/endereço no banco (abrigo da equipe)", async ({ page }) => {
    const data = base("completo");
    await openAs(page, w.leader);
    await openCreateDialogWhenReady(page);
    await fillShelteredForm(page, data);
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 20_000 });

    const row = await rowByName(data.name);
    expect(row, "acolhido gravado").not.toBeNull();
    expect(row).toMatchObject({
      gender: "F",
      guardianName: data.guardianName,
      guardianPhone: "92987654321",
      birthDate: "2016-04-05",
      active: 1,
      shelter_id: w.shelterA.id,
      city: "Manaus",
      state: "AM",
      street: "Rua das Flores",
    });
    await searchByName(page, data.name);
    await expect(page.getByTestId(`${P}-card-name-${row!.id}`)).toHaveText(data.name);
    await expect(page.getByTestId(`${P}-card-guardian-${row!.id}`)).toContainText("Mãe completo");
  });

  test("membro cria um acolhido: o abrigo é o da própria equipe e o líder o enxerga", async ({ page }) => {
    const data = base("do-membro", { gender: "M" });
    await openAs(page, w.member);
    await openCreateDialogWhenReady(page);
    await expect(page.getByTestId("sheltered-form-shelter-readonly")).toContainText(w.shelterA.name);
    await fillShelteredForm(page, data);
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 20_000 });
    const row = await rowByName(data.name);
    expect(row?.shelter_id).toBe(w.shelterA.id);

    await openAs(page, w.leader);
    await searchByName(page, data.name);
    await expect(page.getByTestId(`${P}-card-${row!.id}`)).toBeVisible({ timeout: 15_000 });
  });

  test("editar: o formulário abre preenchido, a alteração aparece no cartão e no banco", async ({ page }) => {
    const target = w.made[4];
    await openAs(page, w.leader);
    await searchByName(page, target.name);
    await page.getByTestId(`${P}-card-edit-${target.id}`).click();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-form-name").locator("input")).toHaveValue(target.name);
    const renamed = `${target.name}-editado`;
    await fillShelteredForm(page, { name: renamed, guardianName: "Responsável Novo", city: "Parintins" });
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 20_000 });
    const row = await rowByName(renamed);
    expect(row).toMatchObject({ id: target.id, guardianName: "Responsável Novo", city: "Parintins" });
    await searchByName(page, renamed);
    await expect(page.getByTestId(`${P}-card-name-${target.id}`)).toHaveText(renamed);
  });

  test("ativar/desativar: pede confirmação, cancelar não muda, confirmar grava e a lista reflete", async ({ page }) => {
    const target = w.made[6];
    await openAs(page, w.leader);
    await searchByName(page, target.name);
    const toggle = page.getByTestId(`${P}-card-status-${target.id}`);
    await toggle.click({ force: true });
    await page.getByTestId(`${P}-card-status-dialog-${target.id}-cancel`).click();
    await expect(page.getByTestId(`${P}-card-status-dialog-${target.id}-confirm`)).toBeHidden();
    expect((await rowByName(target.name))?.active).toBe(1);

    await toggle.click({ force: true });
    await page.getByTestId(`${P}-card-status-dialog-${target.id}-confirm`).click();
    await expect.poll(async () => (await rowByName(target.name))?.active).toBe(0);
    await expect(page.getByTestId(`${P}-card-${target.id}`)).toHaveAttribute("data-active", "false", { timeout: 15_000 });
    await expect(page.getByTestId(`${P}-card-status-dialog-${target.id}-confirm`)).toBeHidden();

    await toggle.click({ force: true });
    await page.getByTestId(`${P}-card-status-dialog-${target.id}-confirm`).click();
    await expect.poll(async () => (await rowByName(target.name))?.active).toBe(1);
  });

  test("decisão por Cristo: sem o switch não salva; salvar grava ACCEPTED, o coração muda e o filtro encontra; 2ª vez vira RECONCILED", async ({ page }) => {
    const target = w.made[7];
    await openAs(page, w.leader);
    await searchByName(page, target.name);
    await page.getByTestId(`${P}-card-decision-${target.id}`).click();
    await expect(page.getByTestId("sheltered-decision-title")).toContainText("aceitar Jesus");
    await expect(page.getByTestId("sheltered-decision-submit")).toBeDisabled();
    await page.getByTestId("sheltered-decision-cancel").click();
    expect(await decisionsOf(target.id)).toEqual([]);

    await registerDecisionViaUi(page, target.id, "Decidiu no culto");
    await expect.poll(() => decisionsOf(target.id)).toEqual([{ decision: "ACCEPTED", notes: "Decidiu no culto" }]);
    await expect(page.getByTestId(`${P}-card-decision-${target.id}`)).toHaveAttribute("data-decided", "true", { timeout: 15_000 });

    await page.getByTestId(`${P}-card-decision-${target.id}`).click();
    await expect(page.getByTestId("sheltered-decision-title")).toContainText("nova decisão");
    await expect(page.getByTestId("sheltered-decision-already-accepted")).toBeVisible();
    await page.getByTestId("sheltered-decision-switch").check();
    await page.getByTestId("sheltered-decision-submit").click();
    await expect(page.getByTestId("sheltered-decision-dialog")).toHaveCount(0, { timeout: 20_000 });
    await expect.poll(async () => (await decisionsOf(target.id)).map((d) => d.decision).sort()).toEqual(["ACCEPTED", "RECONCILED"]);
  });

  test("massa pela UI: 6 acolhidos variados (gênero, idade, endereço) aparecem na lista e no banco", async ({ page }) => {
    const plan: Array<[string, Partial<ShelteredInput>]> = [
      ["m1", { gender: "M", birth: "2012-02-01", city: "Manaus" }],
      ["m2", { gender: "F", birth: "2014-07-15", city: "Manaus" }],
      ["m3", { gender: "M", birth: "2018-11-30", city: "Iranduba" }],
      ["m4", { gender: "F", birth: "2010-01-20", city: "Manacapuru" }],
      ["m5", { gender: "M", birth: "2016-09-09", city: "Manaus" }],
      ["m6", { gender: "F", birth: "2019-05-05", city: "Manaus" }],
    ];
    await openAs(page, w.leader);
    await openCreateDialogWhenReady(page, true);
    await page.getByTestId("sheltered-form-cancel").click();
    for (const [label, extra] of plan) await createShelteredViaUi(page, base(label, extra));
    for (const [label, extra] of plan) {
      const row = await rowByName(`${RUN_TAG}-ui-${label}`);
      expect(row, label).toMatchObject({ gender: extra.gender, birthDate: extra.birth, city: extra.city, shelter_id: w.shelterA.id });
    }
    await page.getByTestId(`${P}-search`).fill(`${RUN_TAG}-ui-m`);
    await expect(page.getByTestId(`${P}-pagination-summary`)).toBeVisible({ timeout: 15_000 }).catch(() => undefined);
    await expect.poll(async () => (await page.getByTestId(`${P}-list`).locator('[data-testid^="sheltered-area-card-"][data-active]').count())).toBe(6);
  });

  test("@mobile 375px: cadastrar pelo FAB abre o formulário completo e grava", async ({ page }) => {
    const data = base("mobile", { gender: "M" });
    await openAs(page, w.leader);
    await openCreateDialogWhenReady(page);
    for (const id of ["sheltered-form-submit", "sheltered-form-cancel"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box!.height, id).toBeGreaterThanOrEqual(43.5);
    }
    await fillShelteredForm(page, data);
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 20_000 });
    expect((await rowByName(data.name))?.shelter_id).toBe(w.shelterA.id);
  });
});

async function decisionsOf(shelteredId: string): Promise<Array<{ decision: string; notes: string | null }>> {
  return queryAll<{ decision: string; notes: string | null }>(
    "SELECT decision, notes FROM accepted_christs WHERE sheltered_id = ? ORDER BY createdAt, id",
    [shelteredId],
  );
}

async function openCreateDialogWhenReady(page: import("@playwright/test").Page, keepOpen = false): Promise<void> {
  await expect(page.getByTestId(`${P}-list`)).toBeVisible({ timeout: 20_000 });
  await openCreateDialog(page);
  void keepOpen;
}
