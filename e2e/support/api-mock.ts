import type { Page, Route, Request } from "@playwright/test";
import {
  ADMIN_USER,
  paginate,
  SHELTERED_LIST,
  SHELTERS,
  SHELTER_MANAGEMENT_FLAG,
} from "../fixtures/sheltered.fixtures";
import type { AuthUser, FeatureFlag, Sheltered } from "../fixtures/api.types";

export const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:3000";

/** One captured call, so a spec can assert what the UI actually sent. */
export type RecordedCall = {
  method: string;
  pathname: string;
  query: URLSearchParams;
  body: unknown;
};

export type ShelteredApiMock = {
  /** Every intercepted call, in order. */
  calls: RecordedCall[];
  /** Calls narrowed to a method and a pathname suffix. */
  callsTo: (method: string, pathnameEndsWith: string) => RecordedCall[];
  /** The last `GET /sheltered` query, which is where the filters land. */
  lastListQuery: () => URLSearchParams | undefined;
  /** Rows currently served by the list endpoint. */
  setShelteredList: (rows: Sheltered[]) => void;
  /** Forces the next matching call to fail with the API error envelope. */
  failNext: (method: string, pathnameEndsWith: string, status: number, message: string) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const featureFlagAudienceOf = (
  roles: FeatureFlag["targetRoles"],
): FeatureFlag["audience"] => {
  const order: FeatureFlag["targetRoles"] = ["admin", "leader", "member"];
  const signature = order.filter((role) => roles.includes(role)).join(",");
  const audiences: Record<string, FeatureFlag["audience"]> = {
    "": "EVERYONE",
    admin: "ADMIN",
    leader: "LEADER",
    member: "MEMBER",
    "admin,leader": "ADMIN_LEADER",
    "admin,member": "ADMIN_MEMBER",
    "leader,member": "LEADER_MEMBER",
    "admin,leader,member": "ALL_ROLES",
  };
  return audiences[signature] ?? "EVERYONE";
};

type FailureRule = {
  method: string;
  pathnameEndsWith: string;
  status: number;
  message: string;
};

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

const errorEnvelope = (status: number, message: string, path: string) => ({
  statusCode: status,
  message,
  error: status === 404 ? "Not Found" : "Bad Request",
  category: status >= 500 ? "SERVER" : "BUSINESS",
  timestamp: new Date().toISOString(),
  path,
  requestId: "e2e-request-id",
  correlationId: "e2e-correlation-id",
});

const parseBody = (request: Request): unknown => {
  const raw = request.postData();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

/**
 * Intercepts every endpoint the acolhidos screen touches: the auth bootstrap,
 * the feature flags that gate the route, the shelter lookups and the sheltered
 * CRUD itself.
 */
export async function mockShelteredApi(
  page: Page,
  options: { user?: AuthUser; flags?: FeatureFlag[]; rows?: Sheltered[] } = {},
): Promise<ShelteredApiMock> {
  const user = options.user ?? ADMIN_USER;
  let flags = options.flags ?? [SHELTER_MANAGEMENT_FLAG];
  let rows = options.rows ?? SHELTERED_LIST;

  const calls: RecordedCall[] = [];
  const failures: FailureRule[] = [];

  const takeFailure = (method: string, pathname: string): FailureRule | undefined => {
    const index = failures.findIndex(
      (rule) => rule.method === method && pathname.endsWith(rule.pathnameEndsWith),
    );
    return index === -1 ? undefined : failures.splice(index, 1)[0];
  };

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    calls.push({ method, pathname, query: searchParams, body: parseBody(request) });

    const failure = takeFailure(method, pathname);
    if (failure) {
      return json(route, failure.status, errorEnvelope(failure.status, failure.message, pathname));
    }

    if (pathname.endsWith("/auth/me")) return json(route, 200, user);
    if (pathname.endsWith("/feature-flags/map")) {
      return json(
        route,
        200,
        Object.fromEntries(flags.map((flag) => [flag.key, flag.enabled])),
      );
    }
    if (pathname.endsWith("/feature-flags/stats")) {
      return json(route, 200, {
        total: flags.length,
        enabled: flags.filter((flag) => flag.enabled).length,
        disabled: flags.filter((flag) => !flag.enabled).length,
        byAudience: {
          EVERYONE: flags.filter((flag) => flag.audience === "EVERYONE").length,
          ADMIN: flags.filter((flag) => flag.audience === "ADMIN").length,
          LEADER: flags.filter((flag) => flag.audience === "LEADER").length,
          MEMBER: flags.filter((flag) => flag.audience === "MEMBER").length,
          ADMIN_LEADER: flags.filter((flag) => flag.audience === "ADMIN_LEADER").length,
          ADMIN_MEMBER: flags.filter((flag) => flag.audience === "ADMIN_MEMBER").length,
          LEADER_MEMBER: flags.filter((flag) => flag.audience === "LEADER_MEMBER").length,
          ALL_ROLES: flags.filter((flag) => flag.audience === "ALL_ROLES").length,
        },
      });
    }
    if (pathname.endsWith("/feature-flags/seed") && method === "POST") {
      return json(route, 200, {
        message: "Catálogo de feature flags conferido",
        count: 0,
        created: [],
        retired: [],
      });
    }
    if (pathname.endsWith("/feature-flags") && method === "GET") {
      const search = searchParams.get("searchString")?.trim().toLowerCase();
      const enabled = searchParams.get("enabled");
      const audience = searchParams.get("audience");
      const sort = searchParams.get("sort") ?? "name";
      const order = searchParams.get("order") === "DESC" ? -1 : 1;
      const pageNumber = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 12);
      const filtered = flags
        .filter(
          (flag) =>
            !search ||
            [flag.key, flag.name, flag.description ?? ""].some((value) =>
              value.toLowerCase().includes(search),
            ),
        )
        .filter((flag) => enabled === null || flag.enabled === (enabled === "true"))
        .filter((flag) => !audience || flag.audience === audience)
        .sort((left, right) => {
          const field =
            sort === "key" || sort === "createdAt" || sort === "updatedAt"
              ? sort
              : "name";
          return left[field].localeCompare(right[field], "pt-BR") * order;
        });
      const start = (pageNumber - 1) * limit;
      return json(route, 200, {
        data: filtered.slice(start, start + limit),
        meta: {
          page: pageNumber,
          limit,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
          orderBy: sort,
          order: order === -1 ? "DESC" : "ASC",
        },
      });
    }
    if (pathname.endsWith("/feature-flags") && method === "POST") {
      const body = parseBody(request);
      const payload = isRecord(body) ? body : {};
      const targetRoles = Array.isArray(payload.targetRoles)
        ? payload.targetRoles.filter(
            (role): role is "admin" | "leader" | "member" =>
              role === "admin" || role === "leader" || role === "member",
          )
        : [];
      const created: FeatureFlag = {
        id: `flag-${String(payload.key ?? "created")}`,
        key: String(payload.key ?? "created"),
        name: String(payload.name ?? "Created"),
        description:
          typeof payload.description === "string" ? payload.description : null,
        enabled: payload.enabled === true,
        environment: null,
        targetRoles,
        audience: featureFlagAudienceOf(targetRoles),
        metadata: isRecord(payload.metadata) ? payload.metadata : null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      flags = [...flags, created];
      return json(route, 201, created);
    }
    if (pathname.endsWith("/toggle") && method === "PATCH") {
      const key = pathname.split("/").at(-2);
      const flag = flags.find((item) => item.key === key);
      if (!flag) {
        return json(route, 404, errorEnvelope(404, "Feature flag não encontrada", pathname));
      }
      const updated = { ...flag, enabled: !flag.enabled };
      flags = flags.map((item) => (item.id === updated.id ? updated : item));
      return json(route, 200, updated);
    }
    if (pathname.includes("/feature-flags/") && method === "DELETE") {
      const key = decodeURIComponent(pathname.split("/").at(-1) ?? "");
      flags = flags.filter((flag) => flag.key !== key);
      return route.fulfill({ status: 204, body: "" });
    }
    if (pathname.endsWith("/shelters/list")) return json(route, 200, SHELTERS);
    if (pathname.endsWith("/shelters/simple")) {
      return json(
        route,
        200,
        SHELTERS.map((shelter) => ({ ...shelter, teams: [], address: null })),
      );
    }

    if (pathname.endsWith("/sheltered") && method === "GET") {
      const page_ = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 12);
      return json(route, 200, paginate(rows, page_, limit));
    }

    if (pathname.endsWith("/sheltered") && method === "POST") {
      return json(route, 201, rows[0]);
    }

    if (pathname.includes("/sheltered/") && method === "GET") {
      const id = pathname.split("/").pop();
      const found = rows.find((row) => row.id === id) ?? rows[0];
      return json(route, 200, found);
    }

    if (pathname.includes("/sheltered/") && (method === "PUT" || method === "PATCH")) {
      const id = pathname.split("/").filter(Boolean).at(method === "PATCH" ? -2 : -1);
      const found = rows.find((row) => row.id === id) ?? rows[0];
      return json(route, 200, found);
    }

    if (pathname.includes("/sheltered/") && method === "DELETE") {
      const id = pathname.split("/").pop();
      rows = rows.filter((row) => row.id !== id);
      return route.fulfill({ status: 200, body: "" });
    }

    // Anything else the app boots with is irrelevant to these screens.
    return json(route, 200, []);
  });

  return {
    calls,
    callsTo: (method, pathnameEndsWith) =>
      calls.filter(
        (call) => call.method === method && call.pathname.endsWith(pathnameEndsWith),
      ),
    lastListQuery: () =>
      calls.filter((call) => call.method === "GET" && call.pathname.endsWith("/sheltered")).at(-1)
        ?.query,
    setShelteredList: (next) => {
      rows = next;
    },
    failNext: (method, pathnameEndsWith, status, message) => {
      failures.push({ method, pathnameEndsWith, status, message });
    },
  };
}
