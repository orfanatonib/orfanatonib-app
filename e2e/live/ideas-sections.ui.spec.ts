import { API_URL } from "../../playwright.live.config";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
} from "./support/live";

/**
 * As telas de ideias compartilhadas contra a pilha real. A suíte cria as
 * ideias pela API e confere na API o que a tela gravou — nada é interceptado.
 */
const RUN_TAG = `e2e-ideia-ui-${Date.now()}`;

type SectionDto = {
  id: string;
  title: string;
  medias: Array<{ id: string; title: string; url: string }>;
};

const createSection = async (
  request: import("@playwright/test").APIRequestContext,
  token: string,
  title: string,
): Promise<SectionDto> => {
  const response = await request.post(`${API_URL}/ideas-sections`, {
    headers: authHeaders(token),
    multipart: {
      sectionData: JSON.stringify({
        title,
        description: "Criada pela suíte de UI",
        public: true,
        medias: [
          {
            uploadType: "link",
            mediaType: "video",
            isLocalFile: false,
            url: "https://youtu.be/abc",
            platformType: "youtube",
            title: "Vídeo",
          },
        ],
      }),
    },
  });

  expect(response.status()).toBe(201);
  return (await response.json()) as SectionDto;
};

const listSections = async (
  request: import("@playwright/test").APIRequestContext,
  token: string,
): Promise<SectionDto[]> => {
  const response = await request.get(`${API_URL}/ideas-sections`, {
    headers: authHeaders(token),
  });
  return (await response.json()) as SectionDto[];
};

test.describe.serial("Ideias compartilhadas — UI ao vivo", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;

    created.push((await createSection(request, member, RUN_TAG)).id);
    created.push((await createSection(request, member, `${RUN_TAG}-outra`)).id);
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) {
      await request.delete(`${API_URL}/ideas-sections/${id}`, {
        headers: authHeaders(admin),
      });
    }
  });

  test("a tela lista o que a API devolveu", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/ideias-compartilhadas");

    await expect(page.getByTestId("ideas-sections-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("ideas-sections-list")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("ideas-sections-loading")).toHaveCount(0);
    await expect(page.getByTestId("ideas-sections-error")).toHaveCount(0);

    for (const id of created) {
      await expect(page.getByTestId(`ideas-section-card-${id}`)).toBeVisible();
    }
  });

  test("a busca filtra e o vazio aparece sem resultado", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/ideias-compartilhadas");
    await expect(page.getByTestId("ideas-sections-list")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId("ideas-sections-search").fill(`${RUN_TAG}-outra`);
    await expect(page.getByTestId(`ideas-section-card-${created[1]}`)).toBeVisible();
    await expect(page.getByTestId(`ideas-section-card-${created[0]}`)).toHaveCount(0);

    await page.getByTestId("ideas-sections-search").fill("zzz-nao-existe-zzz");
    await expect(page.getByTestId("ideas-sections-empty")).toBeVisible();
  });

  test("o detalhe mostra a mídia que a API gravou", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/ideias-compartilhadas");
    await expect(page.getByTestId("ideas-sections-list")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId(`ideas-section-details-${created[0]}`).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText(RUN_TAG, { exact: false }).first()).toBeVisible();
    // A mídia da API aparece no detalhe, com a plataforma que ela devolveu.
    await expect(modal.getByText("Mídias (1)")).toBeVisible();
    await expect(modal.getByText("youtube", { exact: false })).toBeVisible();
  });

  test("um membro compartilha a ideia pela tela e ela chega na API", async ({
    page,
    request,
  }) => {
    // Este era o caminho quebrado: qualquer ideia com mídia respondia 400 do
    // banco, e o `catch` mudo dizia só "algo deu errado".
    const title = `${RUN_TAG}-pela-tela`;
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/compartilhar-ideia");
    await page.getByTestId("idea-title").fill(title);
    await page.getByTestId("idea-description").fill("Enviada pela tela");

    await page.getByTestId("idea-tab-videos").click();

    // O Select do MUI é um combobox: abre o menu e escolhe a opção.
    await page
      .getByTestId("idea-video-upload-type")
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: /Link do YouTube/ }).click();

    await page.getByTestId("idea-video-url").fill("https://youtu.be/xyz");
    await page.getByTestId("idea-video-add").click();

    await page.getByTestId("idea-share-submit").click();

    // A prova é a API, não o alerta verde da tela.
    await expect
      .poll(
        async () => {
          const sections = await listSections(request, admin);
          return sections.some((section) => section.title === title);
        },
        { timeout: 20_000 },
      )
      .toBe(true);

    const saved = (await listSections(request, admin)).find(
      (section) => section.title === title,
    );
    expect(saved?.medias).toHaveLength(1);
    expect(saved?.medias[0].url).toBe("https://youtu.be/xyz");
    created.push(saved!.id);
  });

  test("excluir pela tela remove a ideia de verdade", async ({
    page,
    request,
  }) => {
    const target = await createSection(
      request,
      member,
      `${RUN_TAG}-para-excluir`,
    );

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/ideias-compartilhadas");
    await expect(
      page.getByTestId(`ideas-section-card-${target.id}`),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByTestId(`ideas-section-delete-${target.id}`).click();
    await page.getByRole("button", { name: /Excluir|Confirmar/ }).click();

    await expect(
      page.getByTestId(`ideas-section-card-${target.id}`),
    ).toHaveCount(0);

    const detail = await request.get(`${API_URL}/ideas-sections/${target.id}`, {
      headers: authHeaders(admin),
    });
    expect(detail.status()).toBe(404);
  });

  test("membro não alcança a tela administrativa", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/adm/ideias-compartilhadas");

    await expect(page.getByTestId("ideas-sections-page")).toHaveCount(0);
  });
});
