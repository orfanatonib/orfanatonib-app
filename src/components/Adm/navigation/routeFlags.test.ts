import { describe, expect, it } from "vitest";

import { FeatureFlagKeys } from "@/features/feature-flags/types";
import { FEED_COMMENTS_ADMIN_PATH } from "@/features/feed-comments/constants";
import adminRoutesSource from "@/routes/adminRoutes.tsx?raw";

import { ADMIN_NAVIGATION_SECTIONS } from "./constants";

const ROUTE_PATTERN = /<Route\b([^>]*?)(\/>|>)/gs;
const FLAG_PATTERN = /FeatureFlagKeys\.(\w+)/g;

/** Flags que cada rota `/adm/<path>` exige, lidas do próprio arquivo de rotas. */
function readRouteFlags(source: string): Map<string, Set<string>> {
  const flagsByPath = new Map<string, Set<string>>();
  for (const match of source.matchAll(ROUTE_PATTERN)) {
    const literal = /path="([^"]+)"/.exec(match[1]);
    const constant = /path=\{(\w+)\}/.exec(match[1]);
    const segment =
      literal?.[1] ??
      (constant?.[1] === "FEED_COMMENTS_ADMIN_PATH" ? FEED_COMMENTS_ADMIN_PATH : null);
    if (!segment) continue;
    const start = match.index ?? 0;
    const next = source.indexOf("<Route", start + match[0].length);
    const block =
      match[2] === "/>"
        ? match[0]
        : source.slice(start, next === -1 ? source.length : next);
    const keys = Array.from(block.matchAll(FLAG_PATTERN), (flag) => flag[1]);
    flagsByPath.set(`/adm/${segment}`, new Set(keys));
  }
  return flagsByPath;
}

const enumValueByName = new Map<string, string>(
  Object.entries(FeatureFlagKeys).map(([name, value]) => [name, value as string]),
);

describe("menu do /adm × flags das rotas", () => {
  const routeFlags = readRouteFlags(adminRoutesSource);

  it("o menu exige todas as flags que a rota do item exige", () => {
    for (const section of ADMIN_NAVIGATION_SECTIONS) {
      for (const item of section.items) {
        const required = routeFlags.get(item.path);
        if (!required) continue;
        const menuFlags = new Set<string>([
          ...(item.requiredFeatureFlag ? [item.requiredFeatureFlag] : []),
          ...(item.requiredFeatureFlags ?? []),
        ]);
        for (const name of required) {
          const value = enumValueByName.get(name);
          expect(menuFlags.has(value ?? name), `${item.id}: falta ${name}`).toBe(true);
        }
      }
    }
  });

  it("o arquivo de rotas foi lido (guarda contra teste vazio)", () => {
    expect(routeFlags.size).toBeGreaterThan(20);
  });
});
