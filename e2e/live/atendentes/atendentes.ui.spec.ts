import { queryAll, queryOne } from "../support/db";
import { cleanupData } from "../support/keep-data";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import {
  addDays,
  cardIds,
  clearAllFilters,
  expectCards,
  filtersVisible,
  goToPage,
  openAs,
  PAGE_SIZE,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  summaryText,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import { create, mediaCount, pdf, pdfRow, recordRow, recordsWithTag, removeApi, TARGET_ESTADUAL, TARGET_FEDERAL } from "./support";
import { localShift } from "../support/local-day";

const SCREEN: ListScreen = { p: "atendentes", path: "/adm/antecedentes", endpoint: "/antecedentes-criminais" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLMN".split("");
/** Índice % 3: 0 = estadual e federal, 1 = só estadual, 2 = só federal. */
const SHAPE = ["complete", "only_estadual", "only_federal"] as const;
const DISPLAY = "COALESCE(NULLIF(a.name, ''), u.name)";
const FROM = "FROM atendentes a LEFT JOIN users u ON a.attendableType = 'user' AND u.id = a.attendableId";
const HAS_ESTADUAL = "EXISTS (SELECT 1 FROM media_items m WHERE m.targetId = a.id AND m.targetType IN ('AtendenteEstadual', 'Atendente'))";
const HAS_FEDERAL = "EXISTS (SELECT 1 FROM media_items m WHERE m.targetId = a.id AND m.targetType = 'AtendenteFederal')";

test.describe.serial("Antecedentes criminais: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = `e2e-ant-${Date.now().toString(36)}`;
  let ids: string[] = [];
  let linkedId = "";
  let linkedUserName = "";
  let admin = "";
  let actor: Actor;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    actor = await createActor(request, admin, "member", `${tag}-vinculo`);
    linkedUserName = `E2E ${tag}-vinculo`;
    for (const [index, letter] of LETTERS.entries()) {
      const shape = SHAPE[index % SHAPE.length];
      const record = await create(request, admin, {
        name: `${tag} ${letter}`,
        estadual: shape !== "only_federal" ? pdf(`${tag}-${letter}-estadual.pdf`) : undefined,
        federal: shape !== "only_estadual" ? pdf(`${tag}-${letter}-federal.pdf`) : undefined,
      });
      ids.push(record.id);
    }
    // Cadastro sem nome próprio, vinculado a um usuário: o cartão mostra o nome dele e a busca o encontra por ele.
    const linked = await create(request, admin, { attendableType: "user", attendableId: actor.id, estadual: pdf(`${tag}-vinculo.pdf`) });
    linkedId = linked.id;
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      const rows = await queryAll<{ id: string }>("SELECT id FROM atendentes WHERE name LIKE ? OR attendableId = ?", [`%${tag}%`, actor.id]);
      for (const row of rows) await removeApi(request, admin, row.id);
      await removeActors(request, admin, [actor.id]);
      expect(await recordsWithTag(tag)).toBe(0);
    });
  });

  /** Ids do banco dos cadastros desta execução (nome do cadastro OU nome do usuário vinculado). */
  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "a.createdAt DESC, a.id ASC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT a.id AS id ${FROM} WHERE (a.name LIKE ? OR u.name LIKE ?) ${extra} ORDER BY ${order}`,
        [`%${tag}%`, `%${tag}%`, ...params],
      )
    ).map((row) => row.id);

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "criminal_records",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => linkedId,
    leaderAllowed: true,
  });

  test("filtro de vínculo: usuário traz só o cadastro vinculado; integração, nenhum", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const user = await selectFilter(page, SCREEN, "attendableType", "user");
    expect(user.params.get("attendableType")).toBe("user");
    const dbUser = await expectedIds("AND a.attendableType = 'user'");
    expect(dbUser).toEqual([linkedId]);
    expect(user.body.meta?.totalItems ?? user.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, dbUser);
    await expect(page.getByTestId(`${p}-card-link-${linkedId}`)).toHaveText("Usuário");

    await selectFilter(page, SCREEN, "attendableType", "integration");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();

    const all = await selectFilter(page, SCREEN, "attendableType", "");
    expect(all.params.has("attendableType")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length + 1);
  });

  test("filtro de documentos: completo, só estadual e só federal batem com o banco e com os botões dos cartões", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const complete = await selectFilter(page, SCREEN, "documents", "complete");
    expect(complete.params.get("documents")).toBe("complete");
    const dbComplete = await expectedIds(`AND ${HAS_ESTADUAL} AND ${HAS_FEDERAL}`);
    expect(dbComplete.length).toBe(5);
    expect(complete.body.meta?.totalItems).toBe(5);
    await expectCards(page, p, dbComplete);
    for (const id of dbComplete) {
      await expect(page.getByTestId(`${p}-card-pdf-estadual-${id}`)).toBeVisible();
      await expect(page.getByTestId(`${p}-card-pdf-federal-${id}`)).toBeVisible();
    }

    const onlyEstadual = await selectFilter(page, SCREEN, "documents", "only_estadual");
    const dbEstadual = await expectedIds(`AND ${HAS_ESTADUAL} AND NOT ${HAS_FEDERAL}`);
    expect(onlyEstadual.body.meta?.totalItems).toBe(dbEstadual.length);
    expect(dbEstadual.length).toBe(6);
    await expectCards(page, p, dbEstadual.slice(0, PAGE_SIZE));
    for (const id of dbEstadual) await expect(page.getByTestId(`${p}-card-pdf-federal-missing-${id}`)).toHaveText("Sem federal");

    const onlyFederal = await selectFilter(page, SCREEN, "documents", "only_federal");
    const dbFederal = await expectedIds(`AND NOT ${HAS_ESTADUAL} AND ${HAS_FEDERAL}`);
    expect(onlyFederal.body.meta?.totalItems).toBe(dbFederal.length);
    expect(dbFederal.length).toBe(4);
    await expectCards(page, p, dbFederal);
    for (const id of dbFederal) await expect(page.getByTestId(`${p}-card-pdf-estadual-missing-${id}`)).toHaveText("Sem estadual");
    expect(dbComplete.length + dbEstadual.length + dbFederal.length).toBe(LETTERS.length + 1);

    const all = await selectFilter(page, SCREEN, "documents", "");
    expect(all.params.has("documents")).toBe(false);
  });

  test("filtro de datas de cadastro: de hoje, até ontem e a partir de amanhã batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = localShift();
    const from = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(from.body.meta?.totalItems).toBe((await expectedIds("AND a.createdAt >= ?", [today])).length);
    const to = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(to.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    const inclusive = await setDateFilter(page, SCREEN, "createdTo", today);
    expect(inclusive.body.meta?.totalItems).toBe((await expectedIds("AND a.createdAt >= ? AND a.createdAt < ?", [today, addDays(today, 1)])).length);
    await setDateFilter(page, SCREEN, "createdFrom", addDays(today, 1));
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação: nome exibido A–Z/Z–A, cadastro mais antigo e atualizados recentemente seguem o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const asc = await selectFilter(page, SCREEN, "sort", "name:ASC");
    expect(asc.params.get("sortBy")).toBe("name");
    expect(asc.params.get("order")).toBe("ASC");
    await expectCards(page, p, (await expectedIds("", [], `${DISPLAY} ASC, a.id ASC`)).slice(0, PAGE_SIZE));

    const desc = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(desc.params.get("order")).toBe("DESC");
    await expectCards(page, p, (await expectedIds("", [], `${DISPLAY} DESC, a.id ASC`)).slice(0, PAGE_SIZE));

    const oldest = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(oldest.params.get("sortBy")).toBe("createdAt");
    await expectCards(page, p, (await expectedIds("", [], "a.createdAt ASC, a.id ASC")).slice(0, PAGE_SIZE));

    const updated = await selectFilter(page, SCREEN, "sort", "updatedAt:DESC");
    expect(updated.params.get("sortBy")).toBe("updatedAt");
    await expectCards(page, p, (await expectedIds("", [], "a.updatedAt DESC, a.id ASC")).slice(0, PAGE_SIZE));
  });

  test("busca olha o nome do cadastro e também o nome do usuário vinculado", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byName = await searchFor(page, SCREEN, `${tag} G`);
    expect(byName.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[6]]);

    const byUser = await searchFor(page, SCREEN, linkedUserName);
    expect(byUser.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [linkedId]);
    await expect(page.getByTestId(`${p}-card-title-${linkedId}`)).toHaveText(linkedUserName);
  });

  test("filtros combinados: busca + documentos + data + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "documents", "only_estadual");
    await setDateFilter(page, SCREEN, "createdFrom", localShift());
    const reply = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, documents: "only_estadual", createdFrom: localShift(), sortBy: "name", order: "DESC" });
    const expected = await expectedIds(`AND ${HAS_ESTADUAL} AND NOT ${HAS_FEDERAL} AND a.createdAt >= ?`, [localShift()], `${DISPLAY} DESC, a.id ASC`);
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected);
    const cleared = await clearAllFilters(page, SCREEN);
    expect(cleared.params.has("documents")).toBe(false);
    expect(cleared.params.get("sortBy")).toBe("name");
  });

  test("cartão: nome, vínculo, atualização e os botões de PDF; abrir um PDF mostra a visualização assinada", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toHaveText(`${tag} D`);
    await expect(page.getByTestId(`${p}-card-updated-${id}`)).toContainText("Atualizado em");
    await expect(page.getByTestId(`${p}-card-link-${id}`)).toHaveCount(0);
    for (const action of ["view", "edit", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${id}`)).toBeVisible();

    await page.getByTestId(`${p}-card-pdf-estadual-${id}`).click();
    await expect(page.getByTestId("document-preview-modal")).toBeVisible();
    const src = (await page.getByTestId("document-preview-frame").getAttribute("src")) ?? "";
    expect(src).toContain("/private/AtendenteEstadual/");
    expect(src).toContain("X-Amz-Signature=");
    await page.getByTestId("document-preview-close").click();
    await expect(page.getByTestId("document-preview-modal")).toBeHidden();

    await page.getByTestId(`${p}-card-pdf-federal-${id}`).click();
    expect((await page.getByTestId("document-preview-frame").getAttribute("src")) ?? "").toContain("/private/AtendenteFederal/");
    await page.getByTestId("document-preview-close").click();
  });

  test("ver: o diálogo mostra nome, vínculo e PDFs do banco; abre a visualização e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, linkedUserName);
    await page.getByTestId(`${p}-card-view-${linkedId}`).click();
    await expect(page.getByTestId(`${p}-view-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-view-link`)).toContainText(`Usuário: ${linkedUserName}`);
    await expect(page.getByTestId(`${p}-view-pdf-estadual`)).toBeVisible();
    await expect(page.getByTestId(`${p}-view-pdf-federal`)).toHaveCount(0);
    await page.getByTestId(`${p}-view-pdf-estadual-preview`).click();
    await expect(page.getByTestId("document-preview-modal")).toBeVisible();
    await page.getByTestId("document-preview-close").click();
    await expect(page.getByTestId("document-preview-modal")).toBeHidden();
    await page.getByTestId(`${p}-view-close`).click();
    await expect(page.getByTestId(`${p}-view-dialog`)).toBeHidden();

    await searchFor(page, SCREEN, `${tag} A`);
    await page.getByTestId(`${p}-card-view-${ids[0]}`).click();
    await expect(page.getByTestId(`${p}-view-name`)).toHaveText(`${tag} A`);
    await expect(page.getByTestId(`${p}-view-pdf-estadual`)).toBeVisible();
    await expect(page.getByTestId(`${p}-view-pdf-federal`)).toBeVisible();
  });

  test("criar pela UI: sem PDF o botão fica desabilitado; com o PDF o cadastro nasce no banco e aparece na lista", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const name = `${tag} UI criado`;
    await page.getByTestId(`${p}-create`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-form-title`)).toHaveText("Novo Antecedente Criminal");
    await page.getByTestId(`${p}-form-name`).fill(name);
    await expect(page.getByTestId(`${p}-form-submit`)).toBeDisabled();
    await page.getByTestId(`${p}-form-file-estadual`).setInputFiles({ name: "ui-estadual.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 ui estadual") });
    await expect(page.getByTestId(`${p}-form-submit`)).toBeEnabled();
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Antecedente criminal criado com sucesso!");

    const row = await queryOne<{ id: string }>("SELECT id FROM atendentes WHERE name = ?", [name]);
    expect(row).not.toBeNull();
    expect(await mediaCount(row!.id)).toBe(1);
    expect(await pdfRow(row!.id, TARGET_ESTADUAL)).not.toBeNull();
    await searchFor(page, SCREEN, name);
    await expectCards(page, p, [row!.id]);
    await cleanupData(async () => { await removeApi(request, admin, row!.id); });
  });

  test("criar sem nome nem vínculo mostra a regra e não grava; cancelar fecha sem gravar", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const before = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM atendentes");
    await page.getByTestId(`${p}-create`).click();
    await page.getByTestId(`${p}-form-file-estadual`).setInputFiles({ name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 x") });
    await expect(page.getByTestId(`${p}-form-submit`)).toBeDisabled();
    expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM atendentes")).toEqual(before);
    await page.getByTestId(`${p}-form-cancel`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden();
  });

  test("editar pela UI: o formulário vem preenchido; novo nome e PDF federal chegam ao banco e ao cartão", async ({ page, request }) => {
    const target = ids[1];
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} B`);
    await page.getByTestId(`${p}-card-edit-${target}`).click();
    await expect(page.getByTestId(`${p}-form-title`)).toHaveText("Editar Antecedente Criminal");
    await expect(page.getByTestId(`${p}-form-name`)).toHaveValue(`${tag} B`);
    const renamed = `${tag} B editado`;
    await page.getByTestId(`${p}-form-name`).fill(renamed);
    await page.getByTestId(`${p}-form-file-federal`).setInputFiles({ name: "novo-federal.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 novo federal") });
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Antecedente criminal atualizado com sucesso!");
    expect((await recordRow(target))?.name).toBe(renamed);
    expect(await pdfRow(target, TARGET_FEDERAL)).not.toBeNull();
    await expect(page.getByTestId(`${p}-card-title-${target}`)).toHaveText(renamed);
    await expect(page.getByTestId(`${p}-card-pdf-federal-${target}`)).toBeVisible();
  });

  test("editar: remover o PDF estadual de quem tem os dois apaga só esse arquivo", async ({ page, request }) => {
    const target = ids[0];
    expect(await pdfRow(target, TARGET_ESTADUAL)).not.toBeNull();
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} A`);
    await page.getByTestId(`${p}-card-edit-${target}`).click();
    await page.getByTestId(`${p}-form-remove-estadual`).click();
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    expect(await pdfRow(target, TARGET_ESTADUAL)).toBeNull();
    expect(await pdfRow(target, TARGET_FEDERAL)).not.toBeNull();
    await expect(page.getByTestId(`${p}-card-pdf-estadual-missing-${target}`)).toBeVisible();
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("excluir: cancelar mantém; confirmar apaga do banco com os PDFs, some do cartão e zera o total", async ({ page, request }) => {
    const victim = await create(request, admin, { name: `${tag} apagar`, estadual: pdf(`${tag}-apagar.pdf`), federal: pdf(`${tag}-apagar-f.pdf`) });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await recordRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Antecedente criminal excluído com sucesso!");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await recordRow(victim.id)).toBeNull();
    expect(await mediaCount(victim.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const extra = `${tag} extra`;
    const made = [];
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) made.push(await create(request, admin, { name: `${extra} ${String(i).padStart(2, "0")}`, estadual: pdf(`${tag}-e${i}.pdf`) }));
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE + 1}`);
    await goToPage(page, SCREEN, 2);
    const last = (await cardIds(page, p))[0];
    expect(await cardIds(page, p)).toHaveLength(1);

    await page.getByTestId(`${p}-card-delete-${last}`).click();
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    }, (params) => params.get("page") === "1" && params.get("search") === extra);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE}`);
    expect(await cardIds(page, p)).toHaveLength(PAGE_SIZE);
    expect(await recordRow(last)).toBeNull();
    await cleanupData(async () => { for (const record of made) await removeApi(request, admin, record.id); });
  });

  test("@mobile cartão no celular: ações empilhadas com 44px, botões de PDF com 44px e filtros pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = ids[3];
    const view = await page.getByTestId(`${p}-card-view-${id}`).boundingBox();
    const edit = await page.getByTestId(`${p}-card-edit-${id}`).boundingBox();
    const estadual = await page.getByTestId(`${p}-card-pdf-estadual-${id}`).boundingBox();
    for (const box of [view, edit, estadual]) expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(view!.x - edit!.x)).toBeLessThanOrEqual(1);
    expect(edit!.y).toBeGreaterThan(view!.y);

    await filtersVisible(page, p);
    const reply = await selectFilter(page, SCREEN, "documents", "complete");
    expect(reply.params.get("documents")).toBe("complete");
  });
});
