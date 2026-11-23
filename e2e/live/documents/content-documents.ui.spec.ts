import { queryAll, queryOne } from "../support/db";
import {
  addDays,
  cardIds,
  clearAllFilters,
  deleteAllByTag,
  expectCards,
  filtersVisible,
  goToPage,
  PAGE_SIZE,
  summaryText,
  openAs,
  registerCommonSuite,
  searchFor,
  selectFilter,
  setDateFilter,
  todayUtc,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { cleanupData } from "../support/keep-data";
import { API_URL } from "../../../playwright.live.config";
import { massCount } from "../support/keep-data";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import { create, documentRow, mediaCount, pdf } from "./support";

const SCREEN: ListScreen = { p: "documents", path: "/adm/documentos", endpoint: "/documents" };
const { p } = SCREEN;
const LETTERS = "ABCDEFGHIJKLMN".split("");
const UPLOAD_EVERY = 4;

test.describe.serial("Documentos: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = `e2e-docs-${Date.now().toString(36)}`;
  let ids: string[] = [];
  let descriptionTag = "";

  test.beforeAll(async ({ request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    descriptionTag = `descr-${tag}`;
    for (const [index, letter] of LETTERS.entries()) {
      const doc = await create(request, token, {
        name: `${tag} ${letter}`,
        description: index === 5 ? descriptionTag : `Descrição ${letter}`,
        ...(index % UPLOAD_EVERY === 0 ? { file: pdf(`${tag}-${letter}.pdf`) } : { url: `https://example.com/${tag}-${letter}.pdf` }),
      });
      ids.push(doc.id);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await deleteAllByTag(request, "/documents", tag, (row) => row.id as string | undefined);
      expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM documents WHERE name LIKE ?", [`%${tag}%`])).toMatchObject({ n: 0 });
    });
  });

  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "d.createdAt DESC, d.id DESC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT d.id AS id FROM documents d WHERE d.name LIKE ? ${extra} ORDER BY ${order}`,
        [`%${tag}%`, ...params],
      )
    ).map((row) => row.id);

  const withUploadType = () =>
    "AND EXISTS (SELECT 1 FROM media_items m WHERE m.targetType = 'Document' AND m.targetId = d.id AND m.uploadType = ?)";

  registerCommonSuite({
    screen: SCREEN,
    managementFlag: "document_management",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    sampleCardId: () => ids[1],
  });

  test("filtro de tipo: upload e link consultam o banco (subconsulta em media_items) e batem com a lista", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const upload = await selectFilter(page, SCREEN, "uploadType", "upload");
    expect(upload.params.get("uploadType")).toBe("upload");
    const dbUpload = await expectedIds(withUploadType(), ["upload"]);
    expect(dbUpload).toHaveLength(Math.ceil(LETTERS.length / UPLOAD_EVERY));
    expect(upload.body.meta?.totalItems).toBe(dbUpload.length);
    await expectCards(page, p, dbUpload, false);
    for (const id of dbUpload) await expect(page.getByTestId(`${p}-card-type-${id}`)).toHaveText("Upload");

    const link = await selectFilter(page, SCREEN, "uploadType", "link");
    const dbLink = await expectedIds(withUploadType(), ["link"]);
    expect(link.body.meta?.totalItems).toBe(dbLink.length);
    await expectCards(page, p, dbLink.slice(0, 12), false);
    expect(dbLink.length + dbUpload.length).toBe(LETTERS.length);

    const all = await selectFilter(page, SCREEN, "uploadType", "");
    expect(all.params.has("uploadType")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(LETTERS.length);
  });

  test("filtro de tipo sem busca: o total da API é o do banco para toda a tabela", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const reply = await selectFilter(page, SCREEN, "uploadType", "link");
    const row = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM documents d WHERE EXISTS (SELECT 1 FROM media_items m WHERE m.targetType = 'Document' AND m.targetId = d.id AND m.uploadType = 'link')",
    );
    expect(reply.body.meta?.totalItems).toBe(Number(row?.n));
  });

  test("filtro de datas de criação: de hoje, até ontem e a partir de amanhã batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const today = todayUtc();

    const from = await setDateFilter(page, SCREEN, "createdFrom", today);
    expect(from.params.get("createdFrom")).toBe(today);
    const dbFrom = await expectedIds("AND d.createdAt >= ?", [today]);
    expect(from.body.meta?.totalItems).toBe(dbFrom.length);

    const to = await setDateFilter(page, SCREEN, "createdTo", addDays(today, -1));
    expect(to.params.get("createdTo")).toBe(addDays(today, -1));
    expect(to.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();

    const inclusive = await setDateFilter(page, SCREEN, "createdTo", today);
    expect(inclusive.body.meta?.totalItems).toBe(
      (await expectedIds("AND d.createdAt >= ? AND d.createdAt < ?", [today, addDays(today, 1)])).length,
    );

    await setDateFilter(page, SCREEN, "createdFrom", addDays(today, 1));
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
  });

  test("ordenação: nome A–Z, Z–A e criação mais antigos/recentes seguem o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const asc = await selectFilter(page, SCREEN, "sort", "name:ASC");
    expect(asc.params.get("sortBy")).toBe("name");
    expect(asc.params.get("order")).toBe("ASC");
    await expectCards(page, p, (await expectedIds("", [], "d.name ASC")).slice(0, 12));

    const desc = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(desc.params.get("order")).toBe("DESC");
    await expectCards(page, p, (await expectedIds("", [], "d.name DESC")).slice(0, 12));

    const oldest = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(oldest.params.get("sortBy")).toBe("createdAt");
    const shown = await cardIds(page, p);
    const createdAt = new Map(
      (await queryAll<{ id: string; createdAt: string }>("SELECT id, createdAt FROM documents WHERE name LIKE ?", [`%${tag}%`])).map((r) => [r.id, r.createdAt]),
    );
    const times = shown.map((id) => createdAt.get(id) as string);
    expect([...times].sort()).toEqual(times);

    const newest = await selectFilter(page, SCREEN, "sort", "createdAt:DESC");
    expect(newest.params.get("order")).toBe("DESC");
    const back = (await cardIds(page, p)).map((id) => createdAt.get(id) as string);
    expect([...back].sort().reverse()).toEqual(back);
  });

  test("filtros combinados: busca + tipo + data + ordenação, e a busca também olha a descrição", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "uploadType", "link");
    await setDateFilter(page, SCREEN, "createdFrom", todayUtc());
    const reply = await selectFilter(page, SCREEN, "sort", "name:DESC");
    expect(Object.fromEntries(reply.params)).toMatchObject({ search: tag, uploadType: "link", createdFrom: todayUtc(), sortBy: "name", order: "DESC" });
    const expected = await expectedIds(`${withUploadType()} AND d.createdAt >= ?`, ["link", todayUtc()], "d.name DESC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected.slice(0, 12));
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();

    await clearAllFilters(page, SCREEN);
    const byDescription = await searchFor(page, SCREEN, descriptionTag);
    expect(byDescription.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [ids[5]]);
  });

  test("cartão: título, chips de tipo/plataforma/criação e as quatro ações aparecem", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "name:ASC");
    const id = ids[1];
    await expect(page.getByTestId(`${p}-card-${id}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toHaveText(`${tag} B`);
    await expect(page.getByTestId(`${p}-card-type-${id}`)).toHaveText("Link");
    await expect(page.getByTestId(`${p}-card-created-${id}`)).toContainText("Criado em");
    for (const action of ["view", "details", "edit", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${id}`)).toBeVisible();
    await expect(page.getByTestId(`${p}-card-type-${ids[0]}`)).toHaveText("Upload");
  });

  test("ação Visualizar abre o documento e fecha; Detalhes mostra os dados do banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "name:ASC");
    const id = ids[1];
    await page.getByTestId(`${p}-card-view-${id}`).click();
    await expect(page.getByTestId(`${p}-view-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-view-frame`)).toHaveAttribute("src", `https://example.com/${tag}-B.pdf`);
    await page.getByTestId(`${p}-view-close`).click();
    await expect(page.getByTestId(`${p}-view-dialog`)).toBeHidden();

    await page.getByTestId(`${p}-card-details-${id}`).click();
    await expect(page.getByTestId(`${p}-details-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-details-name`)).toHaveText((await documentRow(id))!.name);
    await expect(page.getByTestId(`${p}-details-upload-type`)).toHaveText("Link");
    await expect(page.getByTestId(`${p}-details-url`)).toHaveText(`https://example.com/${tag}-B.pdf`);
    await page.getByTestId(`${p}-details-close`).click();
    await expect(page.getByTestId(`${p}-details-dialog`)).toBeHidden();
  });

  test("criar pela UI (link): o documento nasce no banco e aparece na lista", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const name = `${tag} UI link`;
    await page.getByTestId(`${p}-create`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-form-type-link`).click();
    await page.getByTestId(`${p}-form-name`).fill(name);
    await page.getByTestId(`${p}-form-url`).fill("https://example.com/criado-pela-ui.pdf");
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Documento criado com sucesso!");

    const row = await queryOne<{ id: string }>("SELECT id FROM documents WHERE name = ?", [name]);
    expect(row).not.toBeNull();
    expect(await mediaCount(row!.id)).toBe(1);
    await searchFor(page, SCREEN, name);
    await expectCards(page, p, [row!.id]);
  });

  test("criar pela UI (upload de arquivo): o PDF é enviado de verdade e o tipo vira Upload", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const name = `${tag} UI upload`;
    await page.getByTestId(`${p}-create`).click();
    await page.getByTestId(`${p}-form-name`).fill(name);
    await page.getByTestId(`${p}-form-file`).setInputFiles({ name: "ui-upload.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 ui") });
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    const row = await queryOne<{ id: string }>("SELECT id FROM documents WHERE name = ?", [name]);
    expect(row).not.toBeNull();
    const media = await queryOne<{ uploadType: string; isLocalFile: number }>(
      "SELECT uploadType, isLocalFile FROM media_items WHERE targetType = 'Document' AND targetId = ?",
      [row!.id],
    );
    expect(media).toMatchObject({ uploadType: "upload", isLocalFile: 1 });
    await searchFor(page, SCREEN, name);
    await expect(page.getByTestId(`${p}-card-type-${row!.id}`)).toHaveText("Upload");
  });

  test("criar sem nome mostra o erro de validação e não grava nada", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const before = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM documents WHERE name LIKE ?", [`%${tag}%`]);
    await page.getByTestId(`${p}-create`).click();
    await page.getByTestId(`${p}-form-type-link`).click();
    await page.getByTestId(`${p}-form-url`).fill("https://example.com/x.pdf");
    await page.getByTestId(`${p}-form-name`).evaluate((el) => el.removeAttribute("required"));
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-error`)).toContainText("O nome do documento é obrigatório.");
    expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM documents WHERE name LIKE ?", [`%${tag}%`])).toEqual(before);
    await page.getByTestId(`${p}-form-cancel`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden();
  });

  test("editar pela UI: o formulário vem preenchido e o novo nome chega ao banco e ao cartão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "name:ASC");
    const id = ids[2];
    await page.getByTestId(`${p}-card-edit-${id}`).click();
    await expect(page.getByTestId(`${p}-form-title`)).toHaveText("Editar Documento");
    await expect(page.getByTestId(`${p}-form-name`)).toHaveValue(`${tag} C`);
    const renamed = `${tag} C editado`;
    await page.getByTestId(`${p}-form-name`).fill(renamed);
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Documento atualizado com sucesso!");
    expect((await documentRow(id))?.name).toBe(renamed);
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toHaveText(renamed);
  });

  test("excluir: cancelar mantém; confirmar apaga do banco, some do cartão e atualiza o total", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const victim = await create(request, token, { name: `${tag} apagar`, url: "https://example.com/apagar.pdf" });
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} apagar`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await documentRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-snackbar`)).toContainText("Documento excluído com sucesso!");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await documentRow(victim.id)).toBeNull();
    expect(await mediaCount(victim.id)).toBe(0);
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const extra = `${tag} extra`;
    const made = [];
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) made.push(await create(request, token, { name: `${extra} ${String(i).padStart(2, "0")}`, url: "https://example.com/e.pdf" }));
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
    expect(await documentRow(last)).toBeNull();
    await cleanupData(async () => {
      for (const doc of made) await request.delete(`${API_URL}/documents/${doc.id}`, { headers: authHeaders(token) });
    });
  });

  test("@mobile cartão no celular: ações empilhadas com 44px e filtros funcionando pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "sort", "name:ASC");
    const id = ids[1];
    const view = await page.getByTestId(`${p}-card-view-${id}`).boundingBox();
    const details = await page.getByTestId(`${p}-card-details-${id}`).boundingBox();
    const edit = await page.getByTestId(`${p}-card-edit-${id}`).boundingBox();
    for (const box of [view, details, edit]) expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(view!.x - edit!.x)).toBeLessThanOrEqual(1);
    expect(details!.y).toBeGreaterThan(view!.y);

    await filtersVisible(page, p);
    const reply = await selectFilter(page, SCREEN, "uploadType", "upload");
    expect(reply.params.get("uploadType")).toBe("upload");
  });

  test("massa: cada execução deixa de 5 a 10 documentos pela UI (upload e link), com linha e objeto S3 consistentes", async ({ page, request }) => {
    const total = massCount();
    await openAs(page, request, SCREEN);
    const made: string[] = [];
    for (let index = 0; index < total; index += 1) {
      const name = `${tag} massa ${String(index + 1).padStart(2, "0")}`;
      const upload = index % 2 === 0;
      await page.getByTestId(`${p}-create`).click();
      await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
      await page.getByTestId(`${p}-form-name`).fill(name);
      if (upload) {
        await page.getByTestId(`${p}-form-file`).setInputFiles({ name: `massa-${index}.pdf`, mimeType: "application/pdf", buffer: Buffer.from(`%PDF-1.4 massa ${tag} ${index}`) });
      } else {
        await page.getByTestId(`${p}-form-type-link`).click();
        await page.getByTestId(`${p}-form-url`).fill(`https://example.com/${tag}-massa-${index}.pdf`);
      }
      await page.getByTestId(`${p}-form-submit`).click();
      await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
      made.push(name);
    }
    for (const [index, name] of made.entries()) {
      const row = await queryOne<{ id: string }>("SELECT id FROM documents WHERE name = ?", [name]);
      expect(row, name).not.toBeNull();
      const media = await queryOne<{ uploadType: string; url: string }>("SELECT uploadType, url FROM media_items WHERE targetType = 'Document' AND targetId = ?", [row!.id]);
      expect(media?.uploadType).toBe(index % 2 === 0 ? "upload" : "link");
      expect(media?.url).toBeTruthy();
    }
    await searchFor(page, SCREEN, `${tag} massa`);
    await expect(summaryText(page, p)).toHaveText(new RegExp(`de ${total}$`));
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
