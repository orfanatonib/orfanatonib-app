import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";

export const PROFILE_PASSWORD = "Aa1!senhaforte";

export interface ProfileSeed {
  name: string;
  email: string;
  role: "member" | "leader";
  gender: "Masculino" | "Feminino";
  /** `AAAA-MM-DD`. */
  birthDate: string;
  temperaments: string;
  loveLanguages: string;
  favoriteColor: string;
}

export interface SeededProfile extends ProfileSeed {
  id: string;
}

/** Cria a conta pela API e grava dados pessoais e preferências no perfil completo (PUT /profiles/:id, admin). */
export async function seedProfile(request: APIRequestContext, adminToken: string, seed: ProfileSeed): Promise<SeededProfile> {
  const created = await request.post(`${API_URL}/users`, {
    headers: authHeaders(adminToken),
    data: {
      name: seed.name,
      email: seed.email,
      phone: "11999990000",
      password: PROFILE_PASSWORD,
      role: seed.role,
      active: true,
      completed: true,
      commonUser: false,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const filled = await request.put(`${API_URL}/profiles/${id}`, {
    headers: authHeaders(adminToken),
    data: {
      personalData: { birthDate: seed.birthDate, gender: seed.gender },
      preferences: { temperaments: seed.temperaments, loveLanguages: seed.loveLanguages, favoriteColor: seed.favoriteColor },
    },
  });
  expect(filled.status(), await filled.text()).toBeLessThan(300);
  return { ...seed, id };
}

export async function removeProfiles(request: APIRequestContext, adminToken: string, ids: readonly string[]): Promise<void> {
  for (const id of ids) await request.delete(`${API_URL}/users/${id}`, { headers: authHeaders(adminToken) });
}

export const usersWithTag = async (tag: string): Promise<number> =>
  Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE email LIKE ?", [`%${tag}%`]))?.n ?? 0);

/** Pessoas de teste: 14 contas A–N (as duas primeiras são líderes) com dados pessoais e preferências distintos. */
export function profileSeeds(tag: string): ProfileSeed[] {
  const temperaments = ["Sanguíneo", "Colérico", "Melancólico"];
  const languages = ["Palavras de afirmação", "Toque físico"];
  const colors = ["Azul", "Verde", "Vermelho", "Amarelo"];
  return "ABCDEFGHIJKLMN".split("").map((letter, index) => ({
    name: `${tag} ${letter}`,
    email: `${letter.toLowerCase()}.${tag}@orfanatonib.test`,
    role: index < 2 ? "leader" : "member",
    gender: index % 2 === 0 ? "Feminino" : "Masculino",
    birthDate: `${1990 + index}-${String((index % 12) + 1).padStart(2, "0")}-15`,
    temperaments: temperaments[index % temperaments.length],
    loveLanguages: languages[index % languages.length],
    favoriteColor: colors[index % colors.length],
  }));
}
