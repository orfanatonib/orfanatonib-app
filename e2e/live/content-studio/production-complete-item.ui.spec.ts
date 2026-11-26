import type { APIRequestContext } from "@playwright/test";

import { closeDb, queryAll, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { CS, PUBLICATION_FLAGS, callApi, cleanupPackages, createPackage, getPackage, setFlag, type Pkg } from "./publication.fixtures";

/**
 * Produção: "Concluir este item" avança sozinho para o próximo item (sem gerar nada), e concluir TODOS os itens de uma
 * categoria NÃO a envia para a revisão: ela fica "Pronta para enviar" até o usuário mandar. Ao enviar, vai para a
 * tela de revisão, onde a categoria aparece como "Pendente de revisão".
 */
const before: Record<string, number> = {};
const created: string[] = [];
let admin = "";
let pkg: Pkg;

type TrackView = { audience: string; stages: Array<{ id: string; stageType: string; position: number; status: string }> };
const tracksOf = async (request: APIRequestContext): Promise<TrackView[]> => (await getPackage(request, admin, pkg.id)).tracks as unknown as TrackView[];

async function saveContent(request: APIRequestContext, stageId: string, position: number): Promise<void> {
  expect((await callApi(request, admin, "patch", `${CS}/packages/${pkg.id}/stages/${stageId}/content`, { structuredContent: { title: `Item ${position}` } })).status()).toBe(200);
}

test.describe.serial("Estúdio — produção: concluir item, avançar e só enviar quando o usuário mandar (UI)", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const flag of PUBLICATION_FLAGS) {
      before[flag] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [flag]))?.enabled ?? 0;
      await setFlag(request, admin, flag, true);
    }
    pkg = await createPackage(request, admin, "concluir-item", created);
    // O BABY já foi enviado para a revisão (como no uso real); as crianças vão sendo concluídas.
    const baby = (await tracksOf(request)).find((track) => track.audience === "BABY")!;
    for (const stage of [...baby.stages].sort((a, b) => a.position - b.position)) {
      await saveContent(request, stage.id, stage.position);
      expect([200, 201]).toContain((await callApi(request, admin, "post", `${CS}/packages/${pkg.id}/stages/${stage.id}/complete-production`)).status());
    }
    expect([200, 201]).toContain((await callApi(request, admin, "post", `${CS}/packages/${pkg.id}/submit-review`, { audiences: ["BABY"] })).status());
  });

  test.afterAll(async ({ request }) => {
    await cleanupPackages(request, admin, created);
    for (const flag of PUBLICATION_FLAGS) await setFlag(request, admin, flag, before[flag] === 1);
    await closeDb();
  });

  test("'Concluir este item' leva ao próximo item e não gera conteúdo sozinho", async ({ page, request }) => {
    test.setTimeout(100_000);
    const child = (await tracksOf(request)).find((track) => track.audience === "CHILD")!;
    const [first, second] = [...child.stages].sort((a, b) => a.position - b.position);
    await saveContent(request, first.id, first.position);

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${pkg.id}?audience=CHILD&stage=${first.stageType}`);
    const complete = page.getByTestId("content-studio-complete-stage");
    await expect(complete).toBeVisible({ timeout: 20_000 });
    await expect(complete).toHaveText("Concluir este item");
    await complete.click();

    // Concluído e já no próximo item; o feedback não promete revisão.
    await expect(page).toHaveURL(new RegExp(`stage=${second.stageType}`), { timeout: 20_000 });
    await expect(page.getByTestId("content-studio-feedback")).toContainText("Item concluído");
    await expect(page.getByTestId("content-studio-feedback")).not.toContainText("revisão");

    const after = (await tracksOf(request)).find((track) => track.audience === "CHILD")!.stages;
    expect(after.find((stage) => stage.id === first.id)?.status).toBe("PRODUCER_APPROVED");
    // Nada foi gerado sozinho no item seguinte: continua como estava e sem trabalho de geração.
    expect(after.find((stage) => stage.id === second.id)?.status).toBe("NOT_STARTED");
    const jobs = await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM content_generation_jobs WHERE stage_id = ?", [second.id]);
    expect(Number(jobs?.total ?? 0)).toBe(0);
  });

  test("concluir o último item NÃO envia a categoria: fica 'Pronta para enviar' até o usuário mandar", async ({ page, request }) => {
    test.setTimeout(120_000);
    const child = (await tracksOf(request)).find((track) => track.audience === "CHILD")!;
    const ordered = [...child.stages].sort((a, b) => a.position - b.position);
    // Conclui, pela API, todos menos o último; o último é concluído pela tela.
    for (const stage of ordered.slice(1, -1)) {
      await saveContent(request, stage.id, stage.position);
      expect([200, 201]).toContain((await callApi(request, admin, "post", `${CS}/packages/${pkg.id}/stages/${stage.id}/complete-production`)).status());
    }
    const last = ordered[ordered.length - 1];
    await saveContent(request, last.id, last.position);

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${pkg.id}?audience=CHILD&stage=${last.stageType}`);
    await page.getByTestId("content-studio-complete-stage").click();
    await expect(page.getByTestId("content-studio-feedback")).toContainText("Item concluído", { timeout: 20_000 });
    // No último item não há próximo: fica onde está e avisa que falta o comando de enviar.
    await expect(page).toHaveURL(new RegExp(`stage=${last.stageType}`));
    await expect(page.getByTestId("content-studio-track-ready-notice")).toContainText("só vai para a revisão quando você enviar");
    await expect(page.getByTestId("content-studio-audience-CHILD")).toContainText("Pronta para enviar");

    // Nada foi enviado: as crianças continuam concluídas (não em revisão) e a revisão só mostra o BABY.
    const statuses = (await tracksOf(request)).find((track) => track.audience === "CHILD")!.stages.map((stage) => stage.status);
    expect(new Set(statuses)).toEqual(new Set(["PRODUCER_APPROVED"]));
    await page.goto(`/adm/estudio/revisao/${pkg.id}`);
    await expect(page.getByTestId("content-studio-review-track-BABY")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-track-CHILD")).toHaveCount(0);
  });

  test("ao enviar a categoria, vai para a revisão e ela aparece 'Pendente de revisão'", async ({ page, request }) => {
    test.setTimeout(100_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/estudio/pacotes/${pkg.id}?audience=CHILD`);
    // Envio pela PRÓPRIA categoria; o botão geral não aparece (TEEN e ADULT ainda em produção).
    await expect(page.getByTestId("content-studio-submit-review")).toHaveCount(0);
    await page.getByTestId("content-studio-track-send-review").click();
    await expect(page.getByTestId("content-studio-send-review-names")).toContainText("Crianças");
    await page.getByTestId("content-studio-send-review-confirm").click();

    await expect(page).toHaveURL(new RegExp(`/adm/estudio/revisao/${pkg.id}\\?audience=CHILD`), { timeout: 20_000 });
    await expect(page.getByTestId("content-studio-review-track-CHILD")).toContainText("Pendente de revisão");
    const inReview = await queryAll<{ status: string }>(
      "SELECT DISTINCT s.status AS status FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ? AND t.audience = 'CHILD'",
      [pkg.id],
    );
    expect(inReview.map((row) => row.status)).toEqual(["IN_REVIEW"]);
  });
});
