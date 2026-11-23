import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte "ao vivo": exercita a pilha real — API NestJS, MySQL e S3 (LocalStack) —
 * sem nenhuma interceptação. Esta também é a configuração padrão importada por
 * `playwright.config.ts`; todo teste e2e deve bater na API real.
 *
 * Pré-requisito: `./run.sh local` no ar (API em :3000, app em :5173), que
 * também semeia as contas usadas aqui.
 */
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3000";
export const APP_URL = process.env.E2E_APP_URL ?? "http://localhost:5173";

/**
 * Massa de dados (`*.seed.ui.spec.ts`, tag `@seed`): cria dados pela UI e DEIXA no banco. Fora da suíte
 * normal: o projeto `live-seed` só existe com `E2E_SEED=1` (scripts `seed:*` do package.json).
 */
const SEED_SPECS = "**/*.seed.ui.spec.ts";
const seedProjects =
  process.env.E2E_SEED === "1"
    ? [
        {
          name: "live-seed",
          dependencies: ["setup"],
          testMatch: SEED_SPECS,
          timeout: 900_000,
          use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
        },
      ]
    : [];

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
    // Sem limite, uma ação num elemento que não existe espera o tempo do teste inteiro (travava por 15 min).
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    // Só tem efeito em --headed: desacelera cada ação para dar para acompanhar.
    launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 0) },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Manaus",
  },
  projects: [
    {
      // Desliga todas as flags de e-mail antes de qualquer teste (regra da suíte).
      name: "setup",
      testDir: "./e2e/live/support",
      testMatch: "**/email-flags.setup.ts",
      use: { baseURL: API_URL },
    },
    {
      name: "live-api",
      dependencies: ["setup"],
      testMatch: "**/*.api.spec.ts",
      use: { baseURL: API_URL },
    },
    {
      name: "live-ui",
      dependencies: ["setup"],
      testMatch: "**/*.ui.spec.ts",
      testIgnore: SEED_SPECS,
      grepInvert: /@mobile/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // Fluxos marcados com @mobile no título, em 375×812 (mobile-first).
      name: "live-ui-mobile",
      dependencies: ["setup"],
      testMatch: "**/*.ui.spec.ts",
      testIgnore: SEED_SPECS,
      grep: /@mobile/,
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
    ...seedProjects,
  ],
});
