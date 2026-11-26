import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getOccurrenceAttendance, registerTeamAttendance } from "../api";
import { AttendanceType, EventCategory } from "../types";
import type { AttendanceResponseDto, AttendanceFormState } from "../types";
import type { AttendanceRow, UseTeamAttendanceProps } from "../workspace.types";
import {
  attendanceSnapshot,
  buildAttendanceRows,
  countAttendanceRows,
  schedulesForCategory,
} from "../workspace.utils";
import { attendanceErrorMessage } from "../errors";
import { ATTENDANCE_COMMENT_LIMIT } from "../constants";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function useTeamAttendance({
  team,
  schedules,
  onAttendanceRegistered,
}: UseTeamAttendanceProps) {
  const [params, setParams] = useSearchParams();
  const eventTypeFilter =
    params.get("tipo") === EventCategory.MEETING
      ? EventCategory.MEETING
      : EventCategory.VISIT;
  const selectedId = params.get("evento") ?? "";
  const setEventTypeFilter = (category: EventCategory) =>
    setParams({ tipo: category }, { replace: true });
  const setSelectedId = (id: string) =>
    setParams(
      { tipo: eventTypeFilter, ...(id ? { evento: id } : {}) },
      { replace: true },
    );
  const filteredSchedules = useMemo(
    () => schedulesForCategory(schedules, eventTypeFilter),
    [schedules, eventTypeFilter],
  );
  const selectionError = Boolean(
    selectedId &&
      !filteredSchedules.some((schedule) => schedule.id === selectedId),
  );
  const scheduleId = selectedId
    ? selectionError
      ? ""
      : selectedId
    : (filteredSchedules[0]?.id ?? "");
  const membersOnly = useMemo(
    () =>
      team.members.filter((member) => !member.role || member.role === "member"),
    [team.members],
  );
  const [memberAttendances, setRows] = useState<Record<string, AttendanceRow>>(
    {},
  );
  const [baseline, setBaseline] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [records, setRecords] = useState<AttendanceResponseDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [formState, setFormState] = useState<AttendanceFormState>({
    loading: false,
    error: null,
    feedback: null,
  });
  const saving = useRef(false);
  const key = `${team.teamId}:${scheduleId}:${eventTypeFilter}`;
  const ready = Boolean(scheduleId && loadedKey === key && !loadError);
  const isDirty = ready && attendanceSnapshot(memberAttendances) !== baseline;
  useUnsavedChangesGuard(isDirty || formState.loading);

  useEffect(() => {
    let active = true;
    setLoadedKey("");
    setLoadError(null);
    setRecords([]);
    setRows({});
    setFormState({ loading: false, error: null, feedback: null });
    if (!scheduleId) return;
    void getOccurrenceAttendance({
      teamId: team.teamId,
      scheduleId,
      category: eventTypeFilter,
    })
      .then((result) => {
        if (!active) return;
        const rows = buildAttendanceRows(membersOnly, result);
        setRows(rows);
        setBaseline(attendanceSnapshot(rows));
        setRecords(result);
        setLoadedKey(key);
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(
            attendanceErrorMessage(
              error,
              "Não foi possível carregar a frequência. Tente novamente antes de preencher.",
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [team.teamId, scheduleId, eventTypeFilter, membersOnly, key, retry]);

  const handleMemberTypeChange = (memberId: string, type: AttendanceType) => {
    if (!ready || saving.current) return;
    setRows((prev) => ({ ...prev, [memberId]: { ...prev[memberId], type } }));
    setFormState((prev) => ({ ...prev, feedback: null }));
  };
  const handleMemberCommentChange = (memberId: string, comment: string) => {
    if (!ready || saving.current) return;
    setRows((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], comment },
    }));
    setFormState((prev) => ({ ...prev, feedback: null }));
  };
  const bulkSetType = (type: AttendanceType) => {
    if (!ready || saving.current) return;
    setRows((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, row]) => [id, { ...row, type }]),
      ),
    );
    setFormState((prev) => ({ ...prev, feedback: null }));
  };
  const counts = countAttendanceRows(memberAttendances);
  const handleSubmit = async () => {
    if (!ready || saving.current || !membersOnly.length || !isDirty) return;
    const attendances = [];
    for (const row of Object.values(memberAttendances)) {
      if (row.type === null || row.comment.length > ATTENDANCE_COMMENT_LIMIT) {
        setFormState((prev) => ({
          ...prev,
          error:
            row.type === null
              ? "Marque a presença ou falta de todos os membros."
              : "A observação deve ter no máximo 500 caracteres.",
        }));
        return;
      }
      attendances.push({
        memberId: row.member.id,
        type: row.type,
        comment: row.comment.trim(),
      });
    }
    saving.current = true;
    setFormState({ loading: true, error: null, feedback: null });
    try {
      // The mutation already returns the persisted records. A second GET must not turn a successful save into an error.
      const saved = await registerTeamAttendance({
        teamId: team.teamId,
        scheduleId,
        category: eventTypeFilter,
        attendances,
      });
      const rows = buildAttendanceRows(membersOnly, saved);
      setRows(rows);
      setBaseline(attendanceSnapshot(rows));
      setRecords(saved);
      setFormState({
        loading: false,
        error: null,
        feedback: {
          status: "success",
          message: "Presenças salvas com sucesso.",
        },
      });
      onAttendanceRegistered();
    } catch (error: unknown) {
      setFormState({
        loading: false,
        error: attendanceErrorMessage(
          error,
          "Não foi possível salvar. Suas marcações foram mantidas; tente novamente.",
        ),
        feedback: null,
      });
    } finally {
      saving.current = false;
    }
  };
  return {
    selectionError,
    scheduleId,
    setScheduleId: setSelectedId,
    eventTypeFilter,
    setEventTypeFilter,
    filteredSchedules,
    membersOnly,
    memberAttendances,
    formState,
    ready,
    isDirty,
    loadError,
    retryLoad: () => setRetry((value) => value + 1),
    hasExistingAttendance: records.length > 0,
    counts,
    handleMemberTypeChange,
    handleMemberCommentChange,
    bulkSetType,
    handleSubmit,
  };
}
