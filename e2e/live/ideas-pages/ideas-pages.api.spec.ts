import { API_URL } from "../../../playwright.live.config";
import { expectNoRow, expectRow } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Testes E2E ao vivo do contrato da API `/ideas-pages`.
 * Valida a criação, listagem, busca por id, atualização e remoção de páginas de ideias.
 */
const RUN_TAG = `e2e-page-${Date.now()}`;

type IdeasPageResponse = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  sections?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
};

test.describe.serial("Páginas de Ideias — API ao vivo", () => {
  let adminToken: string;
  let createdPageId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
  });

  test("a rota POST /ideas-pages exige autenticação", async ({ request }) => {
    const response = await request.post(`${API_URL}/ideas-pages`, {
      multipart: {
        ideasMaterialsPageData: JSON.stringify({
          title: `Ideias ${RUN_TAG}`,
          subtitle: "Subtítulo",
          description: "Descrição",
          sections: [],
        }),
      },
    });
    expect(response.status()).toBe(401);
  });

  test("a rota GET /ideas-pages permite acesso público", async ({ request }) => {
    const response = await request.get(`${API_URL}/ideas-pages`);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as IdeasPageResponse[];
    expect(Array.isArray(body)).toBe(true);
  });

  test("[ideas-page.post.ideas-pages#feliz] cria uma nova página de ideias com seções (linha no banco)", async ({ request }) => {
    const payload = {
      title: `Página de Ideias E2E ${RUN_TAG}`,
      subtitle: "Subtítulo E2E",
      description: "Descrição E2E para a página de ideias",
      sections: [
        {
          title: "Seção 1",
          description: "Descrição da Seção 1",
          public: true,
          medias: [],
        },
      ],
    };

    const response = await request.post(`${API_URL}/ideas-pages`, {
      headers: authHeaders(adminToken),
      multipart: {
        ideasMaterialsPageData: JSON.stringify(payload),
      },
    });

    expect(response.status()).toBe(201);
    const body = (await response.json()) as IdeasPageResponse;
    expect(body.id).toBeTruthy();
    expect(body.title).toBe(payload.title);
    expect(body.description).toBe(payload.description);
    expect(body.sections?.length).toBe(1);

    createdPageId = body.id;
    await expectRow("ideas_pages", { id: createdPageId });
  });

  test("busca a página de ideias criada por ID", async ({ request }) => {
    expect(createdPageId, "a criação do teste anterior precisa ter funcionado").toBeTruthy();

    // A página criada não é pública: com sessão aparece; anônimo recebe 404.
    const response = await request.get(`${API_URL}/ideas-pages/${createdPageId}`, {
      headers: authHeaders(adminToken),
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as IdeasPageResponse;
    expect(body.id).toBe(createdPageId);

    const anonymous = await request.get(`${API_URL}/ideas-pages/${createdPageId}`);
    expect(anonymous.status()).toBe(404);
  });

  test("[ideas-page.patch.ideas-pages-id#feliz] atualiza a página de ideias (título novo no banco)", async ({ request }) => {
    expect(createdPageId, "a criação do teste anterior precisa ter funcionado").toBeTruthy();

    const payload = {
      id: createdPageId,
      title: `Página de Ideias E2E Atualizada ${RUN_TAG}`,
      subtitle: "Subtítulo Atualizado",
      description: "Descrição Atualizada",
      sections: [
        {
          title: "Seção Atualizada",
          description: "Descrição da Seção Atualizada",
          public: true,
          medias: [],
        },
      ],
    };

    const response = await request.patch(`${API_URL}/ideas-pages/${createdPageId}`, {
      headers: authHeaders(adminToken),
      multipart: {
        ideasMaterialsPageData: JSON.stringify(payload),
      },
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as IdeasPageResponse;
    expect(body.title).toBe(payload.title);
    await expectRow("ideas_pages", { id: createdPageId, title: payload.title });
  });

  test("[ideas-page.delete.ideas-pages-id#feliz] remove a página de ideias (some do banco)", async ({ request }) => {
    expect(createdPageId, "a criação do teste anterior precisa ter funcionado").toBeTruthy();

    const response = await request.delete(`${API_URL}/ideas-pages/${createdPageId}`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    await expectNoRow("ideas_pages", { id: createdPageId });
  });
});
