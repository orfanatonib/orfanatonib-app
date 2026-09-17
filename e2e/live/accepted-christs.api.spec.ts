import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Testes E2E ao vivo do contrato da API `/accepted-christs`.
 * Testa a rota autenticada de criação de decisão/registro de Aceitou a Cristo.
 */
const RUN_TAG = `e2e-${Date.now()}`;

type ShelteredResponse = {
  id: string;
  fullName: string;
};

type AcceptedChristResponse = {
  id: string;
  decision: string | null;
  shelteredId: string;
  notes?: string | null;
  createdAt: string;
};

test.describe.serial("Aceitos a Cristo — API ao vivo", () => {
  let adminToken: string;
  let shelteredId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;

    // Busca um acolhido existente para vincular o registro
    const shelteredRes = await request.get(`${API_URL}/sheltered?limit=1`, {
      headers: authHeaders(adminToken),
    });

    if (shelteredRes.ok()) {
      const body = (await shelteredRes.json()) as { data?: ShelteredResponse[] };
      if (body.data && body.data.length > 0) {
        shelteredId = body.data[0].id;
      }
    }
  });

  test("a rota POST /accepted-christs valida o acolhido informado", async ({ request }) => {
    const response = await request.post(`${API_URL}/accepted-christs`, {
      data: {
        shelteredId: "00000000-0000-0000-0000-000000000000",
        decision: "ACCEPTED",
      },
    });
    expect(response.status()).toBe(404);
  });

  test("registra uma nova decisão de Aceitou a Cristo para um acolhido", async ({ request }) => {
    if (!shelteredId) {
      test.skip();
      return;
    }

    const payload = {
      shelteredId,
      decision: "ACCEPTED",
      notes: `Registro de teste E2E ${RUN_TAG}`,
    };

    const response = await request.post(`${API_URL}/accepted-christs`, {
      headers: authHeaders(adminToken),
      data: payload,
    });

    expect(response.status()).toBe(201);
    const body = (await response.json()) as AcceptedChristResponse;
    expect(body.id).toBeTruthy();
    expect(body.shelteredId).toBe(shelteredId);
    expect(body.decision).toBe("ACCEPTED");
    expect(body.notes).toBe(payload.notes);
  });
});
