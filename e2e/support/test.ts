import { test as base, expect } from "@playwright/test";
import { mockShelteredApi, type ShelteredApiMock } from "./api-mock";
import type { AuthUser, FeatureFlag, Sheltered } from "../fixtures/api.types";

export const SHELTERED_ROUTE = "/adm/acolhidos";

export type ApiMockOptions = {
  user?: AuthUser;
  flags?: FeatureFlag[];
  rows?: Sheltered[];
};

type Fixtures = {
  /** Options a spec may override with `test.use({ apiMockOptions: ... })`. */
  apiMockOptions: ApiMockOptions;
  /** API interception, already installed on the page. */
  api: ShelteredApiMock;
  /** Navigates to the acolhidos screen with a bootstrapped session. */
  gotoSheltered: () => Promise<void>;
};

/**
 * `initAuth` reads these two keys straight from localStorage on boot, then
 * calls `GET /auth/me` — which the mock answers. Seeding them is what makes the
 * session look restored without driving the login screen on every spec.
 */
const seedSession = async (context: import("@playwright/test").BrowserContext) => {
  await context.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
    window.localStorage.setItem("refreshToken", "e2e-refresh-token");
  });
};

export const test = base.extend<Fixtures>({
  apiMockOptions: [{}, { option: true }],

  api: async ({ page, context, apiMockOptions }, use) => {
    await seedSession(context);
    const api = await mockShelteredApi(page, apiMockOptions);
    await use(api);
  },

  gotoSheltered: async ({ page, api }, use) => {
    void api;
    await use(async () => {
      await page.goto(SHELTERED_ROUTE);
      // The list only renders once the auth bootstrap and the flags resolve.
      await page.getByTestId("sheltered-manager").waitFor();
    });
  },
});

export { expect };
