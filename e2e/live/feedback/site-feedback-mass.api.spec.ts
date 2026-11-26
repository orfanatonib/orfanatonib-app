import { queryAll } from "../support/db";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { API_URL } from "../../../playwright.live.config";
import { create, readRaw } from "./support";

/** Identificador próprio da massa: não contém o RUN_TAG da execução, então não entra nas contagens dos specs de filtro. */
const MASS_TAG = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * MASSA (regra do E2E): toda execução deixa de 5 a 10 feedbacks NOVOS na caixa do admin, com tipos e notas variados,
 * uns lidos e outros não. Ficam e acumulam; nada é apagado por padrão.
 */
const CATEGORIES = ["suggestion", "complaint", "content", "usability", "appearance", "performance"] as const;

test.describe.serial("Massa de feedbacks: 5 a 10 novos por execução", () => {
  test("cria a massa (feedbacks e confere a caixa do admin)", async ({ request }) => {
    const COUNT = massCount();
    const admin = (await loginAs(request, "admin")).accessToken;
    const ids: string[] = [];
    for (let index = 1; index <= COUNT; index += 1) {
      const n = String(index).padStart(2, "0");
      const feedback = await create(request, admin, {
        name: `MASSA E2E Feedback ${MASS_TAG} ${n}`,
        email: index % 2 === 0 ? `massa.feedback.${MASS_TAG}.${n}@orfanatonib.test` : undefined,
        rating: (index % 5) + 1,
        category: CATEGORIES[index % CATEGORIES.length],
        comment: `Comentário de massa ${index} da execução ${MASS_TAG}.`,
      });
      ids.push(feedback.id);
      if (index % 3 === 0) expect((await readRaw(request, admin, feedback.id)).status()).toBe(200);
    }

    const rows = await queryAll<{ id: string; read: number; rating: number }>("SELECT id, `read`, rating FROM site_feedbacks WHERE name LIKE ?", [`MASSA E2E Feedback ${MASS_TAG} %`]);
    expect(rows).toHaveLength(COUNT);
    expect(rows.filter((row) => row.read === 1)).toHaveLength(Math.floor(COUNT / 3));

    const res = await request.get(`${API_URL}/site-feedbacks?search=${encodeURIComponent(`MASSA E2E Feedback ${MASS_TAG}`)}&page=1&limit=100`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string }>; meta: { totalItems: number } };
    expect(body.meta.totalItems).toBe(COUNT);
    expect(body.data.map((row) => row.id).sort()).toEqual([...ids].sort());
  });
});
