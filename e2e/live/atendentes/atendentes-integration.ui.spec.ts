import { queryAll } from "../support/db";
import { cleanupData } from "../support/keep-data";
import { expectCards, openAs, searchFor, selectFilter, type ListScreen } from "../support/admin-list-ui";
import { expect, loginAs, test } from "../support/live";
import { create as createIntegration, removeApi as removeIntegration } from "../integration/support";
import { create, pdf, recordsWithTag, removeApi } from "./support";

const SCREEN: ListScreen = { p: "atendentes", path: "/adm/antecedentes", endpoint: "/antecedentes-criminais" };
const { p } = SCREEN;

test.describe.serial("Antecedentes criminais: vínculo com integração (dado real criado pela API)", () => {
  const tag = `e2e-antint-${Date.now().toString(36)}`;
  let admin = "";
  let integrationId = "";
  let recordId = "";
  const integrationName = `Integração ${tag}`;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    integrationId = (await createIntegration(request, admin, { name: integrationName })).id;
    // Sem nome próprio: o cartão mostra o nome da integração vinculada.
    recordId = (await create(request, admin, { attendableType: "integration", attendableId: integrationId, estadual: pdf(`${tag}.pdf`), federal: pdf(`${tag}-f.pdf`) })).id;
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await removeApi(request, admin, recordId);
      await removeIntegration(request, admin, integrationId);
      expect(await recordsWithTag(tag)).toBe(0);
      expect(await queryAll("SELECT id FROM atendentes WHERE attendableId = ?", [integrationId])).toHaveLength(0);
    });
  });

  test("busca pelo nome da integração, filtro de vínculo e cartão batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const search = await searchFor(page, SCREEN, tag);
    expect(search.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [recordId]);
    await expect(page.getByTestId(`${p}-card-title-${recordId}`)).toHaveText(integrationName);
    await expect(page.getByTestId(`${p}-card-link-${recordId}`)).toHaveText("Integração FM");

    const integration = await selectFilter(page, SCREEN, "attendableType", "integration");
    expect(integration.params.get("attendableType")).toBe("integration");
    const db = await queryAll<{ id: string }>("SELECT a.id AS id FROM atendentes a JOIN integrations i ON i.id = a.attendableId WHERE a.attendableType = 'integration' AND i.name LIKE ?", [`%${tag}%`]);
    expect(integration.body.meta?.totalItems).toBe(db.length);
    await expectCards(page, p, [recordId]);

    await selectFilter(page, SCREEN, "attendableType", "user");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ver mostra o vínculo com a integração e os dois PDFs", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await page.getByTestId(`${p}-card-view-${recordId}`).click();
    await expect(page.getByTestId(`${p}-view-link`)).toContainText(`Integração FM: ${integrationName}`);
    await expect(page.getByTestId(`${p}-view-pdf-estadual`)).toBeVisible();
    await expect(page.getByTestId(`${p}-view-pdf-federal`)).toBeVisible();
    await page.getByTestId(`${p}-view-close`).click();
  });
});
