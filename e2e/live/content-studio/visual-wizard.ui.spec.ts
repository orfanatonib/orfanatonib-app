import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test, uniqueSuffix } from "../support/live";

/**
 * "Visuais da lição": o admin responde às perguntas (quantidade, tipo e desenho, formato) antes de gerar; cada
 * categoria vê só os desenhos dela; não há aba de documento (só Imagens e PDF). Não chama a IA: valida só a tela.
 */
const CS = `${API_URL}/content-studio`;
const FLAGS = ["content_studio", "content_studio_generation"] as const;
const before: Record<string, number> = {};
let admin = "";
let packageId = "";

type Pkg = { id: string; tracks: Array<{ audience: string; stages: Array<{ id: string; stageType: string; position: number }> }> };

test.describe.serial("Estúdio — visuais da lição", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const key of FLAGS) {
      before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
    }
    const pkg = (await (
      await request.post(`${CS}/packages`, {
        headers: authHeaders(admin),
        data: { theme: `e2e-visuais ${uniqueSuffix()}`, biblicalReferences: "Jonas 1", canonicalObjective: "Confiar em Deus" },
      })
    ).json()) as Pkg;
    packageId = pkg.id;
    // A lição de cada categoria precisa estar aprovada (dependência dos visuais).
    for (const track of pkg.tracks) {
      const lesson = track.stages.find((stage) => stage.stageType === "LESSON")!;
      await request.patch(`${CS}/packages/${packageId}/stages/${lesson.id}/content`, {
        headers: authHeaders(admin),
        data: { structuredContent: { title: "Jonas: Deus chama" } },
      });
      await request.post(`${CS}/packages/${packageId}/stages/${lesson.id}/complete-production`, { headers: authHeaders(admin) });
    }
  });

  test.afterAll(async ({ request }) => {
    if (packageId) await request.post(`${CS}/packages/${packageId}/archive`, { headers: authHeaders(admin) });
    for (const key of FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
    await closeDb();
  });

  test("as perguntas aparecem em passos e só liberam a geração depois de respondidas (celular)", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/adm/estudio/pacotes/${packageId}?audience=BABY&stage=LESSON_VISUALS`);
    const wizard = page.getByTestId("content-studio-visual-wizard");
    await expect(wizard).toBeVisible({ timeout: 20_000 });

    // 1) quantidade: 4 a 10
    const next = page.getByTestId("content-studio-visual-next");
    await expect(next).toBeDisabled();
    await page.getByTestId("content-studio-visual-quantity").locator("input").fill("3");
    await expect(next).toBeDisabled();
    await expect(wizard).toContainText("Informe um número de 4 a 10");
    await page.getByTestId("content-studio-visual-quantity").locator("input").fill("6");
    await expect(wizard).toContainText("Personagens"); // resumo das pranchas do kit
    await next.click();

    // 2) tipo e desenho: o bebê vê os 3 desenhos dele (nenhum de adulto)
    await expect(page.getByTestId("content-studio-visual-format")).toContainText("Kit de recortes");
    await expect(page.getByTestId("content-studio-visual-format")).toContainText("Cenas completas");
    const styles = page.getByTestId("content-studio-visual-style");
    await expect(styles).toContainText("Cartoon fofo");
    await expect(styles).toContainText("Livro ilustrado");
    await expect(styles).toContainText("Desenho bíblico clássico");
    await expect(styles).not.toContainText("Pintura editorial");
    await next.click();

    // 3) formato da página, e só então gerar
    const generate = page.getByTestId("content-studio-visual-generate");
    await expect(generate).toBeDisabled();
    await page.getByTestId("content-studio-visual-orientation").click();
    await page.getByRole("option", { name: /Vertical/ }).click();
    await expect(generate).toBeEnabled();
    await expect(wizard).toContainText("6 pranchas em formato vertical");

    // Nada de documento: só Imagens e PDF não existem enquanto não há versão.
    await expect(page.getByTestId("content-studio-document-tab")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("cada categoria oferece os desenhos dela", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    const cases: Array<[string, string[], string]> = [
      ["TEEN", ["Ilustração moderna", "Graphic novel", "Desenho bíblico clássico"], "Cartoon fofo"],
      ["ADULT", ["Pintura editorial", "Aquarela suave", "Graphic novel"], "Cartoon fofo"],
    ];
    for (const [audience, offered, forbidden] of cases) {
      await page.goto(`/adm/estudio/pacotes/${packageId}?audience=${audience}&stage=LESSON_VISUALS`);
      await page.getByTestId("content-studio-visual-quantity").locator("input").fill("4");
      await page.getByTestId("content-studio-visual-next").click();
      const styles = page.getByTestId("content-studio-visual-style");
      for (const title of offered) await expect(styles).toContainText(title);
      await expect(styles).not.toContainText(forbidden);
    }
  });

  test("a API recusa gerar os visuais sem as escolhas ou com desenho de outra categoria", async ({ request }) => {
    const pkg = (await (await request.get(`${CS}/packages/${packageId}`, { headers: authHeaders(admin) })).json()) as Pkg;
    const stageOf = (audience: string) => pkg.tracks.find((t) => t.audience === audience)!.stages.find((s) => s.stageType === "LESSON_VISUALS")!.id;
    const body = (extra: object) => ({ capability: "TEXT_STRUCTURED", idempotencyKey: `k-${Date.now()}-${Math.random()}`, ...extra });
    const missing = await request.post(`${CS}/packages/${packageId}/stages/${stageOf("CHILD")}/generations`, { headers: authHeaders(admin), data: body({}) });
    expect(missing.status()).toBe(400);
    const wrongStyle = await request.post(`${CS}/packages/${packageId}/stages/${stageOf("ADULT")}/generations`, {
      headers: authHeaders(admin),
      data: body({ visualConfig: { quantity: 4, format: "CUTOUT_KIT", style: "CUTE_CARTOON", orientation: "LANDSCAPE" } }),
    });
    expect(wrongStyle.status()).toBe(400);
    const badQuantity = await request.post(`${CS}/packages/${packageId}/stages/${stageOf("CHILD")}/generations`, {
      headers: authHeaders(admin),
      data: body({ visualConfig: { quantity: 11, format: "CUTOUT_KIT", style: "CUTE_CARTOON", orientation: "LANDSCAPE" } }),
    });
    expect(badQuantity.status()).toBe(400);
  });
});
