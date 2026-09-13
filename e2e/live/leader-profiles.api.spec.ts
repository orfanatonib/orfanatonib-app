import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Testes E2E ao vivo do contrato da API `/leader-profiles`.
 * Testa permissões por papel, listagem paginada, busca por ID e abrigos do líder.
 */
type LeaderResponse = {
  id: string;
  user: { id: string; name: string; email: string };
  teams?: Array<{ id: string; numberTeam: number }>;
};

type PaginatedLeaders = {
  items: LeaderResponse[];
  total: number;
  page: number;
  limit: number;
};

test.describe.serial("Perfis de Líderes — API ao vivo", () => {
  let adminToken: string;
  let leaderToken: string;
  let memberToken: string;
  let firstLeaderId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
    leaderToken = (await loginAs(request, "leader")).accessToken;
    memberToken = (await loginAs(request, "member")).accessToken;
  });

  test("todas as rotas exigem autenticação", async ({ request }) => {
    const response = await request.get(`${API_URL}/leader-profiles`);
    expect(response.status()).toBe(401);
  });

  test("membros comuns não têm acesso à lista de líderes", async ({ request }) => {
    const response = await request.get(`${API_URL}/leader-profiles`, {
      headers: authHeaders(memberToken),
    });
    expect(response.status()).toBe(403);
  });

  test("administrador consegue listar líderes com paginação", async ({ request }) => {
    const response = await request.get(`${API_URL}/leader-profiles?page=1&limit=10`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as PaginatedLeaders;
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);

    if (body.items.length > 0) {
      firstLeaderId = body.items[0].id;
    }
  });

  test("administrador consegue consultar o detalhe de um perfil de líder", async ({ request }) => {
    if (!firstLeaderId) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_URL}/leader-profiles/${firstLeaderId}`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as LeaderResponse;
    expect(body.id).toBe(firstLeaderId);
    expect(body.user?.id).toBeTruthy();
  });

  test("líder consegue consultar seus próprios abrigos vinculados", async ({ request }) => {
    const response = await request.get(`${API_URL}/leader-profiles/my-shelters`, {
      headers: authHeaders(leaderToken),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
