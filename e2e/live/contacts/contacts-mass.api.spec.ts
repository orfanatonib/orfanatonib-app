import { queryAll } from "../support/db";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { API_URL } from "../../../playwright.live.config";
import { create, readRaw } from "./support";

/** Identificador próprio da massa: não contém o RUN_TAG da execução, então não entra nas contagens dos specs de filtro. */
const MASS_TAG = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * MASSA (regra do E2E): toda execução deixa de 5 a 10 contatos NOVOS na caixa do admin (formulário público, sem tela
 * de criação no painel), uns lidos e outros não. Ficam e acumulam; nada é apagado por padrão.
 */

test.describe.serial("Massa de contatos: 5 a 10 novos por execução", () => {
  test("cria a massa (contatos pelo formulário público e confere a caixa do admin)", async ({ request }) => {
    const COUNT = massCount();
    const admin = (await loginAs(request, "admin")).accessToken;
    const ids: string[] = [];
    for (let index = 1; index <= COUNT; index += 1) {
      const n = String(index).padStart(2, "0");
      const receipt = await create(request, {
        name: `MASSA E2E Contato ${MASS_TAG} ${n}`,
        email: `massa.contato.${MASS_TAG}.${n}@orfanatonib.test`,
        phone: `119${String(Date.now()).slice(-6)}${n}`.slice(0, 11),
        message: `Mensagem de massa ${index} da execução ${MASS_TAG}: gostaria de conhecer o trabalho.`,
      });
      ids.push(receipt.id);
      if (index % 3 === 0) expect((await readRaw(request, admin, receipt.id)).status()).toBe(200);
    }

    const rows = await queryAll<{ id: string; read: number }>("SELECT id, `read` FROM contacts WHERE name LIKE ?", [`MASSA E2E Contato ${MASS_TAG} %`]);
    expect(rows).toHaveLength(COUNT);
    expect(rows.filter((row) => row.read === 1)).toHaveLength(Math.floor(COUNT / 3));

    const res = await request.get(`${API_URL}/contact?search=${encodeURIComponent(`MASSA E2E Contato ${MASS_TAG}`)}&page=1&limit=100`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string }>; meta: { totalItems: number } };
    expect(body.meta.totalItems).toBe(COUNT);
    expect(body.data.map((row) => row.id).sort()).toEqual([...ids].sort());
  });
});
