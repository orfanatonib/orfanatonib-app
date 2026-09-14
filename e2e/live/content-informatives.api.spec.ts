import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Contratos de `/informatives` contra a API ao vivo.
 * Garante criação de massa de dados permanente e valida a busca por filtro no backend.
 */
const RUN_TAG = `info-${Date.now()}`;

test.describe.serial("Banners Informativos — API ao vivo com massa de dados", () => {
  let adminToken: string;
  let informativeId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;

    // Garante que exista ao menos 1 item base (massa de dados permanente)
    const listRes = await request.get(`${API_URL}/informatives`, {
      headers: authHeaders(adminToken),
    });
    const existing = (await listRes.json()) || [];
    if (!Array.isArray(existing) || existing.length === 0) {
      const createRes = await request.post(`${API_URL}/informatives`, {
        headers: authHeaders(adminToken),
        data: {
          title: "Aviso de Funcionamento no Feriado",
          description: "Horário de atendimento especial para visitação aos finais de semana.",
          public: true,
        },
      });
      expect(createRes.status()).toBe(201);
    }
  });

  test("a rota POST /informatives exige autenticação de admin", async ({ request }) => {
    const response = await request.post(`${API_URL}/informatives`, {
      data: {
        title: `Aviso ${RUN_TAG}`,
        description: "Descrição",
        public: true,
      },
    });
    expect(response.status()).toBe(401);
  });

  test("cria e mantém novo banner informativo na massa de dados", async ({ request }) => {
    const response = await request.post(`${API_URL}/informatives`, {
      headers: authHeaders(adminToken),
      data: {
        title: `Campanha do Agasalho ${RUN_TAG}`,
        description: "Doação de roupas e mantimentos para as crianças do abrigo",
        public: true,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    informativeId = body.id;
  });

  test("filtra os informativos pelo parâmetro search no backend", async ({ request }) => {
    const searchResponse = await request.get(`${API_URL}/informatives`, {
      headers: authHeaders(adminToken),
      params: { search: RUN_TAG },
    });
    expect(searchResponse.status()).toBe(200);
    const results = await searchResponse.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.some((info: any) => info.id === informativeId)).toBe(true);

    const emptyResponse = await request.get(`${API_URL}/informatives`, {
      headers: authHeaders(adminToken),
      params: { search: `inexistente-${RUN_TAG}` },
    });
    expect(emptyResponse.status()).toBe(200);
    const emptyResults = await emptyResponse.json();
    expect(emptyResults.some((info: any) => info.id === informativeId)).toBe(false);
  });
});
