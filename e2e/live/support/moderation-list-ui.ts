import type { Page } from "@playwright/test";

import {
  PAGE_SIZE,
  expectCards,
  openAs,
  searchFor,
  summaryText,
  type ListReply,
  type ListScreen,
} from "./admin-list-ui";
import { expect, test } from "./live";

/**
 * Cenários de filtro/ordenação das telas de fila (fotos, ideias, depoimentos, comentários do feed): cada caso aplica
 * UM ou MAIS controles da toolbar pela tela real e prova que a requisição saiu com os parâmetros certos, que o total
 * bate com o banco e que os cartões são exatamente os do SELECT (na ordem).
 */
export interface UiFilterCase {
  name: string;
  /** Aplica os controles (select/data/ordenação) e devolve a última resposta da lista. */
  apply: (page: Page, screen: ListScreen) => Promise<ListReply>;
  /** Parâmetros que precisam estar na última requisição. */
  params: Record<string, string>;
  /** Ids esperados (todos, na ordem), vindos do banco. */
  expectedIds: () => Promise<string[]>;
}

export function registerUiFilterCases(screen: ListScreen, tag: () => string, cases: UiFilterCase[]): void {
  const { p } = screen;
  for (const filterCase of cases) {
    test(`${p}: filtro/ordenação — ${filterCase.name}`, async ({ page, request }) => {
      await openAs(page, request, screen);
      await searchFor(page, screen, tag());
      const reply = await filterCase.apply(page, screen);
      for (const [key, value] of Object.entries(filterCase.params)) {
        expect(reply.params.get(key), `${filterCase.name}: parâmetro ${key}`).toBe(value);
      }
      expect(reply.params.get("search")).toBe(tag());
      const expected = await filterCase.expectedIds();
      expect(reply.body.meta?.totalItems, `${filterCase.name}: total no servidor`).toBe(expected.length);
      if (expected.length === 0) {
        await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
        await expect(summaryText(page, p)).toHaveText("0 itens");
      } else {
        await expectCards(page, p, expected.slice(0, PAGE_SIZE));
        const shown = Math.min(PAGE_SIZE, expected.length);
        await expect(summaryText(page, p)).toHaveText(`1–${shown} de ${expected.length}`);
      }
    });
  }
}
