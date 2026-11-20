import { API_URL } from "../../../playwright.live.config";
import { countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { captureFormData, parseJsonField, readCapturedForm } from "./support";

/**
 * Rede de segurança da migração do grupo `IdeasSectionEditor` (plano 40):
 * o membro compartilha a ideia pelo formulário e o admin edita e publica a
 * seção numa página, ambos pela tela, conferindo o FormData, o banco e o
 * redirecionamento.
 */
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const MIN_TOUCH_TARGET_PX = 44;

/** Sem rolagem horizontal e com o alvo de toque de pelo menos 44px. */
const expectMobileFit = async (page: import("@playwright/test").Page, testIds: string[]): Promise<void> => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const testId of testIds) {
    const box = await page.getByTestId(testId).boundingBox();
    expect(box?.height ?? 0, testId).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
  }
};

interface SectionPayload {
  title: string;
  description: string;
  public: boolean;
  medias: Array<Record<string, unknown>>;
}

const deleteResource = async (
  request: import("@playwright/test").APIRequestContext,
  resource: string,
  id: string,
): Promise<void> => {
  const admin = await loginAs(request, "admin");
  await request.delete(`${API_URL}/${resource}/${id}`, { headers: authHeaders(admin.accessToken) });
};

test.describe.serial("Ideias (grupo IdeasSectionEditor) — criação e edição pela tela", () => {
  test("membro compartilha a ideia: valida, envia o FormData, grava e volta à Home do membro", async ({ page, request }) => {
    const title = `Ideia ${RUN_TAG}`;
    await page.setViewportSize(MOBILE_VIEWPORT);
    await seedBrowserSession(page, await loginAs(request, "member"));
    await captureFormData(page);
    await page.goto("/area-do-membro/compartilhar-ideia");

    await expectMobileFit(page, ["idea-share-submit", "idea-share-cancel"]);
    await page.getByTestId("idea-share-submit").click();
    await expect(page.getByTestId("idea-share-snackbar")).toContainText("adicione um título");

    await page.getByTestId("idea-title").fill(title);
    await page.getByTestId("idea-description").fill("Descrição da ideia do cenário");
    await page.getByTestId("idea-tab-videos").click();
    await page.getByTestId("idea-video-upload-type").getByRole("combobox").click();
    await page.getByRole("option", { name: /Link do YouTube/ }).click();
    await page.getByTestId("idea-video-url").fill("https://youtu.be/abc123");
    await page.getByTestId("idea-video-add").click();

    const posted = page.waitForResponse(
      (r) => r.url().endsWith("/ideas-sections") && r.request().method() === "POST",
    );
    await page.getByTestId("idea-share-submit").click();
    const response = await posted;
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string };

    try {
      const form = await readCapturedForm(page);
      const payload = parseJsonField<SectionPayload>(form, "sectionData");
      expect(payload.title).toBe(title);
      expect(payload.public).toBe(true);
      expect(payload.medias).toHaveLength(1);
      expect(payload.medias[0]).toMatchObject({
        uploadType: "link",
        mediaType: "video",
        isLocalFile: false,
        url: "https://youtu.be/abc123",
        platformType: "youtube",
      });
      expect(form.files).toEqual([]);
      await expect.poll(() => countRows("ideas_sections", { title })).toBe(1);
      // Volta à Home do membro depois da confirmação.
      await expect(page).toHaveURL(/\/area-do-membro\/?$/, { timeout: 15_000 });
    } finally {
      await deleteResource(request, "ideas-sections", body.id);
    }
    await expect.poll(() => countRows("ideas_sections", { title })).toBe(0);
  });

  test("admin edita a seção, escolhe a página e publica: FormData, banco e volta à lista", async ({ page, request }) => {
    const member = await loginAs(request, "member");
    const admin = await loginAs(request, "admin");
    const original = `Seção ${RUN_TAG}`;
    const edited = `Seção editada ${RUN_TAG}`;
    const pageTitle = `Página ${RUN_TAG}`;

    const pageResponse = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(admin.accessToken),
      multipart: {
        ideasMaterialsPageData: JSON.stringify({
          title: pageTitle,
          subtitle: "Subtítulo do cenário",
          description: "Página de destino do cenário",
          public: true,
          sections: [{ title: "Seção base", description: "Base", public: true, medias: [] }],
        }),
      },
    });
    expect(pageResponse.status()).toBe(201);
    const ideasPage = (await pageResponse.json()) as { id: string };

    const sectionResponse = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member.accessToken),
      multipart: {
        sectionData: JSON.stringify({
          title: original,
          description: "Criada pela suíte",
          public: true,
          medias: [
            {
              uploadType: "link",
              mediaType: "video",
              isLocalFile: false,
              url: "https://youtu.be/abc",
              platformType: "youtube",
              title: "Vídeo",
              description: "Vídeo da seção",
            },
          ],
        }),
      },
    });
    expect(sectionResponse.status()).toBe(201);
    const section = (await sectionResponse.json()) as { id: string };

    try {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await seedBrowserSession(page, admin);
      await captureFormData(page);
      await page.goto("/adm/ideias-compartilhadas");
      await page.getByTestId(`ideas-section-edit-${section.id}`).click();
      await expect(page).toHaveURL(/\/adm\/editar-ideias-compartilhadas$/);

      await expect(page.getByTestId("ideas-section-admin-heading")).toBeVisible();
      await expectMobileFit(page, [
        "ideas-section-admin-page-select",
        "ideas-section-admin-visibility",
        "ideas-section-admin-save",
        "ideas-section-admin-cancel",
      ]);

      // Sem página de destino o salvar fica desligado.
      await expect(page.getByTestId("ideas-section-admin-save")).toBeDisabled();

      await page.getByLabel("Título da Seção").fill(edited);
      await page.getByTestId("ideas-section-admin-page-select").getByRole("combobox").click();
      await page.getByRole("option", { name: pageTitle }).click();
      await page.getByTestId("ideas-section-admin-visibility").getByRole("combobox").click();
      await page.getByRole("option", { name: "Privado" }).click();

      const patched = page.waitForResponse(
        (r) => r.url().endsWith(`/ideas-sections/${section.id}/attach/${ideasPage.id}`) && r.request().method() === "PATCH",
      );
      await page.getByTestId("ideas-section-admin-save").click();
      const response = await patched;
      expect(response.status(), await response.text()).toBe(200);

      const form = await readCapturedForm(page);
      const payload = parseJsonField<SectionPayload>(form, "sectionData");
      expect(payload.title).toBe(edited);
      expect(payload.public).toBe(false);
      expect(payload.medias).toHaveLength(1);
      expect(payload.medias[0]).toMatchObject({ uploadType: "link", mediaType: "video", url: "https://youtu.be/abc" });
      expect(typeof payload.medias[0].id).toBe("string");
      await expect.poll(() => countRows("ideas_sections", { title: edited })).toBe(1);
      await expect(page).toHaveURL(/\/adm\/ideias-compartilhadas$/, { timeout: 15_000 });
    } finally {
      await deleteResource(request, "ideas-sections", section.id);
      await deleteResource(request, "ideas-pages", ideasPage.id);
    }
    await expect.poll(() => countRows("ideas_sections", { title: edited })).toBe(0);
    await expect.poll(() => countRows("ideas_pages", { title: pageTitle })).toBe(0);
  });
});
