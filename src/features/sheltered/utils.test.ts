import { describe, expect, it } from "vitest";
import { ShelteredGender, ShelteredOrderBy, SortOrder } from "./enums";
import {
  buildCreatePayload,
  buildMapsUrl,
  buildUpdatePayload,
  compactFilters,
  extractApiErrorMessage,
  isValidIsoDate,
  normalizeBackendMessage,
  normalizeIsoDateString,
  shortAddressLabel,
  sortToQuery,
  toTestIdSuffix,
  validateCreateDates,
  validateUpdateDates,
} from "./utils";
import type { CreateShelteredForm, ShelteredAddressResponseDto } from "./types";

const baseForm: CreateShelteredForm = {
  name: "Maria Silva",
  gender: ShelteredGender.FEMALE,
  birthDate: "02/04/2015",
};

const address: ShelteredAddressResponseDto = {
  id: "address-id",
  street: "Rua das Flores",
  number: "100",
  district: "Centro",
  city: "Manaus",
  state: "AM",
  postalCode: "69000000",
  complement: null,
};

describe("normalizeBackendMessage", () => {
  it("joins a list of validation messages", () => {
    expect(normalizeBackendMessage(["Campo A", "Campo B"])).toBe("Campo A\nCampo B");
  });

  it("returns a plain string untouched and an empty string for anything else", () => {
    expect(normalizeBackendMessage("Erro")).toBe("Erro");
    expect(normalizeBackendMessage({ code: 1 })).toBe("");
    expect(normalizeBackendMessage(undefined)).toBe("");
  });
});

describe("extractApiErrorMessage", () => {
  it("prefers the API error envelope", () => {
    const error = { response: { data: { message: "Acolhido não encontrado" } } };
    expect(extractApiErrorMessage(error, "fallback")).toBe("Acolhido não encontrado");
  });

  it("falls back to the network error message, then to the default", () => {
    expect(extractApiErrorMessage({ message: "Network Error" }, "fallback")).toBe(
      "Network Error",
    );
    expect(extractApiErrorMessage(null, "fallback")).toBe("fallback");
  });
});

describe("normalizeIsoDateString", () => {
  it("converts a Brazilian date into the ISO calendar date", () => {
    expect(normalizeIsoDateString("02/04/2015")).toBe("2015-04-02");
  });

  it("keeps an ISO date and trims an overlong year", () => {
    expect(normalizeIsoDateString("2015-04-02")).toBe("2015-04-02");
    expect(normalizeIsoDateString("002015-04-02")).toBe("2015-04-02");
  });

  it("preserves null and undefined so an untouched field stays untouched", () => {
    expect(normalizeIsoDateString(null)).toBeNull();
    expect(normalizeIsoDateString(undefined)).toBeUndefined();
    expect(normalizeIsoDateString("   ")).toBeNull();
  });
});

describe("isValidIsoDate", () => {
  it("accepts a real calendar date", () => {
    expect(isValidIsoDate("2015-04-02")).toBe(true);
  });

  it("rejects impossible and malformed dates", () => {
    expect(isValidIsoDate("2015-02-30")).toBe(false);
    expect(isValidIsoDate("2015-13-01")).toBe(false);
    expect(isValidIsoDate("02/04/2015")).toBe(false);
  });
});

describe("compactFilters", () => {
  it("drops blank values so the API never receives an empty filter", () => {
    expect(
      compactFilters({
        searchString: "  Maria ",
        shelterSearchingString: "   ",
        addressFilter: "",
        gender: undefined,
        birthDateFrom: "2010-01-01",
      }),
    ).toEqual({ searchString: "Maria", birthDateFrom: "2010-01-01" });
  });

  it("returns an empty object when there is nothing to filter", () => {
    expect(compactFilters(undefined)).toEqual({});
  });
});

describe("sortToQuery", () => {
  it("maps the table sort onto the API allowlist", () => {
    expect(sortToQuery({ id: ShelteredOrderBy.JOINED_AT, desc: true })).toEqual({
      orderBy: ShelteredOrderBy.JOINED_AT,
      order: SortOrder.DESC,
    });
  });

  it("defaults to name ascending", () => {
    expect(sortToQuery(null)).toEqual({
      orderBy: ShelteredOrderBy.NAME,
      order: SortOrder.ASC,
    });
  });
});

describe("buildCreatePayload", () => {
  it("normalizes dates, phone and postal code", () => {
    const payload = buildCreatePayload({
      ...baseForm,
      guardianPhone: "(92) 99999-0000",
      joinedAt: "01/08/2024",
      address: { city: "Manaus", state: "AM", postalCode: "69000-000" },
    });

    expect(payload.birthDate).toBe("2015-04-02");
    expect(payload.joinedAt).toBe("2024-08-01");
    expect(payload.guardianPhone).toBe("92999990000");
    expect(payload.address?.postalCode).toBe("69000000");
  });

  it("sends null for an absent joined date and shelter", () => {
    const payload = buildCreatePayload(baseForm);

    expect(payload.joinedAt).toBeNull();
    expect(payload.shelterId).toBeNull();
  });
});

describe("buildUpdatePayload", () => {
  it("only touches the fields the caller supplied", () => {
    const payload = buildUpdatePayload({ name: "Novo nome" });

    expect(payload).toEqual({ name: "Novo nome" });
    expect(payload).not.toHaveProperty("birthDate");
    expect(payload).not.toHaveProperty("address");
  });

  it("preserves an explicit null that detaches a relation", () => {
    const payload = buildUpdatePayload({ shelterId: null, address: null });

    expect(payload.shelterId).toBeNull();
    expect(payload.address).toBeNull();
  });
});

describe("date validation", () => {
  it("requires a valid birth date on create", () => {
    expect(validateCreateDates(baseForm)).toEqual({ valid: true });
    expect(validateCreateDates({ ...baseForm, birthDate: "" }).valid).toBe(false);
    expect(validateCreateDates({ ...baseForm, birthDate: "30/02/2015" }).valid).toBe(
      false,
    );
  });

  it("rejects an invalid joined date on create", () => {
    expect(
      validateCreateDates({ ...baseForm, joinedAt: "32/13/2024" }).valid,
    ).toBe(false);
  });

  it("skips date fields the update did not supply", () => {
    expect(validateUpdateDates({ name: "Maria" })).toEqual({ valid: true });
    expect(validateUpdateDates({ birthDate: "30/02/2015" }).valid).toBe(false);
    expect(validateUpdateDates({ joinedAt: null })).toEqual({ valid: true });
  });
});

describe("address helpers", () => {
  it("builds a Google Maps query from the full address", () => {
    expect(buildMapsUrl(address)).toContain(encodeURIComponent("Rua das Flores"));
    expect(buildMapsUrl(null)).toBeUndefined();
  });

  it("renders the short label used in the cards", () => {
    expect(shortAddressLabel(address)).toBe("Manaus / AM");
    expect(shortAddressLabel(null)).toBe("—");
  });
});

describe("toTestIdSuffix", () => {
  it("produces a stable kebab-case suffix", () => {
    expect(toTestIdSuffix("Maria da Silva")).toBe("maria-da-silva");
    expect(toTestIdSuffix("6f1c3c62-0F6A")).toBe("6f1c3c62-0f6a");
  });
});
