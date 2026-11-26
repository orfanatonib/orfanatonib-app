import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTeamAttendance } from "./useTeamAttendance";
import { getOccurrenceAttendance, registerTeamAttendance } from "../api";
import { AttendanceType, EventCategory } from "../types";
import type {
  AttendanceResponseDto,
  TeamScheduleDto,
  TeamWithMembersDto,
} from "../types";
vi.mock("../api", () => ({
  getOccurrenceAttendance: vi.fn(),
  registerTeamAttendance: vi.fn(),
}));
const team: TeamWithMembersDto = {
  teamId: "team",
  teamNumber: 1,
  members: [{ id: "member", name: "Ana", role: "member" }],
};
const schedules: TeamScheduleDto[] = [
  EventCategory.VISIT,
  EventCategory.MEETING,
].map((category) => ({
  id: "event",
  category,
  date: "2026-11-01",
  visitNumber: 1,
  lessonContent: "Lição",
  teamId: "team",
  teamNumber: 1,
  shelterName: "Abrigo",
}));
const saved: AttendanceResponseDto = {
  id: "record",
  memberId: "member",
  memberName: "Ana",
  scheduleId: "event",
  visitNumber: 1,
  type: AttendanceType.ABSENT,
  category: EventCategory.VISIT,
  comment: "Justificativa",
  createdAt: "",
  updatedAt: "",
};
const wrapper = ({ children }: PropsWithChildren) => (
  <MemoryRouter>{children}</MemoryRouter>
);
const mount = () =>
  renderHook(
    () =>
      useTeamAttendance({ team, schedules, onAttendanceRegistered: vi.fn() }),
    { wrapper },
  );
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOccurrenceAttendance).mockResolvedValue([]);
  vi.mocked(registerTeamAttendance).mockResolvedValue([saved]);
});
describe("safe attendance editing", () => {
  it("does not invent presence for an unregistered member or save before all markings", async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.memberAttendances.member.type).toBeNull();
    await act(async () => result.current.handleSubmit());
    expect(registerTeamAttendance).not.toHaveBeenCalled();
  });
  it("does not silently replace an unavailable event from a direct link", async () => {
    const { result } = renderHook(
      () =>
        useTeamAttendance({ team, schedules, onAttendanceRegistered: vi.fn() }),
      {
        wrapper: ({ children }: PropsWithChildren) => (
          <MemoryRouter initialEntries={["/?evento=missing&tipo=visit"]}>
            {children}
          </MemoryRouter>
        ),
      },
    );
    expect(result.current.selectionError).toBe(true);
    expect(result.current.ready).toBe(false);
    expect(result.current.scheduleId).toBe("");
    expect(getOccurrenceAttendance).not.toHaveBeenCalled();
  });

  it("blocks saving while existing records load", async () => {
    vi.mocked(getOccurrenceAttendance).mockReturnValue(
      new Promise(() => undefined),
    );
    const { result } = mount();
    act(() =>
      result.current.handleMemberTypeChange("member", AttendanceType.PRESENT),
    );
    await act(async () => result.current.handleSubmit());
    expect(result.current.ready).toBe(false);
    expect(registerTeamAttendance).not.toHaveBeenCalled();
  });
  it("keeps errors distinct from empty records and permits a retry", async () => {
    vi.mocked(getOccurrenceAttendance)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([saved]);
    const { result } = mount();
    await waitFor(() => expect(result.current.loadError).toBeTruthy());
    expect(result.current.ready).toBe(false);
    expect(result.current.memberAttendances).toEqual({});
    act(() => result.current.retryLoad());
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.memberAttendances.member.type).toBe(
      AttendanceType.ABSENT,
    );
  });
  it("uses the saved response without a second GET and clears dirty state", async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() =>
      result.current.handleMemberTypeChange("member", AttendanceType.ABSENT),
    );
    act(() =>
      result.current.handleMemberCommentChange("member", "Justificativa"),
    );
    await act(async () => result.current.handleSubmit());
    expect(registerTeamAttendance).toHaveBeenCalledWith({
      teamId: "team",
      scheduleId: "event",
      category: EventCategory.VISIT,
      attendances: [
        {
          memberId: "member",
          type: AttendanceType.ABSENT,
          comment: "Justificativa",
        },
      ],
    });
    expect(getOccurrenceAttendance).toHaveBeenCalledTimes(1);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.formState.feedback?.status).toBe("success");
  });
  it("preserves edits when saving fails", async () => {
    vi.mocked(registerTeamAttendance).mockRejectedValue(new Error("offline"));
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() =>
      result.current.handleMemberTypeChange("member", AttendanceType.ABSENT),
    );
    await act(async () => result.current.handleSubmit());
    expect(result.current.isDirty).toBe(true);
    expect(result.current.memberAttendances.member.type).toBe(
      AttendanceType.ABSENT,
    );
    expect(result.current.formState.error).toBeTruthy();
  });
  it("ignores a delayed response for the previously selected category", async () => {
    let resolveVisit: (records: AttendanceResponseDto[]) => void = () =>
      undefined;
    vi.mocked(getOccurrenceAttendance)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveVisit = resolve;
          }),
      )
      .mockResolvedValueOnce([]);
    const { result } = mount();
    act(() => result.current.setEventTypeFilter(EventCategory.MEETING));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => resolveVisit([saved]));
    expect(result.current.eventTypeFilter).toBe(EventCategory.MEETING);
    expect(result.current.memberAttendances.member.type).toBeNull();
  });
});
