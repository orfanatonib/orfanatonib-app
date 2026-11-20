import { describe, expect, it, vi } from "vitest";
import api from "@/config/axiosConfig";
import { getOccurrenceAttendance } from "./api";
import { EventCategory } from "./types";
vi.mock("@/config/axiosConfig", () => ({ default: { get: vi.fn() } }));
describe("complete occurrence loading", () => {
  it("loads the next page without dropping the selected team or category", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: "first" }], meta: { hasNext: true } },
      })
      .mockResolvedValueOnce({
        data: { data: [{ id: "last" }], meta: { hasNext: false } },
      });
    const query = {
      teamId: "team",
      scheduleId: "event",
      category: EventCategory.MEETING,
    };
    const result = await getOccurrenceAttendance(query);
    expect(result.map((record) => record.id)).toEqual(["first", "last"]);
    expect(api.get).toHaveBeenNthCalledWith(2, "/attendance/records", {
      params: { ...query, page: 2, limit: 100 },
    });
  });
});
