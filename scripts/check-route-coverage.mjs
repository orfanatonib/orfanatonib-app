#!/usr/bin/env node
/**
 * Toda rota de `src/routes/{public,member,admin}Routes.tsx` precisa ser visitada por pelo menos um spec de
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
// As rotas vivem em src/routes (plano 01, T5.1); a ordem importa: /adm vem por último.
const ROUTE_FILES = ["publicRoutes.tsx", "memberRoutes.tsx", "adminRoutes.tsx"];
const body = ROUTE_FILES.map((f) => readFileSync(join(root, "src/routes", f), "utf8")).join("\n");

const routes = [];
const lines = body.split("\n");
const stack = []; // ancestrais por indentação: { indent, path }
for (let i = 0; i < lines.length; i++) {
  const open = /^(\s*)<Route\b/.exec(lines[i]);
  if (!open) continue;
  const indent = open[1].length;
  while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
  // o `path` fica na própria linha ou nas duas seguintes, antes de `element=`
  const head = lines.slice(i, i + 3).join(" ");
  const m = /\bpath="([^"]+)"/.exec(head.split("element=")[0]);
  const raw = m && !/\$\{/.test(m[1]) ? m[1] : "";
  const parent = stack.length ? stack[stack.length - 1].full : "";
  const full = raw ? (raw.startsWith("/") ? raw : `${parent}/${raw}`) : parent;
  stack.push({ indent, full });
  if (raw && raw !== "*") routes.push(full);
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
