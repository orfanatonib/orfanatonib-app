import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * MASSA (regra do usuário): toda execução deixa de 5 a 10 depoimentos enviados por um membro PELA TELA
 * (`/area-do-membro`, seção de comentários). Entram como "Não publicado" na fila de `/adm/comentarios` e
 * acumulam a cada rodada (sem limpeza por padrão).
 */
const FLAGS = ["comment_submission", "comment_moderation"] as const;
const SHELTERS = ["Clubinho Sol", "Clubinho Lua", "Clubinho Estrela"] as const;

test.describe.serial("Comentários — massa da execução (UI real)", () => {
  test("o membro envia de 5 a 10 depoimentos pela tela e a fila do admin os mostra como não publicados", async ({ page, request }) => {
    test.setTimeout(600_000);
    const admin = await loginAs(request, "admin");
    const member = await loginAs(request, "member");
    const before: Record<string, boolean> = {};
    for (const key of FLAGS) {
      before[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: true } });
    }
    const total = massCount();
    const prefix = `MASSA E2E Depoimento ${RUN_TAG}`;
    try {
      await seedBrowserSession(page, member);
      for (let index = 1; index <= total; index += 1) {
        const name = `${prefix} ${String(index).padStart(2, "0")}`;
        await page.goto("/area-do-membro");
        await expect(page.getByTestId("member-comments-section")).toBeVisible({ timeout: 20_000 });
        await page.getByTestId("member-comments-toggle-form").click();
        await page.getByTestId("member-comments-field-name").locator("input").fill(name);
        await page.getByTestId("member-comments-field-comment").locator("textarea").first().fill(`Depoimento de massa ${index}: as crianças amaram.`);
        await page.getByTestId("member-comments-field-shelter").locator("input").fill(SHELTERS[index % SHELTERS.length]);
        await page.getByTestId("member-comments-field-neighborhood").locator("input").fill(`Bairro ${index}`);
        await page.getByTestId("member-comments-submit").click();
        await expect(page.getByTestId("member-comments-success")).toBeVisible({ timeout: 20_000 });
      }
      const rows = await queryAll<{ published: number }>("SELECT published FROM comments WHERE name LIKE ?", [`${prefix}%`]);
      expect(rows).toHaveLength(total);
      for (const row of rows) expect(row.published).toBe(0);

      await seedBrowserSession(page, admin);
      await page.goto("/adm/comentarios");
      await page.getByTestId("comments-toolbar-search").fill(prefix);
      await expect(page.getByTestId("comments-pagination-summary")).toHaveText(new RegExp(`de ${total}$`), { timeout: 20_000 });
    } finally {
      for (const key of FLAGS) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: before[key] } });
      }
      await closeDb();
    }
  });
});
