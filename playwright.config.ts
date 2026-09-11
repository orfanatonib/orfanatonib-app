import { defineConfig, devices } from "@playwright/test";

const APP_PORT = Number(process.env.E2E_APP_PORT ?? 5173);
export const APP_URL = `http://localhost:${APP_PORT}`;

/**
 * The e2e suite drives the real app (router, Redux, MUI) against an
 * intercepted API, so it needs no database and stays deterministic.
 * `VITE_API_URL` is intentionally left unset: `axiosConfig` then falls back to
 * http://localhost:3000, which `support/api-mock.ts` intercepts.
 */
export default defineConfig({
  testDir: "./e2e/specs",
  outputDir: "./e2e/.output",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { outputFolder: "e2e/.report", open: "never" }]]
    : [["list"]],
  // O dev server do Vite transforma um grafo grande (MUI + x-date-pickers) a
  // cada carga de página, então o orçamento por teste precisa ser generoso.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: APP_URL,
    // Só tem efeito em --headed: desacelera cada ação para dar para acompanhar.
    launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 0) },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Manaus",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: "**/mobile/**",
    },
    {
      // The feature is mobile-first and swaps the table for cards below `sm`.
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testMatch: "**/mobile/**",
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${APP_PORT} --strictPort`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
