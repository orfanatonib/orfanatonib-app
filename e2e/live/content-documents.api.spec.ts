import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Contratos de `/documents` contra a API ao vivo.
 * Garante criação de massa de dados permanente e valida a busca por filtro no backend.
 */
const RUN_TAG = `doc-${Date.now()}`;

test.describe.serial("Documentos — API ao vivo com massa de dados", () => {
  let adminToken: string;
  let documentId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;

    // Garante que exista ao menos 1 item base (massa de dados permanente)
    const listRes = await request.get(`${API_URL}/documents`);
    const existing = (await listRes.json()) || [];
    if (!Array.isArray(existing) || existing.length === 0) {
      const createRes = await request.post(`${API_URL}/documents`, {
        headers: authHeaders(adminToken),
        multipart: {
          documentData: JSON.stringify({
            name: "Regulamento Interno do Abrigo",
            description: "Documento oficial de diretrizes e normas do abrigo NIB.",
            media: {
              title: "Regulamento PDF",
              description: "Manual em PDF",
              mediaType: "document",
              uploadType: "link",
              url: "https://example.com/regulamento.pdf",
              isLocalFile: false,
            },
          }),
        },
      });
      expect(createRes.status()).toBe(201);
    }
  });

  test("a rota POST /documents exige autenticação de admin", async ({ request }) => {
    const response = await request.post(`${API_URL}/documents`, {
      multipart: {
        documentData: JSON.stringify({ name: `Documento ${RUN_TAG}` }),
      },
    });
    expect(response.status()).toBe(401);
  });

  test("cria e mantém novo documento na massa de dados", async ({ request }) => {
    const response = await request.post(`${API_URL}/documents`, {
      headers: authHeaders(adminToken),
      multipart: {
        documentData: JSON.stringify({
          name: `Guia de Boas Vindas ${RUN_TAG}`,
          description: "Documento com orientação para novos voluntários",
          media: {
            title: "Guia Voluntário",
            description: "Instruções",
            mediaType: "document",
            uploadType: "link",
            url: "https://example.com/guia.pdf",
            isLocalFile: false,
          },
        }),
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    documentId = body.id;
  });

  test("filtra os documentos pelo parâmetro search no backend", async ({ request }) => {
    const searchResponse = await request.get(`${API_URL}/documents`, {
      params: { search: RUN_TAG },
    });
    expect(searchResponse.status()).toBe(200);
    const results = await searchResponse.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.some((doc: any) => doc.id === documentId)).toBe(true);

    const emptyResponse = await request.get(`${API_URL}/documents`, {
      params: { search: `inexistente-${RUN_TAG}` },
    });
    expect(emptyResponse.status()).toBe(200);
    const emptyResults = await emptyResponse.json();
    expect(emptyResults.some((doc: any) => doc.id === documentId)).toBe(false);
  });
});
