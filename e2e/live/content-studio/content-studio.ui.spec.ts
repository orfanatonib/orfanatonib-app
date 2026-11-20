import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
  uniqueSuffix,
} from "../support/live";
import type { ContentPackageResponse } from "../../../src/features/content-studio/types";

test("Estúdio: cria o material para todas as categorias, edita conteúdo, preserva rascunho e confirma persistência", async ({
  page,
  request,
}) => {
  const session = await loginAs(request, "admin");
  const headers = authHeaders(session.accessToken);
  // Não depende do estado das flags deixado por outras specs: liga e restaura.
  const flags = ["content_studio", "content_studio_generation"] as const;
  const previous: Record<string, number> = {};
  for (const key of flags) {
    previous[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers, data: { enabled: true } });
  }
  await seedBrowserSession(page, session);
  let packageId: string | undefined;
  try {
    await page.goto("/adm/estudio/producao");
    await page.getByTestId("content-studio-new-material").click();
    // O diálogo não pergunta o público: o material nasce para os quatro.
    await expect(
      page.getByTestId("content-studio-create-audience"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("content-studio-create-audiences-info"),
    ).toContainText("Baby, Crianças, Adolescentes, Adultos");
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
    expect(created.tracks.map((track) => track.audience).sort()).toEqual([
      "ADULT",
      "BABY",
      "CHILD",
      "TEEN",
    ]);
    await expect(page.getByTestId("content-studio-active-stage")).toBeVisible();
    // Uma aba por categoria.
    for (const audience of ["BABY", "CHILD", "TEEN", "ADULT"])
      await expect(
        page.getByTestId(`content-studio-audience-${audience}`),
      ).toBeVisible();
    // Só há duas abas: Documento e PDF (campos e prévia rápida saíram).
    await expect(page.getByTestId("content-studio-document-tab")).toBeVisible();
    await expect(page.getByTestId("content-studio-pdf-tab-button")).toBeVisible();
    await expect(page.getByTestId("content-studio-edit-tab")).toHaveCount(0);
    await expect(page.getByTestId("content-studio-preview-tab")).toHaveCount(0);
    // Escreve no documento e salva uma nova versão.
    const editor = page.locator(".ProseMirror").first();
    await expect(editor).toBeVisible({ timeout: 20_000 });
    await editor.click();
    await page.keyboard.type("Deus cuida de nós");
    await page.getByTestId("content-studio-doc-save").click();
    await expect(page.getByTestId("content-studio-feedback")).toContainText("Nova versão salva");
    const response = await request.get(`${API_URL}/content-studio/packages/${packageId}`, { headers });
    expect(response.ok()).toBeTruthy();
    const persisted = (await response.json()) as ContentPackageResponse;
    const saved = persisted.tracks.flatMap((track) => track.stages).find((stage) => stage.currentVersion?.contentDocument);
    expect(JSON.stringify(saved?.currentVersion?.contentDocument)).toContain("Deus cuida de nós");
  } finally {
    for (const key of flags)
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers, data: { enabled: previous[key] === 1 } });
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
