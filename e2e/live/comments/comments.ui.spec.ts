import type { APIRequestContext } from "@playwright/test";
import { API_URL } from "../../../playwright.live.config";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
} from "../support/live";

type CommentRecord = {
  id: string;
  name: string;
  comment: string;
  shelter: string;
  neighborhood: string;
  published?: boolean;
};

const RUN_TAG = `e2e-comment-${Date.now()}`;
const CREATED_NAME = `Professor ${RUN_TAG}`;
const CREATED_COMMENT = `Comentário criado pela área do professor ${RUN_TAG}`;
const CREATED_SHELTER = `Abrigo ${RUN_TAG}`;
const CREATED_NEIGHBORHOOD = `Bairro ${RUN_TAG}`;
const UPDATED_COMMENT = `Comentário revisado pela coordenação ${RUN_TAG}`;
const UPDATED_SHELTER = `Abrigo revisado ${RUN_TAG}`;
const UPDATED_NEIGHBORHOOD = `Bairro revisado ${RUN_TAG}`;

const findCommentByName = async (
  request: APIRequestContext,
  token: string,
  name: string,
): Promise<CommentRecord | undefined> => {
  const response = await request.get(`${API_URL}/comments`, {
    headers: authHeaders(token),
  });
  expect(response.status()).toBe(200);
  const comments = (await response.json()) as CommentRecord[];
  return comments.find((comment) => comment.name === name);
};

test.describe.serial("Comentários — UI ao vivo", () => {
  let adminToken: string;
  let createdId: string | undefined;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    const current =
      createdId || (await findCommentByName(request, adminToken, CREATED_NAME))?.id;
    if (current) {
      await request.delete(`${API_URL}/comments/${current}`, {
        headers: authHeaders(adminToken),
      });
    }
  });

  test("professor cria comentário pela área do membro e ele persiste como não publicado", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));
    await page.goto("/area-do-membro");

    await expect(page.getByTestId("member-comments-section")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId("member-comments-toggle-form").click();
    await page.getByTestId("member-comments-field-name").locator("input").fill(CREATED_NAME);
    await page
      .getByTestId("member-comments-field-comment")
      .locator("textarea")
      .first()
      .fill(CREATED_COMMENT);
    await page.getByTestId("member-comments-field-shelter").locator("input").fill(CREATED_SHELTER);
    await page
      .getByTestId("member-comments-field-neighborhood")
      .locator("input")
      .fill(CREATED_NEIGHBORHOOD);
    await page.getByTestId("member-comments-submit").click();

    await expect(page.getByTestId("member-comments-success")).toBeVisible({
      timeout: 20_000,
    });

    await expect
      .poll(
        async () => {
          const created = await findCommentByName(request, adminToken, CREATED_NAME);
          createdId = created?.id ?? createdId;
          return created;
        },
        { timeout: 20_000 },
      )
      .toMatchObject({
        name: CREATED_NAME,
        comment: CREATED_COMMENT,
        shelter: CREATED_SHELTER,
        neighborhood: CREATED_NEIGHBORHOOD,
        published: false,
      });
  });

  test("admin modera pela tela e a API reflete publicação e edição", async ({
    page,
    request,
  }) => {
    expect(createdId, "o comentário do cenário anterior deve existir").toBeTruthy();

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/comentarios");

    await expect(page.getByTestId("comments-manager")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId("comments-search").locator("input").fill(RUN_TAG);
    const card = page.getByTestId(`comments-card-${createdId}`);
    await expect(card).toBeVisible({ timeout: 20_000 });

    await page.getByTestId(`comments-card-publish-${createdId}`).click();
    await page.getByTestId("comments-publish-dialog-confirm").click();
    await expect
      .poll(
        async () => (await findCommentByName(request, adminToken, CREATED_NAME))?.published,
        { timeout: 20_000 },
      )
      .toBe(true);

    await page.getByTestId(`comments-card-edit-${createdId}`).click();
    await page
      .getByTestId("comments-edit-comment")
      .locator("textarea")
      .first()
      .fill(UPDATED_COMMENT);
    await page.getByTestId("comments-edit-shelter").locator("input").fill(UPDATED_SHELTER);
    await page
      .getByTestId("comments-edit-neighborhood")
      .locator("input")
      .fill(UPDATED_NEIGHBORHOOD);
    await page.getByTestId("comments-edit-save").click();

    await expect
      .poll(
        async () => await findCommentByName(request, adminToken, CREATED_NAME),
        { timeout: 20_000 },
      )
      .toMatchObject({
        comment: UPDATED_COMMENT,
        shelter: UPDATED_SHELTER,
        neighborhood: UPDATED_NEIGHBORHOOD,
        published: true,
      });
  });

  test("comentário publicado aparece na área do professor", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));
    await page.goto("/area-do-membro");

    await expect(page.getByTestId(`member-comments-card-${createdId}`)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(UPDATED_COMMENT)).toBeVisible();
  });

  test("admin exclui pela tela e a API deixa de listar o comentário", async ({
    page,
    request,
  }) => {
    expect(createdId, "o comentário do cenário anterior deve existir").toBeTruthy();

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/comentarios");
    await page.getByTestId("comments-search").locator("input").fill(RUN_TAG);
    await expect(page.getByTestId(`comments-card-${createdId}`)).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId(`comments-card-delete-${createdId}`).click();
    await page.getByTestId("comments-delete-dialog-confirm").click();

    await expect
      .poll(
        async () => await findCommentByName(request, adminToken, CREATED_NAME),
        { timeout: 20_000 },
      )
      .toBeUndefined();
    createdId = undefined;
  });
});
