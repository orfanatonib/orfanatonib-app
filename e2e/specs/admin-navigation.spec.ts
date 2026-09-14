import { expect, test } from "../support/test";
import {
  LEADER_USER,
  SHELTER_MANAGEMENT_FLAG,
  SHELTER_PAGELAS_FLAG,
} from "../fixtures/sheltered.fixtures";

const groupTestIds = [
  "admin-sidebar-group-people",
  "admin-sidebar-group-shelters-and-visits",
  "admin-sidebar-group-content",
  "admin-sidebar-group-materials-and-ideas",
  "admin-sidebar-group-media",
  "admin-sidebar-group-communication",
];

const itemTestIdsByGroup: Record<string, string[]> = {
  "admin-sidebar-group-people": [
    "admin-sidebar-item-sheltered",
    "admin-sidebar-item-members",
    "admin-sidebar-item-leaders",
    "admin-sidebar-item-profiles",
    "admin-sidebar-item-users",
    "admin-sidebar-item-background-checks",
  ],
  "admin-sidebar-group-shelters-and-visits": [
    "admin-sidebar-item-shelters",
    "admin-sidebar-item-schedules",
    "admin-sidebar-item-attendance",
    "admin-sidebar-item-visit-reports",
    "admin-sidebar-item-pagelas",
    "admin-sidebar-item-fm-integrations",
  ],
  "admin-sidebar-group-content": [
    "admin-sidebar-item-create-page",
    "admin-sidebar-item-meditations",
    "admin-sidebar-item-documents",
    "admin-sidebar-item-informative-banners",
  ],
  "admin-sidebar-group-materials-and-ideas": [
    "admin-sidebar-item-visit-materials",
    "admin-sidebar-item-ideas-pages",
    "admin-sidebar-item-shared-ideas",
  ],
  "admin-sidebar-group-media": [
    "admin-sidebar-item-photo-galleries",
    "admin-sidebar-item-shelter-photos",
    "admin-sidebar-item-videos",
  ],
  "admin-sidebar-group-communication": [
    "admin-sidebar-item-comments",
    "admin-sidebar-item-contacts",
    "admin-sidebar-item-feedbacks",
  ],
};

test.describe("navegação do painel administrativo", () => {
  test("organiza os grupos por tarefa e mantém dashboard e sidebar consistentes", async ({
    page,
    api,
  }) => {
    void api;
    await page.goto("/adm");

    const sidebar = page.getByTestId("admin-sidebar");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    await expect(sidebar.getByTestId("admin-sidebar-overview")).toHaveText(
      "Visão geral",
    );

    const groups = sidebar.locator(
      '[data-testid^="admin-sidebar-group-"]:not([data-testid^="admin-sidebar-group-toggle-"])',
    );
    await expect(groups).toHaveCount(groupTestIds.length);
    await expect
      .poll(() =>
        groups.evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("data-testid")),
        ),
      )
      .toEqual(groupTestIds);

    for (const groupTestId of groupTestIds) {
      const group = sidebar.getByTestId(groupTestId);
      const items = group.locator('[data-testid^="admin-sidebar-item-"]');
      await expect
        .poll(() =>
          items.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute("data-testid")),
          ),
        )
        .toEqual(itemTestIdsByGroup[groupTestId]);
    }

    const dashboardFilters = page.locator(
      '[data-testid^="admin-dashboard-filter-"]',
    );
    await expect(dashboardFilters).toHaveText([
      "Tudo",
      "Pessoas",
      "Abrigos e visitas",
      "Conteúdo",
      "Materiais e ideias",
      "Mídias",
      "Comunicação",
    ]);

    const dashboardCards = page.locator(
      '[data-testid^="admin-dashboard-card-"]',
    );
    const expectedDashboardCards = groupTestIds.flatMap((groupTestId) =>
      itemTestIdsByGroup[groupTestId].map((testId) =>
        testId.replace("admin-sidebar-item-", "admin-dashboard-card-"),
      ),
    );
    await expect
      .poll(() =>
        dashboardCards.evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("data-testid")),
        ),
      )
      .toEqual(expectedDashboardCards);
  });

  test("navega por um item e retorna pela Visão geral", async ({
    page,
    api,
  }) => {
    void api;
    await page.goto("/adm");

    await page.getByTestId("admin-sidebar-group-toggle-content").click();
    await page.getByTestId("admin-sidebar-item-create-page").click();
    await expect(page).toHaveURL(/\/adm\/criar-pagina$/);

    await page.getByTestId("admin-sidebar-overview").click();
    await expect(page).toHaveURL(/\/adm$/);
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });
});

test.describe("permissões da navegação administrativa", () => {
  test.describe("líder", () => {
    test.use({ apiMockOptions: { user: LEADER_USER } });

    test("vê apenas os grupos e itens permitidos", async ({ page, api }) => {
      void api;
      await page.goto("/adm");

      const sidebar = page.getByTestId("admin-sidebar");
      const groups = sidebar.locator(
        '[data-testid^="admin-sidebar-group-"]:not([data-testid^="admin-sidebar-group-toggle-"])',
      );
      await expect
        .poll(() =>
          groups.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute("data-testid")),
          ),
        )
        .toEqual(groupTestIds.slice(0, 2));

      const peopleItems = sidebar
        .getByTestId("admin-sidebar-group-people")
        .locator('[data-testid^="admin-sidebar-item-"]');
      await expect
        .poll(() =>
          peopleItems.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute("data-testid")),
          ),
        )
        .toEqual([
          "admin-sidebar-item-sheltered",
          "admin-sidebar-item-members",
          "admin-sidebar-item-profiles",
          "admin-sidebar-item-background-checks",
        ]);
      await expect(
        page.locator('[data-testid^="admin-dashboard-filter-"]'),
      ).toHaveCount(0);
    });
  });

  test.describe("feature flags desligadas", () => {
    test.use({
      apiMockOptions: {
        flags: [
          { ...SHELTER_MANAGEMENT_FLAG, enabled: false },
          { ...SHELTER_PAGELAS_FLAG, enabled: false },
        ],
      },
    });

    test("esconde Acolhidos e Pagelas no sidebar e no dashboard", async ({
      page,
      api,
    }) => {
      void api;
      await page.goto("/adm");

      await expect(
        page.getByTestId("admin-sidebar-item-sheltered"),
      ).toHaveCount(0);
      await expect(page.getByTestId("admin-sidebar-item-pagelas")).toHaveCount(
        0,
      );
      await expect(
        page.getByTestId("admin-dashboard-card-sheltered"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("admin-dashboard-card-pagelas"),
      ).toHaveCount(0);
    });
  });
});
