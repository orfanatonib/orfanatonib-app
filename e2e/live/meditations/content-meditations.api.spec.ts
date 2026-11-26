import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Contratos de `/meditations` contra a API ao vivo.
 * Garante criação de massa de dados permanente e valida a busca por filtro no backend.
 */
const WEEK = (() => {
  const monday = new Date(Date.UTC(2050, 0, 3) + Math.floor(Math.random() * 4000) * 7 * 86_400_000);
  const iso = (offset: number) => new Date(monday.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
  return { start: iso(0), end: iso(4) };
})();
const RUN_TAG = `med-${Date.now()}`;

test.describe.serial("Meditações — API ao vivo com massa de dados", () => {
  let adminToken: string;
  let meditationId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;

    // Garante que exista ao menos 1 item base (massa de dados permanente)
    const listRes = await request.get(`${API_URL}/meditations`, {
      headers: authHeaders(adminToken),
    });
    const existing = (await listRes.json()) || [];
    if (!Array.isArray(existing) || existing.length === 0) {
      const createRes = await request.post(`${API_URL}/meditations`, {
        headers: authHeaders(adminToken),
        multipart: {
          meditationData: JSON.stringify({
            topic: "O Amor de Deus e a Esperança",
            startDate: "2030-01-07",
            endDate: "2030-01-11",
            days: [
              { day: "Monday", verse: "João 3:16", topic: "Deus amou o mundo" },
              { day: "Tuesday", verse: "Romanos 8:28", topic: "Todas as coisas cooperam" },
              { day: "Wednesday", verse: "Salmos 27:1", topic: "O Senhor é luz" },
              { day: "Thursday", verse: "Filipenses 4:13", topic: "Tudo posso" },
              { day: "Friday", verse: "Isaías 41:10", topic: "Não temas" },
            ],
            media: {
              title: "Estudo Devocional PDF",
              description: "Devocional semanal",
              mediaType: "document",
              uploadType: "link",
              url: "https://example.com/devocional.pdf",
              isLocalFile: false,
            },
          }),
        },
      });
      expect(createRes.status()).toBe(201);
    }
  });

  test("a rota POST /meditations exige autenticação de admin", async ({ request }) => {
    const response = await request.post(`${API_URL}/meditations`, {
      multipart: {
        meditationData: JSON.stringify({
          topic: `Tópico ${RUN_TAG}`,
          startDate: "2030-01-07",
          endDate: "2030-01-11",
          days: [],
        }),
      },
    });
    expect(response.status()).toBe(401);
  });

  test("cria e mantém nova meditação semanal na massa de dados", async ({ request }) => {
    const response = await request.post(`${API_URL}/meditations`, {
      headers: authHeaders(adminToken),
      multipart: {
        meditationData: JSON.stringify({
          topic: `Jornada no Salmo 23 ${RUN_TAG}`,
          // Semana futura aleatória: a API recusa duas meditações na mesma semana (re-execução não pode dar 409).
          startDate: WEEK.start,
          endDate: WEEK.end,
          days: [
            { day: "Monday", verse: "Salmos 23:1", topic: "O Senhor é o meu pastor" },
            { day: "Tuesday", verse: "Salmos 23:2", topic: "Deitar-me faz em verdes pastos" },
            { day: "Wednesday", verse: "Salmos 23:3", topic: "Refrigera a minha alma" },
            { day: "Thursday", verse: "Salmos 23:4", topic: "Tu estás comigo" },
            { day: "Friday", verse: "Salmos 23:5", topic: "Preparas uma mesa" },
          ],
          media: {
            title: "Guia da Meditação",
            description: "Conteúdo em PDF",
            mediaType: "document",
            uploadType: "link",
            url: "https://example.com/salmo23.pdf",
            isLocalFile: false,
          },
        }),
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    meditationId = body.id;
  });

  test("filtra as meditações pelo parâmetro search no backend", async ({ request }) => {
    const searchResponse = await request.get(`${API_URL}/meditations`, {
      headers: authHeaders(adminToken),
      params: { search: RUN_TAG },
    });
    expect(searchResponse.status()).toBe(200);
    const results = await searchResponse.json();
    expect(Array.isArray(results)).toBe(true);
    expect(
      results.some(
        (res: any) =>
          res.meditation?.id === meditationId || res.id === meditationId,
      ),
    ).toBe(true);

    const emptyResponse = await request.get(`${API_URL}/meditations`, {
      headers: authHeaders(adminToken),
      params: { search: `inexistente-${RUN_TAG}` },
    });
    expect(emptyResponse.status()).toBe(200);
    const emptyResults = await emptyResponse.json();
    expect(
      emptyResults.some(
        (res: any) =>
          res.meditation?.id === meditationId || res.id === meditationId,
      ),
    ).toBe(false);
  });
});
