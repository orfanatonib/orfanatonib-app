import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte "ao vivo": exercita a pilha real — API NestJS, MySQL e S3 (LocalStack) —
 * sem nenhuma interceptação. Diferente de `playwright.config.ts`, que usa
 * dublês de API para testar a UI de forma determinística.
 *
 * Pré-requisito: `./run.sh local` no ar (API em :3000, app em :5173), que
 * também semeia as contas usadas aqui.
 */
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3000";
export const APP_URL = process.env.E2E_APP_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e/live",
  outputDir: "./e2e/.output-live",
  // Escrevem no mesmo banco: serial evita corridas entre specs.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: APP_URL,
    // Só tem efeito em --headed: desacelera cada ação para dar para acompanhar.
    launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 0) },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Manaus",
  },
  projects: [
    {
      name: "live-api",
      testMatch: "**/*.api.spec.ts",
      use: { baseURL: API_URL },
    },
    {
      name: "live-ui",
      testMatch: "**/*.ui.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
