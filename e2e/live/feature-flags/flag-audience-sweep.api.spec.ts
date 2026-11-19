import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Varredura de públicos das flags (planos 08/09): o catálogo tem público por flag
 * (`targetRoles`) e o guard de perfil continua soberano. Se uma flag de público
 * mais estreito for posta num handler que o perfil também atende, o perfil leva
 * `403 FEATURE_DISABLED` mesmo com acesso legítimo (aconteceu com `GET /shelter-schedules`
 * do membro e `POST /profiles`). Esta varredura chama todo GET sem parâmetro como
 * líder e membro e só aceita `FEATURE_DISABLED` nas rotas listadas abaixo — onde o
 * perfil NÃO tem acesso de qualquer forma.
 */
const API_SRC = process.env.E2E_API_SRC ?? resolve(process.cwd(), "../orfanatonib-api/src");

/** `FEATURE_DISABLED` esperado: o perfil não tem acesso a esse recurso de qualquer forma. */
const EXPECTED_DISABLED: Readonly<Record<"leader" | "member", readonly string[]>> = {
  leader: [],
  member: [
    "/leader-profiles", // gestão de líderes: admin/líder
    "/member-profiles", // gestão de membros: admin/líder
    "/profiles", // listagem: admin/líder
  ],
};

function controllerFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return controllerFiles(full);
    return name.endsWith(".controller.ts") ? [full] : [];
  });
}

/** GET sem parâmetro de rota, a partir dos controllers da API. */
function parameterlessGetRoutes(): string[] {
  const routes = new Set<string>();
  for (const file of controllerFiles(API_SRC)) {
    const text = readFileSync(file, "utf8");
    const base = /@Controller\("([^"]*)"\)/.exec(text)?.[1];
    if (base === undefined) continue;
    for (const match of text.matchAll(/@Get\((?:"([^"]*)")?\)/g)) {
      const sub = match[1] ?? "";
      if (sub.includes(":")) continue;
      routes.add("/" + [base, sub].filter(Boolean).join("/"));
    }
  }
  return [...routes].sort();
}

test.describe("Flags — varredura de públicos", () => {
  test("[feature-flags.get.varredura#publicos-das-flags] nenhum GET do líder ou do membro recebe FEATURE_DISABLED fora da lista esperada", async ({
    request,
  }) => {
    const routes = parameterlessGetRoutes();
    expect(routes.length, "controllers encontrados").toBeGreaterThan(30);

    const unexpected: string[] = [];
    for (const role of ["leader", "member"] as const) {
      const session = await loginAs(request, role);
      for (const route of routes) {
        const res = await request.get(`${API_URL}${route}`, { headers: authHeaders(session.accessToken) });
        if (res.status() !== 403) continue;
        const body = await res.text();
        if (body.includes("FEATURE_DISABLED") || body.includes("temporariamente indispon")) {
          if (!EXPECTED_DISABLED[role].includes(route)) unexpected.push(`${role} ${route}`);
        }
      }
    }
    expect(unexpected, "flag bloqueando perfil que tem acesso").toEqual([]);
  });
});
