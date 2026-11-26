import { queryAll } from "../support/db";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { API_URL } from "../../../playwright.live.config";
import { seedProfile } from "./support";

/** Identificador próprio da massa: não contém o RUN_TAG da execução, então não entra nas contagens dos specs de filtro. */
const MASS_TAG = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * MASSA (regra do E2E): toda execução deixa de 5 a 10 perfis NOVOS (contas com dados pessoais e preferências), uns
 * líderes e a maioria membros, com gêneros, aniversários e preferências variados. Ficam e acumulam.
 */
const TEMPERAMENTS = ["Sanguíneo", "Colérico", "Melancólico", "Fleumático"];
const LANGUAGES = ["Palavras de afirmação", "Toque físico", "Tempo de qualidade", "Atos de serviço", "Presentes"];
const COLORS = ["Azul", "Verde", "Vermelho", "Amarelo", "Roxo"];

test.describe.serial("Massa de perfis: 5 a 10 novos por execução", () => {
  test("cria a massa (perfis completos e confere a lista do admin)", async ({ request }) => {
    const COUNT = massCount();
    const admin = (await loginAs(request, "admin")).accessToken;
    const ids: string[] = [];
    for (let index = 1; index <= COUNT; index += 1) {
      const n = String(index).padStart(2, "0");
      const person = await seedProfile(request, admin, {
        name: `MASSA E2E Perfil ${MASS_TAG} ${n}`,
        email: `massa.perfil.${MASS_TAG}.${n}@orfanatonib.test`,
        role: index % 4 === 0 ? "leader" : "member",
        gender: index % 2 === 0 ? "Feminino" : "Masculino",
        birthDate: `${1985 + index}-${String(((index * 5) % 12) + 1).padStart(2, "0")}-${String(((index * 7) % 27) + 1).padStart(2, "0")}`,
        temperaments: TEMPERAMENTS[index % TEMPERAMENTS.length],
        loveLanguages: LANGUAGES[index % LANGUAGES.length],
        favoriteColor: COLORS[index % COLORS.length],
      });
      ids.push(person.id);
    }

    const rows = await queryAll<{ id: string }>("SELECT id FROM users WHERE name LIKE ?", [`MASSA E2E Perfil ${MASS_TAG} %`]);
    expect(rows).toHaveLength(COUNT);
    const personal = await queryAll<{ userId: string }>(`SELECT userId FROM personal_data WHERE userId IN (${ids.map(() => "?").join(",")})`, ids);
    expect(personal).toHaveLength(COUNT);

    const res = await request.get(`${API_URL}/profiles?search=${encodeURIComponent(`MASSA E2E Perfil ${MASS_TAG}`)}&page=1&limit=100`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string }>; meta: { totalItems: number } };
    expect(body.meta.totalItems).toBe(COUNT);
    expect(body.items.map((row) => row.id).sort()).toEqual([...ids].sort());
  });
});
