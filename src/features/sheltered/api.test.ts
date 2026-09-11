import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({
  default: { get, post, put, patch, delete: del },
}));

const {
  apiCreateSheltered,
  apiDeleteSheltered,
  apiFetchSheltered,
  apiFetchShelteredList,
  apiFetchShelteredSimple,
  apiUpdateSheltered,
  apiUpdateShelteredStatus,
} = await import("./api");

const { AcceptedJesusFilter, ShelteredActiveFilter, ShelteredGender, ShelteredOrderBy, SortOrder } =
  await import("./enums");

const lastParams = (): Record<string, unknown> =>
  get.mock.calls.at(-1)?.[1]?.params as Record<string, unknown>;

describe("sheltered api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: { data: [], meta: { totalItems: 0 } } });
  });

  it("always goes through the shared axios client", async () => {
    await apiFetchSheltered("sheltered-id");
    expect(get).toHaveBeenCalledWith("/sheltered/sheltered-id");
  });

  it("sends pagination and sorting using the API allowlist", async () => {
    await apiFetchShelteredList({
      page: 2,
      limit: 24,
      sort: { id: ShelteredOrderBy.JOINED_AT, desc: true },
    });

    expect(get).toHaveBeenCalledWith("/sheltered", expect.anything());
    expect(lastParams()).toMatchObject({
      page: 2,
      limit: 24,
      orderBy: ShelteredOrderBy.JOINED_AT,
      order: SortOrder.DESC,
    });
  });

  it("only forwards filters that carry a value", async () => {
    await apiFetchShelteredList({
      page: 1,
      limit: 12,
      filters: {
        searchString: "  Maria  ",
        shelterSearchingString: "   ",
        gender: ShelteredGender.FEMALE,
        birthDateFrom: "",
      },
    });

    const params = lastParams();
    expect(params.searchString).toBe("Maria");
    expect(params.gender).toBe(ShelteredGender.FEMALE);
    expect(params).not.toHaveProperty("shelterSearchingString");
    expect(params).not.toHaveProperty("birthDateFrom");
  });

  it("omits the 'all' filters on the simple list, matching the API defaults", async () => {
    await apiFetchShelteredSimple({
      page: 1,
      limit: 20,
      acceptedJesus: AcceptedJesusFilter.ALL,
      active: ShelteredActiveFilter.ALL,
      searchString: "  ",
    });

    expect(get).toHaveBeenCalledWith("/sheltered/simple", expect.anything());
    expect(lastParams()).toEqual({ page: 1, limit: 20 });
  });

  it("forwards the explicit simple-list filters", async () => {
    await apiFetchShelteredSimple({
      acceptedJesus: AcceptedJesusFilter.ACCEPTED,
      active: ShelteredActiveFilter.INACTIVE,
      searchString: "Abrigo",
    });

    expect(lastParams()).toEqual({
      acceptedJesus: AcceptedJesusFilter.ACCEPTED,
      active: ShelteredActiveFilter.INACTIVE,
      searchString: "Abrigo",
    });
  });

  it("posts, puts, patches and deletes on the documented routes", async () => {
    post.mockResolvedValue({ data: { id: "new-id" } });
    put.mockResolvedValue({ data: { id: "sheltered-id" } });
    patch.mockResolvedValue({ data: { id: "sheltered-id" } });
    del.mockResolvedValue({ data: undefined });

    const payload = { name: "Maria", gender: ShelteredGender.FEMALE };

    await expect(apiCreateSheltered(payload)).resolves.toEqual({ id: "new-id" });
    expect(post).toHaveBeenCalledWith("/sheltered", payload);

    await apiUpdateSheltered("sheltered-id", { name: "Maria Souza" });
    expect(put).toHaveBeenCalledWith("/sheltered/sheltered-id", { name: "Maria Souza" });

    await apiUpdateShelteredStatus("sheltered-id", false);
    expect(patch).toHaveBeenCalledWith("/sheltered/sheltered-id/status", {
      active: false,
    });

    await expect(apiDeleteSheltered("sheltered-id")).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith("/sheltered/sheltered-id");
  });
});
