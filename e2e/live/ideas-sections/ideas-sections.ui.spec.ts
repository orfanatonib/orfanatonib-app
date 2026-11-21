import { API_URL } from "../../../playwright.live.config";
import { expectCardActionsAligned } from "../support/card-layout";
import { closeDb, queryOne } from "../support/db";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
} from "../support/live";
import {
  countSections,
  createIdeasPage,
  deleteIdeasPage,
  mediaRows,
  sectionRow,
  sectionRowsByTitle,
} from "./ideas-sections.helpers";

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
  let memberId: string;
  let pageId: string;
  const created: string[] = [];

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    const memberLogin = await loginAs(request, "member");
    member = memberLogin.accessToken;
    memberId = memberLogin.userId;
    pageId = await createIdeasPage(request, admin, `${RUN_TAG}-pagina`);

    created.push((await createSection(request, member, RUN_TAG)).id);
    created.push((await createSection(request, member, `${RUN_TAG}-outra`)).id);
  });

  test.afterAll(async ({ request }) => {
    await deleteIdeasPage(request, admin, pageId);
    for (const id of created) {
      await request.delete(`${API_URL}/ideas-sections/${id}`, {
        headers: authHeaders(admin),
      });
    }
    expect(await sectionRowsByTitle(RUN_TAG)).toEqual([]);
    await closeDb();
  });

  test("[ideas-section.get.ideas-sections#feliz] a tela lista o que a API devolveu (cada card existe no banco)", async ({ page, request }) => {
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
      expect(await sectionRow(id)).not.toBeNull();
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

  test("[ideas-section.post.ideas-sections#feliz] um membro compartilha a ideia pela tela e ela chega na API e no banco", async ({
    page,
    request,
  }) => {
    // Este era o caminho quebrado: qualquer ideia com mídia respondia 400 do
    // banco, e o `catch` mudo dizia só "algo deu errado".
    const title = `${RUN_TAG}-pela-tela`;
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/area-do-membro/compartilhar-ideia");
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

    const row = await sectionRow(saved!.id);
    expect(row).toMatchObject({ title, pageId: null, user_id: memberId });
    expect(await mediaRows(saved!.id)).toHaveLength(1);
  });

  test("[ideas-section.delete.ideas-sections-id#feliz] excluir pela tela remove a ideia de verdade (linha e mídia somem do banco)", async ({
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
    expect(await sectionRow(target.id)).toBeNull();
    expect(await mediaRows(target.id)).toEqual([]);
  });

  test("membro não alcança a tela administrativa", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/adm/ideias-compartilhadas");

    await expect(page.getByTestId("ideas-sections-page")).toHaveCount(0);
  });
  test("[ideas-section.get.ideas-sections-id#feliz] [ideas-section.patch.ideas-sections-id-attach-pageid#feliz] editar e publicar pela tela: carrega a ideia da API pelo id da URL e grava o vínculo no banco", async ({
    page,
    request,
  }) => {
    const target = await createSection(request, member, `${RUN_TAG}-publicar`);
    created.push(target.id);

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/ideias-compartilhadas");
    await page.getByTestId(`ideas-section-edit-${target.id}`).click();

    await expect(page).toHaveURL(new RegExp(`editar-ideias-compartilhadas\\?id=${target.id}`));
    await expect(page.getByTestId("ideas-section-admin")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("ideas-material-title")).toHaveValue(`${RUN_TAG}-publicar`);

    await page.getByTestId("ideas-material-title").fill(`${RUN_TAG}-publicada`);
    await page
      .getByTestId("ideas-section-admin-page-select")
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: `${RUN_TAG}-pagina` }).click();
    await page.getByTestId("ideas-section-admin-save").click();

    await expect(page.getByTestId("ideas-section-admin-feedback")).toBeVisible();
    await expect
      .poll(async () => (await sectionRow(target.id))?.pageId, { timeout: 20_000 })
      .toBe(pageId);
    expect(await sectionRow(target.id)).toMatchObject({ title: `${RUN_TAG}-publicada` });
    expect(await mediaRows(target.id)).toHaveLength(1);

    // Recarregar mostra o que o banco tem: a ideia saiu da fila.
    await page.goto("/adm/ideias-compartilhadas");
    await expect(page.getByTestId("ideas-sections-list").or(page.getByTestId("ideas-sections-empty"))).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId(`ideas-section-card-${target.id}`)).toHaveCount(0);
  });

  test("UI: editar a ideia e tentar fechar a aba pede confirmação (markFormDirty); sem alteração não pede", async ({
    page,
    request,
  }) => {
    const target = await createSection(request, member, `${RUN_TAG}-sujo`);
    created.push(target.id);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/editar-ideias-compartilhadas?id=${target.id}`);
    await expect(page.getByTestId("ideas-material-title")).toHaveValue(`${RUN_TAG}-sujo`, { timeout: 20_000 });

    await page.getByTestId("ideas-material-title").fill(`${RUN_TAG}-sujo-editado`);
    const dialog = page.waitForEvent("dialog", { timeout: 10_000 });
    await page.close({ runBeforeUnload: true });
    expect((await dialog).type()).toBe("beforeunload");
    await (await dialog).dismiss();

    expect((await sectionRow(target.id))?.title).toBe(`${RUN_TAG}-sujo`);
  });

  test("[ideas-section.get.ideas-sections-id#nao-encontrado] ideia que não existe: a API responde 404 e a tela mostra o erro, sem formulário", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/editar-ideias-compartilhadas?id=11111111-1111-4111-8111-111111111111");

    await expect(page.getByTestId("ideas-section-edit-error")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("ideas-section-admin")).toHaveCount(0);
    await page.getByTestId("ideas-section-edit-back").click();
    await expect(page).toHaveURL(/\/adm\/ideias-compartilhadas$/);
  });

  test("UI: abrir a edição sem escolher ideia mostra o aviso e não chama a API", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/editar-ideias-compartilhadas");
    await expect(page.getByTestId("ideas-section-edit-missing")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("ideas-section-admin")).toHaveCount(0);
  });

  test("UI: enviar sem preencher: a tela recusa, a API não é chamada e o banco não muda", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));
    const before = await countSections();
    await page.goto("/area-do-membro/compartilhar-ideia");
    await page.getByTestId("idea-share-submit").click();
    await expect(page.getByTestId("idea-share-snackbar")).toBeVisible();
    expect(await countSections()).toBe(before);
  });

  test("UI: líder não alcança a tela administrativa", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "leader"));
    await page.goto("/adm/ideias-compartilhadas");
    await expect(page.getByTestId("ideas-sections-page")).toHaveCount(0);
  });

  test("UI: visitante sem sessão não vê a tela administrativa nem o formulário de envio", async ({ page }) => {
    await page.goto("/adm/ideias-compartilhadas");
    await expect(page.getByTestId("ideas-sections-page")).toHaveCount(0);
    await page.goto("/area-do-membro/compartilhar-ideia");
    await expect(page.getByTestId("idea-share-page")).toHaveCount(0);
  });

  test("[ideas-section.post.ideas-sections#flag-desligada] [ideas-section.get.ideas-sections#flag-desligada] idea_moderation e idea_submission desligadas: as telas somem, a API devolve 403 FEATURE_DISABLED e o banco não muda", async ({
    page,
    request,
  }) => {
    const keys = ["idea_moderation", "idea_submission"];
    const original = new Map<string, boolean>();
    for (const key of keys) {
      const row = await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]);
      original.set(key, row?.enabled === 1);
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
    }
    try {
      const rows = await countSections();
      await seedBrowserSession(page, await loginAs(request, "admin"));
      await page.goto("/adm/ideias-compartilhadas");
      await expect(page.getByTestId("ideas-sections-page")).toHaveCount(0);
      await page.goto("/area-do-membro/compartilhar-ideia");
      await expect(page.getByTestId("idea-share-page")).toHaveCount(0);

      const response = await request.get(`${API_URL}/ideas-sections`, { headers: authHeaders(admin) });
      expect(response.status()).toBe(403);
      expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
      expect(await countSections()).toBe(rows);
    } finally {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, {
          headers: authHeaders(admin),
          data: { enabled: original.get(key) },
        });
      }
    }
  });

  test("UI: idea_submission ligada só para líder: o membro não vê o formulário nem consegue enviar; o banco não muda", async ({
    page,
    request,
  }) => {
    const row = await queryOne<{ enabled: number; metadata: string | Record<string, unknown> | null }>(
      "SELECT enabled, metadata FROM feature_flags WHERE `key` = ?",
      ["idea_submission"],
    );
    const meta = typeof row?.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : row?.metadata;
    const originalRoles = Array.isArray(meta?.targetRoles) ? (meta.targetRoles as string[]) : [];
    await request.patch(`${API_URL}/feature-flags/idea_submission`, {
      headers: authHeaders(admin),
      data: { enabled: true, targetRoles: ["leader"] },
    });
    try {
      const rows = await countSections();
      await seedBrowserSession(page, await loginAs(request, "member"));
      await page.goto("/area-do-membro/compartilhar-ideia");
      await expect(page.getByTestId("idea-share-page")).toHaveCount(0);
      const denied = await request.post(`${API_URL}/ideas-sections`, {
        headers: authHeaders(member),
        multipart: { sectionData: JSON.stringify({ title: `${RUN_TAG}-so-lider`, description: "x", medias: [] }) },
      });
      expect(denied.status()).toBe(403);
      expect(await countSections()).toBe(rows);
    } finally {
      await request.patch(`${API_URL}/feature-flags/idea_submission`, {
        headers: authHeaders(admin),
        data: { enabled: row?.enabled === 1, targetRoles: originalRoles },
      });
    }
  });

  test("UI: @mobile membro compartilha a ideia no celular (375×812): sem rolagem horizontal, alvos de toque ≥ 44 px e a ideia chega ao banco", async ({
    page,
    request,
  }) => {
    const title = `${RUN_TAG}-celular`;
    await seedBrowserSession(page, await loginAs(request, "member"));
    await page.goto("/area-do-membro/compartilhar-ideia");
    await expect(page.getByTestId("idea-share-page")).toBeVisible({ timeout: 20_000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    for (const id of ["idea-share-submit", "idea-share-cancel"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await page.getByTestId("idea-title").fill(title);
    await page.getByTestId("idea-description").fill("Enviada do celular");
    await page.getByTestId("idea-tab-videos").click();
    await page.getByTestId("idea-video-upload-type").getByRole("combobox").click();
    await page.getByRole("option", { name: /Link do YouTube/ }).click();
    await page.getByTestId("idea-video-url").fill("https://youtu.be/mobile");
    await page.getByTestId("idea-video-add").click();
    await page.getByTestId("idea-share-submit").click();

    await expect.poll(async () => (await sectionRowsByTitle(title)).length, { timeout: 20_000 }).toBe(1);
    const [saved] = await sectionRowsByTitle(title);
    created.push(saved.id);
    expect(saved.user_id).toBe(memberId);
  });

  test("UI: @mobile admin vê a fila no celular: sem rolagem horizontal e botões de ação com ≥ 44 px", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/ideias-compartilhadas");
    await expect(page.getByTestId("ideas-sections-list")).toBeVisible({ timeout: 20_000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const edit = page.getByTestId(`ideas-section-edit-${created[0]}`);
    await edit.scrollIntoViewIfNeeded();
    expect((await edit.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectCardActionsAligned(page, [
      `ideas-section-details-${created[0]}`,
      `ideas-section-edit-${created[0]}`,
    ]);
  });
});
