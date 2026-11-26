import { API_URL } from "../../../playwright.live.config";
import type { ContentPackageResponse } from "../../../src/features/content-studio/types";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test, uniqueSuffix } from "../support/live";

/**
 * Fluxo pedido pelo ministério: "Novo material" cria Baby, Crianças, Adolescentes e Adultos de uma vez; o detalhe
 * separa por abas; cada aba tem as cinco etapas; e o envio para revisão vai por categoria ou todas de uma vez.
 */
const CS = `${API_URL}/content-studio`;
const AUDIENCES = ["BABY", "CHILD", "TEEN", "ADULT"] as const;
const STAGES = ["LESSON", "LESSON_VISUALS", "VERSE_VISUALS", "VERSE_FIXATION", "STANDARD_GAME"] as const;
const FLAGS = ["content_studio", "content_studio_review"] as const;
const before: Record<string, number> = {};
let admin = "";
let packageId = "";

type Pkg = ContentPackageResponse;
const get = async (request: import("@playwright/test").APIRequestContext) =>
  (await (await request.get(`${CS}/packages/${packageId}`, { headers: authHeaders(admin) })).json()) as Pkg;

/** Salva e conclui as cinco etapas de uma categoria (pré-condição de revisão). */
async function completeTrack(request: import("@playwright/test").APIRequestContext, audience: string): Promise<void> {
  const pkg = await get(request);
  const track = pkg.tracks.find((item) => item.audience === audience)!;
  for (const stage of [...track.stages].sort((a, b) => a.position - b.position)) {
    const saved = await request.patch(`${CS}/packages/${packageId}/stages/${stage.id}/content`, {
      headers: authHeaders(admin),
      data: { structuredContent: { title: `${audience} ${stage.stageType}` } },
    });
    expect(saved.status()).toBe(200);
    const done = await request.post(`${CS}/packages/${packageId}/stages/${stage.id}/complete-production`, { headers: authHeaders(admin) });
    expect([200, 201]).toContain(done.status());
  }
}

test.describe.serial("Estúdio — cinco etapas, abas por categoria e revisão por categoria", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const key of FLAGS) {
      before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
    }
  });

  test.afterAll(async ({ request }) => {
    if (packageId) await request.post(`${CS}/packages/${packageId}/archive`, { headers: authHeaders(admin) });
    for (const key of FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
    await closeDb();
  });

  test("novo material cria as quatro categorias de uma vez, sem perguntar o público, com abas e cinco etapas", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/estudio/producao");
    await page.getByTestId("content-studio-new-material").click();
    await expect(page.getByTestId("content-studio-create-audience")).toHaveCount(0);
    await page.getByTestId("content-studio-theme-input").fill(`e2e-cinco ${uniqueSuffix()}`);
    await page.getByTestId("content-studio-references-input").fill("João 2:1-11");
    await page.getByTestId("content-studio-objective-input").fill("Mostrar que Jesus transforma");
    const createdPromise = page.waitForResponse((r) => r.url().endsWith("/content-studio/packages") && r.request().method() === "POST");
    await page.getByTestId("content-studio-create-package").click();
    const created = (await (await createdPromise).json()) as Pkg;
    packageId = created.id;

    await expect(page).toHaveURL(new RegExp(`/adm/estudio/pacotes/${packageId}`));
    for (const audience of AUDIENCES) await expect(page.getByTestId(`content-studio-audience-${audience}`)).toBeVisible();
    // Cada aba mostra as cinco etapas, na ordem pedida.
    for (const audience of AUDIENCES) {
      await page.getByTestId(`content-studio-audience-${audience}`).click();
      await expect(page.getByTestId(`content-studio-audience-${audience}`)).toHaveAttribute("aria-selected", "true");
      for (const stage of STAGES) await expect(page.getByTestId(`content-studio-stage-tab-${stage}`)).toBeVisible();
    }
    // Prova no banco: 4 trilhas × 5 etapas, nenhuma etapa antiga.
    const rows = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ?", [packageId]);
    expect(rows?.n).toBe(20);
    expect(await queryOne<{ n: number }>("SELECT COUNT(DISTINCT s.stageType) AS n FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ?", [packageId])).toMatchObject({ n: 5 });
  });

  test("sem categoria pronta, o envio para revisão não aparece", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${packageId}`);
    await expect(page.getByTestId("content-studio-production-header")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-submit-review")).toHaveCount(0);
    await expect(page.getByTestId("content-studio-track-send-review")).toHaveCount(0);
  });

  test("envia só Crianças: a aba mostra 'Em revisão', as outras continuam em produção e editáveis", async ({ page, request }) => {
    await completeTrack(request, "CHILD");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${packageId}?audience=CHILD`);
    // Só as Crianças estão prontas: o envio é pela própria categoria e o botão geral NÃO aparece (as outras estão em produção).
    await expect(page.getByTestId("content-studio-submit-review")).toHaveCount(0);
    await page.getByTestId("content-studio-track-send-review").click();
    const dialog = page.getByTestId("content-studio-send-review-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("content-studio-send-review-names")).toContainText("Crianças");
    const sent = page.waitForResponse((r) => r.url().endsWith(`/packages/${packageId}/submit-review`) && r.request().method() === "POST");
    await page.getByTestId("content-studio-send-review-confirm").click();
    const body = (await sent).request().postDataJSON() as { audiences?: string[] };
    expect(body.audiences).toEqual(["CHILD"]);
    // Enviou: a categoria vai para a tela de REVISÃO, onde fica "Pendente de revisão".
    await expect(page).toHaveURL(new RegExp(`/adm/estudio/revisao/${packageId}\\?audience=CHILD`), { timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-track-CHILD")).toContainText("Pendente de revisão");
    // De volta à produção: a categoria enviada mostra "Em revisão" e as outras seguem em produção.
    await page.goto(`/adm/estudio/pacotes/${packageId}?audience=CHILD`);
    await expect(page.getByTestId("content-studio-audience-CHILD")).toContainText("Em revisão");
    await expect(page.getByTestId("content-studio-audience-BABY")).not.toContainText("Em revisão");

    const pkg = await get(request);
    expect(pkg.status).toBe("IN_REVIEW");
    const status = await queryOne<{ s: string }>(
      "SELECT GROUP_CONCAT(DISTINCT s.status) AS s FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ? AND t.audience = 'CHILD'",
      [packageId],
    );
    expect(status?.s).toBe("IN_REVIEW");
    const others = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ? AND t.audience <> 'CHILD' AND s.status = 'IN_REVIEW'",
      [packageId],
    );
    expect(others?.n).toBe(0);

    // Baby segue editável enquanto Crianças está em revisão: duas abas, "Edição" e "Prévia".
    await page.getByTestId("content-studio-audience-BABY").click();
    await expect(page.getByTestId("content-studio-document-tab")).toBeEnabled();
    await expect(page.getByTestId("content-studio-document-tab")).toHaveText("Edição");
    await expect(page.getByTestId("content-studio-pdf-tab-button")).toHaveText("Prévia");

    // Crianças está em revisão (bloqueada): só a "Prévia", em todos os itens, inclusive nos de imagens.
    await page.getByTestId("content-studio-audience-CHILD").click();
    await expect(page.getByTestId("content-studio-preview-title")).toHaveText("Prévia");
    await expect(page.getByTestId("content-studio-document-tab")).toHaveCount(0);
    await expect(page.getByTestId("content-studio-pdf-tab-button")).toHaveCount(0);
    await page.getByTestId("content-studio-stage-tab-LESSON_VISUALS").click();
    await expect(page.getByTestId("content-studio-preview-title")).toHaveText("Prévia");
    await expect(page.getByTestId("content-studio-visuals-tab-images")).toHaveCount(0);
  });

  test("envia todas de uma vez: as categorias prontas entram em revisão juntas", async ({ page, request }) => {
    for (const audience of ["BABY", "TEEN", "ADULT"]) await completeTrack(request, audience);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${packageId}`);
    // Todas as categorias prontas ou já enviadas: agora o botão geral aparece.
    await expect(page.getByTestId("content-studio-submit-review")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("content-studio-submit-review").click();
    await expect(page.getByTestId("content-studio-send-review-dialog")).toBeVisible();
    const sent = page.waitForResponse((r) => r.url().endsWith(`/packages/${packageId}/submit-review`) && r.request().method() === "POST");
    await page.getByTestId("content-studio-send-review-confirm").click();
    const body = (await sent).request().postDataJSON() as { audiences?: string[] };
    expect([...(body.audiences ?? [])].sort()).toEqual(["ADULT", "BABY", "TEEN"]);
    await expect(page).toHaveURL(new RegExp(`/adm/estudio/revisao/${packageId}`), { timeout: 20_000 });
    const inReview = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ? AND s.status = 'IN_REVIEW'",
      [packageId],
    );
    expect(inReview?.n).toBe(20);
    // Nada mais a enviar.
    await page.goto(`/adm/estudio/pacotes/${packageId}`);
    await expect(page.getByTestId("content-studio-submit-review")).toHaveCount(0);
  });
  test("a URL acompanha a categoria e a etapa, e o link aberto vai direto para elas (celular)", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    // Sem parâmetros: a URL passa a dizer onde o usuário está.
    await page.goto(`/adm/estudio/pacotes/${packageId}`);
    await expect(page.getByTestId("content-studio-audience-BABY")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/audience=BABY&stage=LESSON$/);
    // Trocar a categoria e a etapa atualiza a URL.
    await page.getByTestId("content-studio-audience-TEEN").click();
    await expect(page).toHaveURL(/audience=TEEN&stage=LESSON$/);
    await page.getByTestId("content-studio-stage-tab-VERSE_VISUALS").click();
    await expect(page).toHaveURL(/audience=TEEN&stage=VERSE_VISUALS$/);
    // Link direto abre exatamente nessa categoria e etapa.
    await page.goto(`/adm/estudio/pacotes/${packageId}?audience=ADULT&stage=STANDARD_GAME`);
    await expect(page.getByTestId("content-studio-audience-ADULT")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("content-studio-stage-tab-STANDARD_GAME")).toHaveAttribute("aria-current", "step");
    // Parâmetro inválido volta para um destino válido e a URL é corrigida.
    await page.goto(`/adm/estudio/pacotes/${packageId}?audience=XYZ&stage=NADA`);
    await expect(page).toHaveURL(/audience=BABY&stage=LESSON$/);
    // Celular: as quatro categorias cabem na largura, sem rolagem lateral.
    for (const audience of AUDIENCES) {
      const box = await page.getByTestId(`content-studio-audience-${audience}`).boundingBox();
      expect(box && box.x >= 0 && box.x + box.width <= 375).toBeTruthy();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
