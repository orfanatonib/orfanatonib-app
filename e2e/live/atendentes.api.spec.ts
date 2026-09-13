import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Testes E2E ao vivo do contrato da API `/antecedentes-criminais`.
 * Valida autenticação, criação com multipart/form-data, busca paginada,
 * consulta individual, edição e exclusão no banco/S3 real.
 */
const RUN_TAG = `e2e-${Date.now()}`;

type AtendenteResponse = {
  id: string;
  name?: string;
  attendableType?: string | null;
  attendableId?: string | null;
  attendableDisplayName?: string;
  pdfEstadual?: { url: string };
  pdfFederal?: { url: string };
  createdAt: string;
};

type PaginatedAtendentes = {
  data: AtendenteResponse[];
  total: number;
  page: number;
  limit: number;
};

test.describe.serial("Antecedentes Criminais — API ao vivo", () => {
  let adminToken: string;
  let createdId: string;
  const testName = `Atendente Teste ${RUN_TAG}`;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
  });

  test("todas as rotas exigem autenticação", async ({ request }) => {
    const responseGet = await request.get(`${API_URL}/antecedentes-criminais`);
    expect(responseGet.status()).toBe(401);

    const responsePost = await request.post(`${API_URL}/antecedentes-criminais`);
    expect(responsePost.status()).toBe(401);
  });

  test("cria um antecedente criminal com PDF usando multipart/form-data", async ({ request }) => {
    const payload = {
      name: testName,
      pdfEstadual: {
        title: "Certidão Estadual Teste",
        description: "PDF de teste E2E",
        uploadType: "upload",
        mediaType: "document",
        isLocalFile: true,
      },
    };

    const dummyPdfBuffer = Buffer.from("%PDF-1.4 Antecedente Criminal Teste E2E");

    const response = await request.post(`${API_URL}/antecedentes-criminais`, {
      headers: authHeaders(adminToken),
      multipart: {
        atendenteData: JSON.stringify(payload),
        estadual: {
          name: "certidao_estadual.pdf",
          mimeType: "application/pdf",
          buffer: dummyPdfBuffer,
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = (await response.json()) as AtendenteResponse;
    expect(body.id).toBeTruthy();
    expect(body.name).toBe(testName);
    expect(body.pdfEstadual?.url).toBeTruthy();

    createdId = body.id;
  });

  test("lista antecedentes criminais com paginação e filtro de busca", async ({ request }) => {
    const response = await request.get(
      `${API_URL}/antecedentes-criminais?search=${encodeURIComponent(testName)}`,
      {
        headers: authHeaders(adminToken),
      }
    );

    expect(response.status()).toBe(200);
    const body = (await response.json()) as PaginatedAtendentes;
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((item) => item.id === createdId)).toBe(true);
  });

  test("busca um antecedente criminal por id", async ({ request }) => {
    expect(createdId).toBeTruthy();

    const response = await request.get(`${API_URL}/antecedentes-criminais/${createdId}`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as AtendenteResponse;
    expect(body.id).toBe(createdId);
    expect(body.name).toBe(testName);
  });

  test("atualiza o nome do antecedente criminal", async ({ request }) => {
    expect(createdId).toBeTruthy();

    const updatedName = `${testName} Editado`;
    const payload = {
      name: updatedName,
    };

    const response = await request.put(`${API_URL}/antecedentes-criminais/${createdId}`, {
      headers: authHeaders(adminToken),
      multipart: {
        atendenteData: JSON.stringify(payload),
      },
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as AtendenteResponse;
    expect(body.id).toBe(createdId);
    expect(body.name).toBe(updatedName);
  });

  test("remove o antecedente criminal criado", async ({ request }) => {
    expect(createdId).toBeTruthy();

    const response = await request.delete(`${API_URL}/antecedentes-criminais/${createdId}`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);

    const getResponse = await request.get(`${API_URL}/antecedentes-criminais/${createdId}`, {
      headers: authHeaders(adminToken),
    });
    expect(getResponse.status()).toBe(404);
  });
});
