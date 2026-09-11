import { LEADER_USER, MEMBER_USER } from "../fixtures/sheltered.fixtures";
import { expectDateField, fillDateField } from "../support/fields";
import { expect, test } from "../support/test";

type CreateBody = {
  name?: string;
  gender?: string;
  birthDate?: string | null;
  guardianPhone?: string | null;
  shelterId?: string | null;
  address?: { city?: string; state?: string; postalCode?: string | null } | null;
};

test.describe("Acolhidos — criação", () => {
  test.use({ apiMockOptions: { user: LEADER_USER } });

  test("bloqueia o envio enquanto faltam campos obrigatórios", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-create").click();

    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    await page.getByTestId("sheltered-form-submit").click();

    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    expect(api.callsTo("POST", "/sheltered")).toHaveLength(0);
    await expect(page.getByTestId("sheltered-form-name")).toContainText(
      "Informe o nome",
    );
    await expect(page.getByTestId("sheltered-form-city")).toContainText(
      "Informe a cidade",
    );
  });

  test("envia o payload normalizado e fecha o diálogo", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-create").click();

    await page.getByTestId("sheltered-form-name").locator("input").fill("Ana Clara");
    await fillDateField(page, "sheltered-form-birth-date", "02042015");
    await page
      .getByTestId("sheltered-form-guardian-phone")
      .locator("input")
      .fill("92999990000");
    await page.getByTestId("sheltered-form-city").locator("input").fill("Manaus");
    await page.getByTestId("sheltered-form-state").locator("input").fill("AM");
    await page
      .getByTestId("sheltered-form-postal-code")
      .locator("input")
      .fill("69000000");

    await page.getByTestId("sheltered-form-submit").click();

    await expect(page.getByTestId("sheltered-form-dialog")).toBeHidden();

    const [created] = api.callsTo("POST", "/sheltered");
    expect(created).toBeDefined();
    const body = created.body as CreateBody;
    expect(body.name).toBe("Ana Clara");
    // Data em BR vira o formato de calendário aceito pela API.
    expect(body.birthDate).toBe("2015-04-02");
    // Telefone e CEP vão sem máscara.
    expect(body.guardianPhone).toBe("92999990000");
    expect(body.address?.postalCode).toBe("69000000");
    // O líder tem o abrigo do seu time como padrão.
    expect(body.shelterId).toBe("shelter-1");
  });

  test("mostra a mensagem da API e mantém o diálogo aberto quando a criação falha", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-create").click();

    await page.getByTestId("sheltered-form-name").locator("input").fill("Ana Clara");
    await fillDateField(page, "sheltered-form-birth-date", "02042015");
    await page.getByTestId("sheltered-form-city").locator("input").fill("Manaus");
    await page.getByTestId("sheltered-form-state").locator("input").fill("AM");

    api.failNext("POST", "/sheltered", 404, "Abrigo não encontrado ou fora do seu acesso.");
    await page.getByTestId("sheltered-form-submit").click();

    await expect(page.getByTestId("sheltered-form-error")).toContainText(
      "Abrigo não encontrado ou fora do seu acesso.",
    );
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
  });

  test("recusa uma data de nascimento inexistente antes de chamar a API", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-create").click();

    await page.getByTestId("sheltered-form-name").locator("input").fill("Ana Clara");
    await fillDateField(page, "sheltered-form-birth-date", "30022015");
    await page.getByTestId("sheltered-form-city").locator("input").fill("Manaus");
    await page.getByTestId("sheltered-form-state").locator("input").fill("AM");

    await page.getByTestId("sheltered-form-submit").click();

    await expect(page.getByTestId("sheltered-form-error")).toContainText(
      "Data de nascimento inválida",
    );
    expect(api.callsTo("POST", "/sheltered")).toHaveLength(0);
  });
});

test.describe("Acolhidos — escopo do abrigo por papel", () => {
  test.describe("membro", () => {
    test.use({ apiMockOptions: { user: MEMBER_USER } });

    test("não alcança a rota administrativa de acolhidos", async ({ page, api }) => {
      // `api` precisa ser solicitado: é ele que instala o mock e semeia a sessão.
      expect(api.calls).toHaveLength(0);
      await page.goto("/adm/acolhidos");

      // ProtectedRoute só admite admin e líder; o membro volta para a home.
      await expect.poll(() => new URL(page.url()).pathname).toBe("/");
      await expect(page.getByTestId("sheltered-manager")).toBeHidden();
    });
  });

  test.describe("líder", () => {
    test.use({ apiMockOptions: { user: LEADER_USER } });

    test("escolhe entre os abrigos disponíveis", async ({ page, gotoSheltered }) => {
      await gotoSheltered();
      await page.getByTestId("sheltered-create").click();

      const select = page.getByTestId("sheltered-form-shelter-select");
      await expect(select).toBeVisible();
      await expect(select).toContainText("Abrigo Esperança");
      await expect(page.getByTestId("sheltered-form-shelter-readonly")).toBeHidden();
    });
  });
});

test.describe("Acolhidos — edição", () => {
  test("prefill vem do registro e o PUT leva só o que foi alterado", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-edit-sheltered-1").click();

    const dialog = page.getByTestId("sheltered-form-dialog");
    await expect(dialog).toBeVisible();
    const nameInput = page.getByTestId("sheltered-form-name").locator("input");
    await expect(nameInput).toHaveValue("Maria Silva");
    // A data volta para o formato brasileiro na tela.
    await expectDateField(page, "sheltered-form-birth-date", "02/04/2015");

    await nameInput.fill("Maria Silva Souza");
    await page.getByTestId("sheltered-form-submit").click();

    await expect(dialog).toBeHidden();

    const [updated] = api.callsTo("PUT", "/sheltered/sheltered-1");
    expect(updated).toBeDefined();
    const body = updated.body as CreateBody & { id?: string };
    expect(body.name).toBe("Maria Silva Souza");
    // O id vai na rota, nunca no corpo.
    expect(body.id).toBeUndefined();
    expect(body.birthDate).toBe("2015-04-02");
  });

  test("cancelar não chama a API", async ({ page, api, gotoSheltered }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-edit-sheltered-1").click();

    await page.getByTestId("sheltered-form-cancel").click();

    await expect(page.getByTestId("sheltered-form-dialog")).toBeHidden();
    expect(api.callsTo("PUT", "/sheltered/sheltered-1")).toHaveLength(0);
  });
});
