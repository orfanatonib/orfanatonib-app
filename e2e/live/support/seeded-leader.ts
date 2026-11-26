import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { createShelter, label } from "../shelters/support";
import { LIVE_ACCOUNTS } from "./credentials";
import { queryOne } from "./db";
import { authHeaders, expect } from "./live";

/**
 * Pré-condição de quem testa "o líder semeado": outras specs o desvinculam, e sem abrigo a API nega leituras
 * (`/member-profiles/simple` ⇒ 403). Só cria e vincula um abrigo quando ele não lidera nenhum.
 */
export async function ensureSeededLeaderLeadsShelter(request: APIRequestContext, adminToken: string): Promise<void> {
  const profile = await queryOne<{ id: string; teams: number }>(
    `SELECT lp.id AS id, (SELECT COUNT(*) FROM leader_teams lt WHERE lt.leader_id = lp.id) AS teams
       FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = ?`,
    [LIVE_ACCOUNTS.leader.email],
  );
  expect(profile, "o líder semeado tem perfil de líder").not.toBeNull();
  if (Number(profile!.teams) > 0) return;
  const shelter = await createShelter(request, adminToken, { name: label("lider-semeado"), teamsQuantity: 1 });
  const response = await request.put(`${API_URL}/leader-profiles/${profile!.id}`, {
    headers: authHeaders(adminToken),
    data: [{ shelterId: shelter.id, teams: [1] }],
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
}
