import type { Page } from "@playwright/test";

import { loginAs, seedBrowserSession, test } from "../support/live";

/**
 * AUDITORIA TEMPORÁRIA (não faz parte da suíte): percorre as telas do Estúdio em 375×812, tira capturas de página
 * inteira e mede rolagem lateral, alvos de toque e textos de "voltar" repetidos. Somente leitura.
 */
const PKG = "aae2e371-e0d2-4283-b318-bb183399456e";
const OUT = "/tmp/claude-1000/-home-diego-seven-Documents-repositories-orfanato-nib/1d1d04cd-65b0-4878-acee-98e96818e933/scratchpad/audit";

async function inspect(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const small: string[] = [];
    document.querySelectorAll("button, a[href], [role=tab], [role=button], input[type=checkbox], input[type=radio]").forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const style = getComputedStyle(el as HTMLElement);
      if (rect.width === 0 || rect.height === 0 || style.visibility === "hidden" || style.display === "none") return;
      if (rect.height < 40 || rect.width < 40) small.push(`${(el.textContent ?? "").trim().slice(0, 28) || (el as HTMLElement).getAttribute("aria-label") || el.tagName} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    });
    const backs = Array.from(document.querySelectorAll("a, button"))
      .map((el) => (el.textContent ?? "").trim())
      .filter((text) => /^voltar|voltar$|voltar /i.test(text));
    const wide: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.right > window.innerWidth + 1 && rect.width > 0) wide.push(`${el.tagName}.${String((el as HTMLElement).className).slice(0, 40)} right=${Math.round(rect.right)}`);
    });
    return { overflow, small: small.slice(0, 14), backs, wide: wide.slice(0, 6), height: document.documentElement.scrollHeight };
  });
  console.log(`AUDIT ${name} :: ${JSON.stringify(info)}`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

test("auditoria mobile do Estúdio", async ({ page, request }) => {
  test.setTimeout(240_000);
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.setViewportSize({ width: 375, height: 812 });

  const shots: Array<[string, string]> = [
    ["01-home", "/adm/estudio"],
    ["02-producao-lista", "/adm/estudio/producao"],
    ["03-producao-crianca-item", `/adm/estudio/pacotes/${PKG}?audience=CHILD&stage=LESSON`],
    ["04-producao-baby-item", `/adm/estudio/pacotes/${PKG}?audience=BABY&stage=LESSON`],
    ["05-revisao-lista", "/adm/estudio/revisao"],
    ["06-revisao-baby-licao", `/adm/estudio/revisao/${PKG}?audience=BABY&stage=LESSON`],
    ["07-revisao-baby-brincadeira", `/adm/estudio/revisao/${PKG}?audience=BABY&stage=STANDARD_GAME`],
    ["08-orientacoes", "/adm/estudio/orientacoes"],
  ];
  for (const [name, url] of shots) {
    await page.goto(url);
    await inspect(page, name);
  }

  // Diálogos (só abrem; nada é confirmado)
  await page.goto(`/adm/estudio/pacotes/${PKG}?audience=CHILD&stage=LESSON`);
  await page.waitForTimeout(2500);
  const send = page.getByTestId("content-studio-track-send-review");
  if (await send.count()) {
    await send.click();
    await page.waitForTimeout(800);
    await inspect(page, "09-dialogo-enviar-categoria");
    await page.getByTestId("content-studio-send-review-cancel").click();
  }
  await page.goto(`/adm/estudio/revisao/${PKG}?audience=BABY&stage=LESSON`);
  await page.waitForTimeout(2500);
  const approveCategory = page.getByTestId("content-studio-review-approve-category");
  if (await approveCategory.count()) {
    await approveCategory.click();
    await page.waitForTimeout(800);
    await inspect(page, "10-dialogo-aprovar-categoria");
    await page.getByTestId("content-studio-review-approve-category-cancel").click();
  }
  const approveAll = page.getByTestId("content-studio-review-approve-all");
  if (await approveAll.count()) {
    await approveAll.click();
    await page.waitForTimeout(800);
    await inspect(page, "11-dialogo-aprovar-tudo");
    await page.getByTestId("content-studio-review-approve-all-cancel").click();
  }
});
