import { closeDb, queryAll } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { cardIds, openAs, searchFor, type ListScreen } from "../support/admin-list-ui";
import { expect, loginAs, test } from "../support/live";
import { createMaterial } from "./support";

const SCREEN: ListScreen = { p: "visit-materials", path: "/adm/paginas-materiais-visita", endpoint: "/visit-material-pages" };

/**
 * Massa acumulada: toda execução deixa de 5 a 10 materiais de visita no banco (`massCount()`), com testamento e faixas
 * variados. Não há botão de criar nesta tela (a página nasce no Estúdio/criador), então a massa entra pela API real;
 * o spec confere pela UI que ela aparece e que o banco bate. Nada é apagado (limpeza só com E2E_CLEANUP=1).
 */
test.describe.serial("Materiais de visita: massa acumulada", () => {
  const tag = `${RUN_TAG}-massa`;
  const created: string[] = [];

  test("cria 5 a 10 materiais novos e eles aparecem na tela, iguais ao banco", async ({ page, request }) => {
    const token = (await loginAs(request, "admin")).accessToken;
    const count = massCount();
    const categories = [undefined, ["BABY"], ["CHILD", "TEEN"], ["ADULT"], ["BABY", "ADULT"]] as const;
    for (let i = 0; i < count; i += 1) {
      const material = await createMaterial(request, token, {
        title: `MASSA E2E Material ${tag} ${String(i + 1).padStart(2, "0")}`,
        subtitle: `Subtítulo da massa ${i + 1}`,
        description: `Material de massa ${i + 1} criado pela execução ${RUN_TAG}`,
        testament: i % 2 === 0 ? "OLD_TESTAMENT" : "NEW_TESTAMENT",
        categories: categories[i % categories.length] ? [...categories[i % categories.length]!] : undefined,
      });
      created.push(material.id);
    }
    const db = await queryAll<{ id: string }>("SELECT id FROM visit_material_pages WHERE title LIKE ? ORDER BY createdAt DESC, id ASC", [`%${tag}%`]);
    expect(db).toHaveLength(count);

    await openAs(page, request, SCREEN);
    const reply = await searchFor(page, SCREEN, tag);
    expect(reply.body.meta?.totalItems).toBe(count);
    expect((await cardIds(page, SCREEN.p)).sort()).toEqual(created.sort());
    const orphanRoutes = await queryAll("SELECT p.id FROM visit_material_pages p LEFT JOIN routes r ON r.id = p.routeId WHERE p.title LIKE ? AND r.id IS NULL", [`%${tag}%`]);
    expect(orphanRoutes).toHaveLength(0);
    await closeDb();
  });
});
