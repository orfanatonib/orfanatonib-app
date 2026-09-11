import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const apiFetchShelteredList = vi.fn();
const apiCreateSheltered = vi.fn();
const apiUpdateSheltered = vi.fn();
const apiDeleteSheltered = vi.fn();
const apiFetchSheltered = vi.fn();

vi.mock("./api", () => ({
  apiFetchShelteredList: (...args: unknown[]) => apiFetchShelteredList(...args),
  apiCreateSheltered: (...args: unknown[]) => apiCreateSheltered(...args),
  apiUpdateSheltered: (...args: unknown[]) => apiUpdateSheltered(...args),
  apiDeleteSheltered: (...args: unknown[]) => apiDeleteSheltered(...args),
  apiFetchSheltered: (...args: unknown[]) => apiFetchSheltered(...args),
}));

vi.mock("@/features/shelters/api", () => ({ apiFetchSheltersSimple: vi.fn() }));

// Breaks the axios client -> redux store import chain, which the auth slice pulls in.
vi.mock("@/config/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const { useSheltered, useShelteredMutations } = await import("./hooks");
const { ShelteredGender } = await import("./enums");
const { SHELTERED_SORT_DEFAULT } = await import("./constants");

const row = {
  id: "sheltered-id",
  name: "Maria Silva",
  gender: ShelteredGender.FEMALE,
  birthDate: "2015-04-02",
  joinedAt: null,
  active: true,
  shelter: null,
  address: null,
  createdAt: "2026-01-10T12:30:00.000Z",
  updatedAt: "2026-02-20T08:00:00.000Z",
};

const page = { data: [row], meta: { page: 1, limit: 12, totalItems: 41, totalPages: 4 } };

describe("useSheltered", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchShelteredList.mockResolvedValue(page);
  });

  it("loads the first page and exposes the server total", async () => {
    const { result } = renderHook(() =>
      useSheltered(0, 12, SHELTERED_SORT_DEFAULT, {}),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiFetchShelteredList).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      filters: {},
      sort: SHELTERED_SORT_DEFAULT,
    });
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.total).toBe(41);
    expect(result.current.error).toBe("");
  });

  it("translates a page index into the 1-based API page", async () => {
    const { result } = renderHook(() =>
      useSheltered(2, 12, SHELTERED_SORT_DEFAULT, {}),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiFetchShelteredList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3 }),
    );
  });

  it("surfaces the API message and clears the rows on failure", async () => {
    apiFetchShelteredList.mockRejectedValue({
      response: { data: { message: "Validation failed" } },
    });

    const { result } = renderHook(() =>
      useSheltered(0, 12, SHELTERED_SORT_DEFAULT, {}),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Validation failed");
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});

describe("useShelteredMutations", () => {
  const refetch = vi.fn().mockResolvedValue(undefined);

  const validForm = {
    name: "Maria Silva",
    gender: ShelteredGender.FEMALE,
    birthDate: "02/04/2015",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    refetch.mockResolvedValue(undefined);
    apiCreateSheltered.mockResolvedValue(row);
    apiUpdateSheltered.mockResolvedValue(row);
    apiDeleteSheltered.mockResolvedValue(undefined);
  });

  it("creates, refetches and reports success", async () => {
    const { result } = renderHook(() => useShelteredMutations(refetch));

    let created = false;
    await act(async () => {
      created = await result.current.createSheltered(validForm);
    });

    expect(created).toBe(true);
    expect(apiCreateSheltered).toHaveBeenCalledWith(
      expect.objectContaining({ birthDate: "2015-04-02" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(result.current.dialogError).toBe("");
  });

  it("blocks an invalid birth date before touching the API", async () => {
    const { result } = renderHook(() => useShelteredMutations(refetch));

    let created = true;
    await act(async () => {
      created = await result.current.createSheltered({
        ...validForm,
        birthDate: "30/02/2015",
      });
    });

    expect(created).toBe(false);
    expect(apiCreateSheltered).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
    expect(result.current.dialogError).toContain("Data de nascimento inválida");
  });

  it("keeps the dialog open and shows the API message when the update fails", async () => {
    apiUpdateSheltered.mockRejectedValue({
      response: { data: { message: "Abrigo não encontrado ou fora do seu acesso." } },
    });

    const { result } = renderHook(() => useShelteredMutations(refetch));

    let updated = true;
    await act(async () => {
      updated = await result.current.updateSheltered("sheltered-id", {
        shelterId: "other",
      });
    });

    expect(updated).toBe(false);
    expect(result.current.dialogError).toBe(
      "Abrigo não encontrado ou fora do seu acesso.",
    );
    expect(refetch).not.toHaveBeenCalled();
  });

  it("deletes and refetches", async () => {
    const { result } = renderHook(() => useShelteredMutations(refetch));

    let deleted = false;
    await act(async () => {
      deleted = await result.current.deleteSheltered("sheltered-id");
    });

    expect(deleted).toBe(true);
    expect(apiDeleteSheltered).toHaveBeenCalledWith("sheltered-id");
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
