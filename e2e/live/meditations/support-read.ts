import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { authHeaders } from "../support/live";

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });
