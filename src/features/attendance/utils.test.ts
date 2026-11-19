import { describe, expect, it } from "vitest";

import { attendanceErrorMessage } from "./errors";
import { ATTENDANCE_RULES, formatScheduleLabel, getScheduleType, validateAttendanceComment, validateScheduleDates } from "./utils";

describe("regras de presença", () => {
  it("o evento precisa de data de visita ou de reunião", () => {
    expect(validateScheduleDates({}).isValid).toBe(false);
    expect(validateScheduleDates({ visitDate: "2026-01-05" }).isValid).toBe(true);
    expect(validateScheduleDates({ meetingDate: "2026-01-05" }).isValid).toBe(true);
  });

  it("comentário aceita até o limite e recusa acima", () => {
    const max = ATTENDANCE_RULES.MAX_COMMENT_LENGTH;
    expect(validateAttendanceComment(undefined).isValid).toBe(true);
    expect(validateAttendanceComment("x".repeat(max)).isValid).toBe(true);
    const over = validateAttendanceComment("x".repeat(max + 1));
    expect(over.isValid).toBe(false);
    expect(over.errors[0]).toContain(String(max));
  });

  it("tipo do encontro: categoria explícita vence; sem ela, visitDate decide", () => {
    expect(getScheduleType({ category: "meeting", visitDate: "2026-01-05" } as never)).toBe("meeting");
    expect(getScheduleType({ visitDate: "2026-01-05" })).toBe("visit");
    expect(getScheduleType({ meetingDate: "2026-01-05" })).toBe("meeting");
  });

  it("rótulo do encontro traz tipo, número e os extras presentes", () => {
    const label = formatScheduleLabel({ category: "visit", visitNumber: 3, date: "2026-01-05", lessonContent: "Lição", meetingRoom: null } as never);
    expect(label).toContain("Visita #3");
    expect(label).toContain("Lição");
    expect(label).not.toContain("null");
  });
});

describe("attendanceErrorMessage", () => {
  const withMessage = (message: unknown) => ({ response: { data: { message } } });

  it("usa a mensagem da API (texto ou lista), senão o fallback", () => {
    expect(attendanceErrorMessage(withMessage("Sem permissão"), "f")).toBe("Sem permissão");
    expect(attendanceErrorMessage(withMessage(["a", "b"]), "f")).toBe("a, b");
    expect(attendanceErrorMessage(withMessage("  "), "f")).toBe("f");
    expect(attendanceErrorMessage(new Error("x"), "f")).toBe("f");
    expect(attendanceErrorMessage(undefined, "f")).toBe("f");
  });
});
