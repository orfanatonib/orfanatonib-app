import { describe, expect, it } from "vitest";

import {
  GENDER_LABELS,
  SHELTERED_ENDPOINT,
  SHELTERED_PAGE_SIZE_DEFAULT,
  SHELTERED_SORT_DEFAULT,
  SHELTERED_SORT_DEFAULT_VALUE,
  SHELTERED_SORT_FIELD_OPTIONS,
  SHELTERED_SORT_OPTIONS,
} from "./constants";
import { ShelteredGender, ShelteredOrderBy, SortOrder } from "./enums";

describe("constantes de acolhidos", () => {
  it("endpoint e tamanho de página padrão", () => {
    expect(SHELTERED_ENDPOINT).toBe("/sheltered");
    expect(SHELTERED_PAGE_SIZE_DEFAULT).toBe(12);
  });

  it("ordenação padrão é a mais recente e existe nas opções do menu", () => {
    expect(SHELTERED_SORT_DEFAULT).toEqual({ id: ShelteredOrderBy.UPDATED_AT, desc: true });
    expect(SHELTERED_SORT_OPTIONS.map((o) => o.id)).toContain(SHELTERED_SORT_DEFAULT.id);
    expect(new Set(SHELTERED_SORT_OPTIONS.map((o) => o.id)).size).toBe(SHELTERED_SORT_OPTIONS.length);
  });

  it("todo gênero tem rótulo", () => {
    for (const g of Object.values(ShelteredGender)) expect(GENDER_LABELS[g]).toBeTruthy();
  });

  it("o select de ordenação cobre cada campo nas duas direções e contém o padrão", () => {
    expect(SHELTERED_SORT_FIELD_OPTIONS).toHaveLength(SHELTERED_SORT_OPTIONS.length * 2);
    expect(SHELTERED_SORT_FIELD_OPTIONS.map((o) => o.value)).toContain(SHELTERED_SORT_DEFAULT_VALUE);
    expect(SHELTERED_SORT_DEFAULT_VALUE).toBe(`updatedAt:${SortOrder.DESC}`);
  });
});
