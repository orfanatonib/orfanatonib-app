import type { APIRequestContext } from "@playwright/test";

import { closeDb, queryAll, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  CS,
  PUBLICATION_FLAGS,
  STAGE_TEXT_DOCUMENT,
  callApi,
  cleanupPackages,
  createPackage,
  getPackage,
  setFlag,
  type Pkg,
} from "./publication.fixtures";

/**
 * Revisão completa e separada da produção, com publicação INCREMENTAL por categoria:
 *  - produção envia (só o BABY); a revisão mostra só o que foi liberado, devolve com o que mudar ou aprova tudo;
 *  - aprovado, publica em Materiais de Visita (`/adm/paginas-materiais-visita`);
 *  - depois, só as crianças são enviadas, revisadas e publicadas NA MESMA página, sem tocar no BABY já publicado.
 */
const before: Record<string, number> = {};
const created: string[] = [];
let admin = "";
let pkg: Pkg;

type Audience = "BABY" | "CHILD";

async function produceAndSend(request: APIRequestContext, packageId: string, audience: Audience): Promise<void> {
  const full = await getPackage(request, admin, packageId);
  const track = (full.tracks as unknown as Array<{ audience: string; stages: Array<{ id: string; position: number }> }>).find(
    (item) => item.audience === audience,
  )!;
  for (const stage of [...track.stages].sort((a, b) => a.position - b.position)) {
    expect(
      (
        await callApi(request, admin, "patch", `${CS}/packages/${packageId}/stages/${stage.id}/content`, {
          structuredContent: { title: `Etapa ${stage.position}` },
          contentDocument: STAGE_TEXT_DOCUMENT,
        })
      ).status(),
    ).toBe(200);
    expect([200, 201]).toContain(
      (await callApi(request, admin, "post", `${CS}/packages/${packageId}/stages/${stage.id}/complete-production`)).status(),
    );
  }
  expect([200, 201]).toContain(
    (await callApi(request, admin, "post", `${CS}/packages/${packageId}/submit-review`, { audiences: [audience] })).status(),
  );
}

type TrackView = {
  audience: string;
  publishedAt: string | null;
  stages: Array<{ id: string; status: string; position: number; stageType: string }>;
};
const tracksOf = async (request: APIRequestContext, id: string): Promise<TrackView[]> =>
  (await getPackage(request, admin, id)).tracks as unknown as TrackView[];

const sectionsOf = async (pageId: string) =>
  queryAll<{ id: string; category: string }>("SELECT id, category FROM visit_material_sections WHERE page_id = ? ORDER BY category", [
    pageId,
  ]);
const mediaCount = async (sectionId: string): Promise<number> =>
  Number((await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM media_items WHERE targetId = ?", [sectionId]))?.total ?? 0);

test.describe.serial("Estúdio — revisão separada da produção e publicação incremental (UI)", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const flag of PUBLICATION_FLAGS) {
      before[flag] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [flag]))?.enabled ?? 0;
      await setFlag(request, admin, flag, true);
    }
    pkg = await createPackage(request, admin, "revisao", created);
    await produceAndSend(request, pkg.id, "BABY");
  });

  test.afterAll(async ({ request }) => {
    await cleanupPackages(request, admin, created);
    for (const flag of PUBLICATION_FLAGS) await setFlag(request, admin, flag, before[flag] === 1);
    await closeDb();
  });

  test("a revisão mostra SÓ o que foi liberado (BABY), sem nenhum caminho para a produção; os cartões de cada lista dizem o certo", async ({
    page,
    request,
  }) => {
    test.setTimeout(100_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/revisao/${pkg.id}`);
    await expect(page.getByTestId("content-studio-review-workspace")).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId("content-studio-review-track-BABY")).toBeVisible();
    for (const audience of ["CHILD", "TEEN", "ADULT"])
      await expect(page.getByTestId(`content-studio-review-track-${audience}`)).toHaveCount(0);
    await expect(page.getByTestId("content-studio-review-stage-tabs").getByRole("tab")).toHaveCount(5);
    await expect(page.getByTestId("content-studio-review-progress")).toContainText("0 de 5 itens aprovados");
    await expect(page).toHaveURL(/audience=BABY/);
    await expect(page).toHaveURL(/stage=/);
    // Revisão e produção desacopladas: nada aponta para a produção.
    await expect(page.getByText(/Abrir na produção|Ver na produção|Ir para a produção|Ainda em produção/)).toHaveCount(0);

    // Lista de REVISÃO: "Iniciar revisão" (ninguém decidiu nada ainda) e só a categoria liberada.
    await page.goto(`/adm/estudio/revisao?busca=${encodeURIComponent(pkg.theme)}`);
    const reviewCard = page.getByTestId(`content-studio-review-card-${pkg.id}`);
    await expect(reviewCard).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`content-studio-review-open-${pkg.id}`)).toContainText("Iniciar revisão");
    await expect(page.getByTestId(`content-studio-review-card-progress-${pkg.id}`)).toContainText("0 de 5");

    // Lista de PRODUÇÃO: só parte das categorias foi para a revisão => "Continuar produção", nunca "Revisar material".
    await page.goto(`/adm/estudio/producao?busca=${encodeURIComponent(pkg.theme)}`);
    const productionCard = page.getByTestId(`content-studio-package-card-${pkg.id}`);
    await expect(productionCard).toBeVisible({ timeout: 20_000 });
    await expect(productionCard).toContainText("Parte em revisão");
    await expect(page.getByTestId(`content-studio-package-${pkg.id}`)).toContainText("Continuar produção");
    await expect(productionCard).not.toContainText("Revisar material");
  });

  test("devolver exige o ajuste; a observação sobrevive ao recarregar; a produção vê o que mudar e não decide", async ({
    page,
    request,
  }) => {
    test.setTimeout(100_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    // Devolve a Brincadeira (última etapa): editar uma etapa deixaria as seguintes desatualizadas, e a última não tem seguintes.
    await page.goto(`/adm/estudio/revisao/${pkg.id}?audience=BABY&stage=STANDARD_GAME`);
    await expect(page.getByTestId("content-studio-review-decision")).toBeVisible({ timeout: 20_000 });

    const devolver = page.getByTestId("content-studio-review-request-changes");
    await expect(devolver).toBeDisabled();
    await expect(page.getByTestId("content-studio-review-feedback-needed")).toBeVisible();
    await page.getByTestId("content-studio-review-feedback-input").fill("Deixar o texto mais curto e simples.");
    await expect(devolver).toBeEnabled();

    // A observação ainda não enviada é recuperada depois de recarregar.
    await page.reload();
    await expect(page.getByTestId("content-studio-review-recovered")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-feedback-input")).toHaveValue("Deixar o texto mais curto e simples.");

    await page.getByTestId("content-studio-review-request-changes").click();
    await expect(page.getByTestId("content-studio-review-feedback")).toContainText("devolvido", { timeout: 20_000 });

    const returned = (await tracksOf(request, pkg.id))
      .find((item) => item.audience === "BABY")!
      .stages.filter((stage) => stage.status === "CHANGES_REQUESTED");
    expect(returned).toHaveLength(1);

    // Produção: vê o que mudar (a observação) e NÃO tem aprovar/devolver.
    await page.goto(`/adm/estudio/pacotes/${pkg.id}?audience=BABY&stage=${returned[0].stageType}`);
    await expect(page.getByTestId(`content-studio-stage-comments-${returned[0].id}`)).toContainText(
      "Deixar o texto mais curto e simples.",
      { timeout: 20_000 },
    );
    await expect(page.getByTestId("content-studio-review-actions")).toHaveCount(0);

    // A produção ajusta e reenvia: a etapa volta para a revisão.
    expect(
      (
        await callApi(request, admin, "patch", `${CS}/packages/${pkg.id}/stages/${returned[0].id}/content`, {
          structuredContent: { title: "Ajustada" },
          contentDocument: STAGE_TEXT_DOCUMENT,
        })
      ).status(),
    ).toBe(200);
    expect([200, 201]).toContain(
      (await callApi(request, admin, "post", `${CS}/packages/${pkg.id}/stages/${returned[0].id}/complete-production`)).status(),
    );
    expect([200, 201]).toContain(
      (await callApi(request, admin, "post", `${CS}/packages/${pkg.id}/submit-review`, { audiences: ["BABY"] })).status(),
    );

    // Histórico: reenviado → ajuste solicitado → enviado (do mais recente para o mais antigo), nas duas telas.
    await page.goto(`/adm/estudio/revisao/${pkg.id}?audience=BABY&stage=${returned[0].stageType}`);
    await page.getByRole("button", { name: /Histórico de revisão \(3\)/ }).click({ timeout: 20_000 });
    const timeline = page.getByTestId("content-studio-review-timeline");
    await expect(timeline).toBeVisible({ timeout: 20_000 });
    await expect(timeline.getByRole("listitem")).toHaveText([/Reenviado para revisão/, /Ajuste solicitado/, /Enviado para revisão/]);
    await page.goto(`/adm/estudio/pacotes/${pkg.id}?audience=BABY&stage=${returned[0].stageType}`);
    // O histórico da produção fica recolhido (a tela não vira uma lista longa): abre antes de contar.
    await page.getByRole("button", { name: /Histórico de revisão \(3\)/ }).click({ timeout: 20_000 });
    await expect(page.getByTestId(`content-studio-stage-review-history-${returned[0].id}`).getByRole("listitem")).toHaveCount(3, {
      timeout: 20_000,
    });
  });

  test("aprovar tudo (com confirmação) abre a publicação; publicar leva para Materiais de Visita só com o BABY", async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/revisao/${pkg.id}?audience=BABY`);
    const approveAll = page.getByTestId("content-studio-review-approve-all");
    await expect(approveAll).toBeVisible({ timeout: 20_000 });
    await expect(approveAll).toContainText("(5)");
    await approveAll.click();
    await expect(page.getByTestId("content-studio-review-approve-all-dialog")).toBeVisible();
    await page.getByTestId("content-studio-review-approve-all-confirm").click();

    // Tudo aprovado: o diálogo de publicar abre sozinho, com as categorias que entram e o testamento (1ª vez).
    const dialog = page.getByTestId("content-studio-publish-dialog");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("content-studio-publish-categories")).toContainText("Entram agora");
    await expect(page.getByTestId("content-studio-publish-testament")).toBeVisible();
    await page.getByTestId("content-studio-publish-confirm").click();
    await expect(page).toHaveURL(/\/adm\/paginas-materiais-visita/, { timeout: 120_000 });

    const page1 = await queryOne<{ id: string }>("SELECT id FROM visit_material_pages WHERE sourceLessonId = ?", [pkg.id]);
    expect(page1).not.toBeNull();
    const sections = await sectionsOf(page1!.id);
    expect(sections.map((item) => item.category)).toEqual(["BABY"]);
    // Um PDF por item, com o nome do item (nada de "docs"/"pdf" da categoria). Os dois itens de visuais não entram aqui:
    // o material de teste não tem imagens, e item sem conteúdo é pulado sem barrar os demais.
    const titles = await queryAll<{ title: string }>("SELECT title FROM media_items WHERE targetId = ? ORDER BY createdAt, id", [
      sections[0].id,
    ]);
    expect(titles.map((item) => item.title).sort()).toEqual(["Brincadeira divertida", "Fixação divertida do versículo", "Lição"]);

    // O que o membro vê com SÓ uma categoria publicada: o material na lista (sem filtro de categoria) e, dentro
    // dele, apenas a categoria que existe (sem "Geral" nem as outras faixas).
    await page.goto("/area-do-membro/materiais-visita");
    await expect(page.getByTestId("visit-material-member-list-category-filter")).toHaveCount(0);
    await page
      .getByRole("tab", { name: /antigo testamento/i })
      .first()
      .click();
    await expect(page.getByText(pkg.theme).first()).toBeVisible({ timeout: 30_000 });
    await page.goto(`/area-do-membro/materiais-visita/${page1!.id}`);
    await expect(page.getByTestId("visit-material-category-BABY")).toBeVisible({ timeout: 30_000 });
    for (const absent of ["GENERAL", "CHILD", "TEEN", "ADULT"]) {
      await expect(page.getByTestId(`visit-material-category-${absent}`)).toHaveCount(0);
    }

    const full = await getPackage(request, admin, pkg.id);
    expect(full.status).toBe("IN_PROGRESS"); // CHILD/TEEN/ADULT ainda em produção: o pacote volta ao caminho delas
    const tracks = await tracksOf(request, pkg.id);
    expect(tracks.find((item) => item.audience === "BABY")?.publishedAt).not.toBeNull();
    expect(tracks.find((item) => item.audience === "CHILD")?.publishedAt).toBeNull();
  });

  test("categoria publicada fica travada na produção, com a etiqueta e o aviso; a lista diz 'Publicado em parte'", async ({
    page,
    request,
  }) => {
    test.setTimeout(100_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${pkg.id}?audience=BABY`);
    await expect(page.getByTestId("content-studio-track-published-BABY")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-track-published-notice")).toBeVisible();

    // A API também recusa mexer na categoria publicada.
    const babyStage = (await tracksOf(request, pkg.id)).find((item) => item.audience === "BABY")!.stages[0];
    expect(
      (
        await callApi(request, admin, "patch", `${CS}/packages/${pkg.id}/stages/${babyStage.id}/content`, {
          structuredContent: { title: "mudou" },
        })
      ).status(),
    ).toBe(409);

    await page.goto(`/adm/estudio/producao?busca=${encodeURIComponent(pkg.theme)}`);
    const card = page.getByTestId(`content-studio-package-card-${pkg.id}`);
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card).toContainText("Publicado em parte");
    await expect(page.getByTestId(`content-studio-package-${pkg.id}`)).toContainText("Continuar produção");
  });

  test("depois, só as crianças: enviar, aprovar tudo e publicar NA MESMA página, sem refazer o BABY", async ({ page, request }) => {
    test.setTimeout(180_000);
    const pageRow = await queryOne<{ id: string }>("SELECT id FROM visit_material_pages WHERE sourceLessonId = ?", [pkg.id]);
    const babySection = (await sectionsOf(pageRow!.id)).find((item) => item.category === "BABY")!;
    const babyMediaBefore = await mediaCount(babySection.id);
    expect(babyMediaBefore).toBeGreaterThan(0);

    await produceAndSend(request, pkg.id, "CHILD");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/revisao/${pkg.id}?audience=CHILD`);

    // BABY (publicado) e CHILD (a revisar) aparecem; o BABY não aceita decisão.
    await expect(page.getByTestId("content-studio-review-track-CHILD")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-track-BABY")).toContainText("Publicada");
    await page.getByTestId("content-studio-review-track-BABY").click();
    await expect(page.getByTestId("content-studio-review-block-reason")).toContainText("já foi publicada");
    await page.getByTestId("content-studio-review-track-CHILD").click();

    await page.getByTestId("content-studio-review-approve-all").click();
    await page.getByTestId("content-studio-review-approve-all-confirm").click();

    const dialog = page.getByTestId("content-studio-publish-dialog");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    // Já existe a página: só acrescenta; não pergunta o testamento de novo.
    await expect(dialog).toContainText("acrescentar");
    await expect(page.getByTestId("content-studio-publish-testament")).toHaveCount(0);
    await page.getByTestId("content-studio-publish-confirm").click();
    await expect(page).toHaveURL(/\/adm\/paginas-materiais-visita/, { timeout: 150_000 });

    // Mesma página, agora com BABY e CHILD; o BABY continua idêntico.
    const pages = await queryAll<{ id: string }>("SELECT id FROM visit_material_pages WHERE sourceLessonId = ?", [pkg.id]);
    expect(pages.map((item) => item.id)).toEqual([pageRow!.id]);
    const sections = await sectionsOf(pageRow!.id);
    expect(sections.map((item) => item.category)).toEqual(["BABY", "CHILD"]);
    expect(sections.find((item) => item.category === "BABY")?.id).toBe(babySection.id);
    expect(await mediaCount(babySection.id)).toBe(babyMediaBefore);
    expect(await mediaCount(sections.find((item) => item.category === "CHILD")!.id)).toBeGreaterThan(0);

    const tracks = await tracksOf(request, pkg.id);
    expect(tracks.find((item) => item.audience === "CHILD")?.publishedAt).not.toBeNull();
    expect(tracks.find((item) => item.audience === "TEEN")?.publishedAt).toBeNull();
  });

  test("celular 375px: a revisão cabe, sem rolagem lateral, com a barra de decisão fixa", async ({ page, request }) => {
    test.setTimeout(100_000);
    const mobilePkg = await createPackage(request, admin, "revisao-mobile", created);
    await produceAndSend(request, mobilePkg.id, "BABY");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/adm/estudio/revisao/${mobilePkg.id}`);
    await expect(page.getByTestId("content-studio-review-workspace")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-mobile-bar")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    // Uma só seta de "voltar" (a do cabeçalho do Estúdio) e nenhum título repetido na tela de detalhe.
    await expect(page.getByRole("link", { name: /voltar/i })).toHaveCount(1);
    await expect(page.getByTestId("content-studio-shell-title")).toHaveCount(0);
    for (const id of ["content-studio-review-approve-all", "content-studio-shell-back"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
    }
  });

  test("material em que nada foi enviado não tem tela de revisão (estado vazio, sem ir para a produção)", async ({ page, request }) => {
    test.setTimeout(60_000);
    const empty = await createPackage(request, admin, "revisao-vazio", created);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/revisao/${empty.id}`);
    await expect(page.getByTestId("content-studio-review-empty")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-empty")).toContainText("ainda não enviou");
    // A navegação geral do Estúdio tem "Produção"; o estado vazio da revisão, não: nada leva a ela dali.
    await expect(page.getByTestId("content-studio-review-empty").getByRole("button", { name: /produção/i })).toHaveCount(0);
  });

  test("devolver um item do BABY não tira a decisão dos itens das Crianças (material volta a 'em produção')", async ({ page, request }) => {
    test.setTimeout(150_000);
    const mixed = await createPackage(request, admin, "revisao-devolve-baby", created);
    await produceAndSend(request, mixed.id, "BABY");
    await produceAndSend(request, mixed.id, "CHILD");
    await seedBrowserSession(page, await loginAs(request, "admin"));

    // Devolve a Brincadeira do BABY (último item) pela tela.
    await page.goto(`/adm/estudio/revisao/${mixed.id}?audience=BABY&stage=STANDARD_GAME`);
    await expect(page.getByTestId("content-studio-review-decision")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("content-studio-review-feedback-input").fill("Trocar o objeto da brincadeira.");
    await page.getByTestId("content-studio-review-request-changes").click();
    await expect(page.getByTestId("content-studio-review-feedback")).toContainText("devolvido", { timeout: 20_000 });
    // A produção começa a ajustar o item devolvido: o material assume "em produção" (o caso que escondia os botões).
    const game = (await tracksOf(request, mixed.id))
      .find((item) => item.audience === "BABY")!
      .stages.find((stage) => stage.stageType === "STANDARD_GAME")!;
    expect(
      (
        await callApi(request, admin, "patch", `${CS}/packages/${mixed.id}/stages/${game.id}/content`, {
          structuredContent: { title: "Ajustando" },
        })
      ).status(),
    ).toBe(200);
    expect((await getPackage(request, admin, mixed.id)).status).toBe("IN_PROGRESS");

    // Crianças segue em revisão: aprovar e devolver continuam disponíveis em TODOS os itens (inclusive Visuais da lição).
    await page.goto(`/adm/estudio/revisao/${mixed.id}?audience=CHILD&stage=LESSON_VISUALS`);
    await expect(page.getByTestId("content-studio-review-approve")).toBeEnabled({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-feedback-input")).toBeVisible();
    await page.getByTestId("content-studio-review-approve").click();
    await expect(page.getByTestId("content-studio-review-feedback")).toContainText("aprovad", { timeout: 20_000 });

    // Na produção, o item já aprovado (como o enviado) fica só em "Prévia": sem a aba de edição.
    await page.goto(`/adm/estudio/pacotes/${mixed.id}?audience=CHILD&stage=LESSON_VISUALS`);
    await expect(page.getByTestId("content-studio-preview-title")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-document-tab")).toHaveCount(0);
    await expect(page.getByTestId("content-studio-pdf-tab-button")).toHaveCount(0);
  });

  test("aprovar: 'este item', 'esta categoria' e 'tudo' (todas as categorias, depois a publicação)", async ({ page, request }) => {
    test.setTimeout(150_000);
    const two = await createPackage(request, admin, "revisao-aprovar", created);
    await produceAndSend(request, two.id, "BABY");
    await produceAndSend(request, two.id, "CHILD");
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/revisao/${two.id}?audience=BABY`);

    // Textos: item (não "etapa"); as duas categorias aparecem como "Pendente de revisão".
    await expect(page.getByTestId("content-studio-review-approve")).toHaveText("Aprovar este item", { timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-track-BABY")).toContainText("Pendente de revisão");
    await expect(page.getByTestId("content-studio-review-track-CHILD")).toContainText("Pendente de revisão");
    await expect(page.getByTestId("content-studio-review-approve-category")).toContainText("Aprovar esta categoria (5)");
    await expect(page.getByTestId("content-studio-review-approve-all")).toContainText("Aprovar tudo (10)");

    // "Aprovar esta categoria": só os 5 itens do BABY; as crianças não mudam; nada é publicado.
    await page.getByTestId("content-studio-review-approve-category").click();
    await expect(page.getByTestId("content-studio-review-approve-category-dialog")).toBeVisible();
    await page.getByTestId("content-studio-review-approve-category-confirm").click();
    await expect(page.getByTestId("content-studio-review-feedback")).toContainText("5 itens aprovados", { timeout: 30_000 });
    const afterCategory = (await tracksOf(request, two.id)).reduce<Record<string, string[]>>(
      (acc, item) => ({ ...acc, [item.audience]: item.stages.map((stage) => stage.status) }),
      {},
    );
    expect(new Set(afterCategory.BABY)).toEqual(new Set(["APPROVED"]));
    expect(new Set(afterCategory.CHILD)).toEqual(new Set(["IN_REVIEW"]));
    await expect(page.getByTestId("content-studio-review-approve-all")).toContainText("Aprovar tudo (5)");

    // "Aprovar tudo": todas as categorias que faltam, e a publicação abre (as duas categorias entram).
    await page.getByTestId("content-studio-review-approve-all").click();
    await expect(page.getByTestId("content-studio-review-approve-all-dialog")).toBeVisible();
    await page.getByTestId("content-studio-review-approve-all-confirm").click();
    await expect(page.getByTestId("content-studio-publish-dialog")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("content-studio-publish-categories")).toBeVisible();
    const afterAll = (await tracksOf(request, two.id)).find((item) => item.audience === "CHILD")!;
    expect(new Set(afterAll.stages.map((stage) => stage.status))).toEqual(new Set(["APPROVED"]));
    await page.getByTestId("content-studio-publish-cancel").click();
  });
});
