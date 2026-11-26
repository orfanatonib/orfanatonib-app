import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import { API_URL } from "../../../playwright.live.config";
import { LIVE_ACCOUNTS, type LiveRole } from "./credentials";
import { markOutboxWindow } from "./outbox";

export type LoginResult = { accessToken: string; refreshToken: string; userId: string };

/** Autentica de verdade contra a API e devolve os tokens reais. */
export async function loginAs(
  request: APIRequestContext,
  role: LiveRole = "admin",
): Promise<LoginResult> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: LIVE_ACCOUNTS[role],
  });

  if (!response.ok()) {
    throw new Error(
      `Login de ${role} falhou (${response.status()}). ` +
        "As contas locais existem? Rode: (cd ../orfanatonib-api && npm run seed:local)",
    );
  }

  const body = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    user: { id: string };
  };
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    userId: body.user.id,
  };
}

export const authHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Injeta a sessão real no navegador. `initAuth` lê essas duas chaves do
 * localStorage no boot e busca `/auth/me` na API de verdade.
 */
export async function seedBrowserSession(
  page: Page,
  tokens: LoginResult,
): Promise<void> {
  await page.context().addInitScript((session) => {
    window.localStorage.setItem("accessToken", session.accessToken);
    window.localStorage.setItem("refreshToken", session.refreshToken);
  }, tokens);
}

type LiveFixtures = {
  /** Token de admin obtido por login real. */
  adminToken: string;
  /** Página já autenticada como admin contra a API real. */
  authenticatedPage: Page;
};

export const test = base.extend<LiveFixtures & { outboxWindow: void }>({
  outboxWindow: [
    async ({}, use, testInfo) => {
      markOutboxWindow(testInfo.testId);
      await use();
    },
    { auto: true },
  ],

  adminToken: async ({ request }, use) => {
    const { accessToken } = await loginAs(request, "admin");
    await use(accessToken);
  },

  authenticatedPage: async ({ page, request }, use) => {
    const tokens = await loginAs(request, "admin");
    await seedBrowserSession(page, tokens);
    await use(page);
  },
});

export function uniqueSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}

export { expect };
