import { API_URL } from "../../../playwright.live.config";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
  uniqueSuffix,
} from "../support/live";
import type { ContentPackageResponse } from "../../../src/features/content-studio/types";

test("Estúdio: cria categoria, edita conteúdo, preserva rascunho e confirma persistência", async ({
  page,
  request,
}) => {
  const session = await loginAs(request);
  const headers = authHeaders(session.accessToken);
  await seedBrowserSession(page, session);
  let packageId: string | undefined;
  try {
    await page.goto("/adm/estudio/producao");
    await page.getByTestId("content-studio-new-material").click();
    await page
      .getByTestId("content-studio-create-audience")
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: /Adultos/ }).click();
    await page
      .getByTestId("content-studio-theme-input")
      .fill(`Esperança ${uniqueSuffix()}`);
    await page.getByTestId("content-studio-references-input").fill("Salmos 23");
    await page
      .getByTestId("content-studio-objective-input")
      .fill("Compreender o cuidado de Deus");
    const createdPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/content-studio/packages") &&
        response.request().method() === "POST",
    );
    await page.getByTestId("content-studio-create-package").click();
    const created = (await (
      await createdPromise
    ).json()) as ContentPackageResponse;
    packageId = created.id;
    expect(created.tracks).toHaveLength(1);
    expect(created.tracks[0].audience).toBe("ADULT");
    await expect(page.getByTestId("content-studio-active-stage")).toBeVisible();
    await page.getByTestId("content-studio-edit-tab").click();
    await page.getByLabel("Título", { exact: true }).fill("Deus cuida de nós");
    await page.getByTestId("content-studio-stage-tab-LESSON").click();
    await page.getByTestId("content-studio-stage-tab-CANONICAL_BASE").click();
    await page.getByTestId("content-studio-edit-tab").click();
    await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
      "Deus cuida de nós",
    );
    await page.getByTestId("content-studio-save-stage").click();
    await expect(page.getByTestId("content-studio-feedback")).toContainText(
      "Nova versão salva",
    );
    const response = await request.get(
      `${API_URL}/content-studio/packages/${packageId}`,
      { headers },
    );
    expect(response.ok()).toBeTruthy();
    const persisted = (await response.json()) as ContentPackageResponse;
    expect(
      persisted.tracks[0].stages[0].currentVersion?.structuredContent.title,
    ).toBe("Deus cuida de nós");
    await page.getByTestId("content-studio-preview-tab").click();
    await expect(
      page.getByTestId("content-studio-preview-title"),
    ).toContainText("Deus cuida de nós");
  } finally {
    if (packageId) {
      const currentResponse = await request.get(
        `${API_URL}/content-studio/packages/${packageId}`,
        { headers },
      );
      const current = (await currentResponse.json()) as ContentPackageResponse;
      if (
        !current.tracks.some((track) =>
          track.stages.some((stage) => stage.currentVersionId),
        )
      ) {
        const firstStage = current.tracks[0].stages[0];
        await request.patch(
          `${API_URL}/content-studio/packages/${packageId}/stages/${firstStage.id}/content`,
          {
            headers,
            data: { structuredContent: { title: "Limpeza do teste" } },
          },
        );
      }
      const archived = await request.post(
        `${API_URL}/content-studio/packages/${packageId}/archive`,
        { headers },
      );
      expect(archived.ok()).toBeTruthy();
    }
  }
});
