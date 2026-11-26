import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { authHeaders } from "../support/live";
import { directOutboxCount } from "../support/outbox";

export interface ReportInput {
  scheduleId: string;
  teamMembersPresent?: number;
  shelteredHeardMessage?: number;
  caretakersHeardMessage?: number;
  shelteredDecisions?: number;
  caretakersDecisions?: number;
  observation?: string;
}

export interface ReportBody {
  id: string;
  teamMembersPresent: number;
  shelteredHeardMessage: number;
  caretakersHeardMessage: number;
  shelteredDecisions: number;
  caretakersDecisions: number;
  observation?: string | null;
  schedule?: { id: string };
}

export const payload = (input: ReportInput): Record<string, unknown> => ({
  scheduleId: input.scheduleId,
  teamMembersPresent: input.teamMembersPresent ?? 5,
  shelteredHeardMessage: input.shelteredHeardMessage ?? 10,
  caretakersHeardMessage: input.caretakersHeardMessage ?? 3,
  shelteredDecisions: input.shelteredDecisions ?? 2,
  caretakersDecisions: input.caretakersDecisions ?? 1,
  ...(input.observation !== undefined ? { observation: input.observation } : {}),
});

export const createRaw = (request: APIRequestContext, token: string | undefined, body: Record<string, unknown>): Promise<APIResponse> =>
  request.post(`${API_URL}/visit-reports`, { headers: token ? authHeaders(token) : {}, data: body });

export const putRaw = (request: APIRequestContext, token: string, id: string, body: Record<string, unknown>): Promise<APIResponse> =>
  request.put(`${API_URL}/visit-reports/${id}`, { headers: authHeaders(token), data: body });

export const deleteRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.delete(`${API_URL}/visit-reports/${id}`, { headers: authHeaders(token) });

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const reportRow = (id: string) =>
  queryOne<{
    id: string;
    teamMembersPresent: number;
    shelteredHeardMessage: number;
    caretakersHeardMessage: number;
    shelteredDecisions: number;
    caretakersDecisions: number;
    observation: string | null;
    schedule_id: string;
  }>(
    "SELECT id, teamMembersPresent, shelteredHeardMessage, caretakersHeardMessage, shelteredDecisions, caretakersDecisions, observation, schedule_id FROM visit_reports WHERE id = ?",
    [id],
  );

export const reportsOfSchedule = (scheduleId: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM visit_reports WHERE schedule_id = ?", [scheduleId]);

export const allReports = (): Promise<number> => count("SELECT COUNT(*) AS n FROM visit_reports");
export const outboxTotal = (): Promise<number> => directOutboxCount();
