import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Contratos de `/events` contra a API ao vivo.
 * Garante criação de massa de dados permanente e valida a busca por filtro no backend.
 */
const RUN_TAG = `event-${Date.now()}`;

test.describe.serial("Eventos — API ao vivo com massa de dados", () => {
  let adminToken: string;
  let eventId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;

    // Garante que exista ao menos 1 item base (massa de dados permanente)
    const listRes = await request.get(`${API_URL}/events`);
    const existing = (await listRes.json()) || [];
    if (!Array.isArray(existing) || existing.length === 0) {
      const createRes = await request.post(`${API_URL}/events`, {
        headers: authHeaders(adminToken),
        multipart: {
          eventData: JSON.stringify({
            title: "Culto Especial de Ações de Graças",
            description: "Encontro festivo do abrigo NIB com toda a comunidade.",
            location: "Templo Central NIB",
            date: "2026-12-25",
            audience: "all",
            media: {
              title: "Banner do Evento",
              url: "https://example.com/culto.jpg",
              isLocalFile: false,
            },
          }),
        },
      });
      expect(createRes.status()).toBe(201);
    }
  });

  test("a rota POST /events exige autenticação de admin", async ({ request }) => {
    const response = await request.post(`${API_URL}/events`, {
      multipart: {
        eventData: JSON.stringify({
          title: `Evento ${RUN_TAG}`,
          date: "2026-10-15",
          audience: "all",
        }),
      },
    });
    expect(response.status()).toBe(401);
  });

  test("cria e mantém novo evento na massa de dados", async ({ request }) => {
    const response = await request.post(`${API_URL}/events`, {
      headers: authHeaders(adminToken),
      multipart: {
        eventData: JSON.stringify({
          title: `Oficina de Arte e Cultura ${RUN_TAG}`,
          description: "Atividade recreativa e educativa para os acolhidos",
          location: "Sala de Treinamento NIB",
          date: "2026-11-10",
          audience: "all",
          media: {
            title: "Capa da Oficina",
            url: "https://example.com/oficina.jpg",
            isLocalFile: false,
          },
        }),
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    eventId = body.id;
  });

  test("filtra os eventos pelo parâmetro search no backend", async ({ request }) => {
    const searchResponse = await request.get(`${API_URL}/events`, {
      params: { search: RUN_TAG },
    });
    expect(searchResponse.status()).toBe(200);
    const results = await searchResponse.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.some((ev: any) => ev.id === eventId)).toBe(true);

    const emptyResponse = await request.get(`${API_URL}/events`, {
      params: { search: `inexistente-${RUN_TAG}` },
    });
    expect(emptyResponse.status()).toBe(200);
    const emptyResults = await emptyResponse.json();
    expect(emptyResults.some((ev: any) => ev.id === eventId)).toBe(false);
  });
});
