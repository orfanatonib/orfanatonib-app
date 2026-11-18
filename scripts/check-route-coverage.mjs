#!/usr/bin/env node
/**
 * Toda rota de `App.tsx` precisa ser visitada por pelo menos um spec de
 * `e2e/live` (`page.goto("/rota")`). Rotas hoje sem E2E ficam na baseline
 * (`e2e/route-coverage.baseline.json`): o gate falha se surgir rota nova sem
 * teste, e a baseline só pode encolher.
 *
 *   node scripts/check-route-coverage.mjs                # gate (baseline)
 *   node scripts/check-route-coverage.mjs --update       # reescreve a baseline
 *   node scripts/check-route-coverage.mjs --strict       # exige 100%
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = new Set(process.argv.slice(2));
const app = readFileSync(join(root, "src/App.tsx"), "utf8");
const body = app.slice(app.indexOf("<Routes>"), app.indexOf("</Routes>"));

const routes = [];
let adm = false;
for (const line of body.split("\n")) {
  if (/<Route[^>]*path="\/adm"/.test(line)) adm = true;
  const m = /<Route[^>]*\bpath="([^"]+)"/.exec(line) ?? /^\s*path="([^"]+)"/.exec(line);
  if (m && m[1] !== "*" && !/\$\{/.test(m[1])) {
    const p = m[1];
    routes.push(p.startsWith("/") ? p : adm ? `/adm/${p}` : `/${p}`);
  }
}
const uniqueRoutes = [...new Set(routes)].sort();

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.spec\.ts$/.test(name)) acc.push(p);
  }
  return acc;
}
const visited = new Set();
for (const f of walk(join(root, "e2e/live"))) {
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(/goto\(\s*[`"'](\/[^`"'?]*)/g)) visited.add(m[1].replace(/\$\{[^}]*\}/g, ":p"));
}
const norm = (r) => r.replace(/:[A-Za-z]+/g, ":p");
const visitedNorm = new Set([...visited].map(norm));
const uncovered = uniqueRoutes.filter((r) => !visitedNorm.has(norm(r)) && ![...visitedNorm].some((v) => v.startsWith(norm(r) + "/")));

const baselineFile = join(root, "e2e/route-coverage.baseline.json");
if (args.has("--update")) {
  writeFileSync(baselineFile, JSON.stringify({ uncovered }, null, 2) + "\n");
  console.log(`baseline atualizada: ${uncovered.length} rotas sem E2E de ${uniqueRoutes.length}`);
  process.exit(0);
}
console.log(`rotas: ${uniqueRoutes.length} · com E2E: ${uniqueRoutes.length - uncovered.length} · sem E2E: ${uncovered.length}`);
if (args.has("--strict")) {
  if (uncovered.length) { console.error("Rotas sem E2E:\n" + uncovered.join("\n")); process.exit(1); }
  process.exit(0);
}
const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")).uncovered : [];
const novas = uncovered.filter((r) => !baseline.includes(r));
if (novas.length) { console.error("Rotas novas sem E2E (adicione um spec que visite a rota):\n" + novas.join("\n")); process.exit(1); }
const resolvidas = baseline.filter((r) => !uncovered.includes(r));
if (resolvidas.length) console.log(`✔ ${resolvidas.length} rota(s) passaram a ter E2E: rode --update para encolher a baseline.`);
