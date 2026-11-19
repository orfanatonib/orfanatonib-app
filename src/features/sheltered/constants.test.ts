import { describe, expect, it } from "vitest";

import {
  GENDER_LABELS,
  SHELTERED_CARD_PAGE_SIZE_OPTIONS,
  SHELTERED_ENDPOINT,
  SHELTERED_FILTERS_EMPTY,
  SHELTERED_PAGE_SIZE_DEFAULT,
  SHELTERED_PAGE_SIZE_OPTIONS,
  SHELTERED_SORT_DEFAULT,
  SHELTERED_SORT_OPTIONS,
  SORT_ORDER_BY_DESC,
} from "./constants";
import { ShelteredGender, ShelteredOrderBy, SortOrder } from "./enums";

describe("constantes de acolhidos", () => {
  it("endpoint e página padrão fazem parte das opções", () => {
    expect(SHELTERED_ENDPOINT).toBe("/sheltered");
    expect(SHELTERED_PAGE_SIZE_OPTIONS).toContain(SHELTERED_PAGE_SIZE_DEFAULT);
    expect(SHELTERED_CARD_PAGE_SIZE_OPTIONS.length).toBeGreaterThan(0);
  });

  it("ordenação padrão é a mais recente e existe nas opções do menu", () => {
    expect(SHELTERED_SORT_DEFAULT).toEqual({ id: ShelteredOrderBy.UPDATED_AT, desc: true });
    expect(SHELTERED_SORT_OPTIONS.map((o) => o.id)).toContain(SHELTERED_SORT_DEFAULT.id);
    expect(new Set(SHELTERED_SORT_OPTIONS.map((o) => o.id)).size).toBe(SHELTERED_SORT_OPTIONS.length);
  });

  it("todo gênero tem rótulo e os filtros vazios não filtram nada", () => {
    for (const g of Object.values(ShelteredGender)) expect(GENDER_LABELS[g]).toBeTruthy();
    expect(Object.values(SHELTERED_FILTERS_EMPTY).every((v) => v === "" || v === undefined)).toBe(true);
  });

  it("desc/asc mapeiam para a ordem da API", () => {
    expect(SORT_ORDER_BY_DESC.true).toBe(SortOrder.DESC);
    expect(SORT_ORDER_BY_DESC.false).toBe(SortOrder.ASC);
  });
});
