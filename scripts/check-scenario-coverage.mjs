#!/usr/bin/env node
/**
 * Gate de cobertura de cenários: cada ID das matrizes (`e2e/scenarios/*.json`,
 * geradas dos planos por feature) precisa ter um teste cujo título comece com
 * `[<id>#caso]` ou `[<id>]` (Playwright em `e2e/live`, Vitest em `src`, Jest na API).
 *
 *   node scripts/check-scenario-coverage.mjs                 # relatório + falha em ID desconhecido
 *   node scripts/check-scenario-coverage.mjs --unit=team     # exige 100% da unidade
 *   node scripts/check-scenario-coverage.mjs --strict        # exige 100% de todas
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = new Set(process.argv.slice(2));
const unitArg = [...args].find((a) => a.startsWith("--unit="))?.split("=")[1];
const strict = args.has("--strict");

const scenarioDir = join(root, "e2e/scenarios");
const scenarios = new Map(); // id -> unit
for (const file of readdirSync(scenarioDir).filter((f) => f.endsWith(".json"))) {
  const data = JSON.parse(readFileSync(join(scenarioDir, file), "utf8"));
  for (const id of data.scenarios) scenarios.set(id, data.unit);
}

// Cenários de atomicidade (falha injetada + rollback) são testes de integração da API, escritos no repositório da API.
// No CI do app o repositório irmão não existe: ali esses IDs não são exigidos (só quando a API está ao lado,
// como no desenvolvimento local, onde a conta fecha em 100%).
const API_INTEGRATION_CASE = /#(falha-do-colaborador-sem-efeito-parcial|rollback-de-transacao)$/;
if (!existsSync(join(root, "../orfanatonib-api/src"))) {
  let skipped = 0;
  for (const id of [...scenarios.keys()]) {
    if (API_INTEGRATION_CASE.test(id)) {
      scenarios.delete(id);
      skipped += 1;
    }
  }
  if (skipped) console.log(`(repositório da API ausente: ${skipped} cenários de integração da API não são exigidos aqui)\n`);
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(spec|test)\.tsx?$/.test(name)) acc.push(p);
  }
  return acc;
}

const roots = [join(root, "e2e/live"), join(root, "src"), join(root, "../orfanatonib-api/src"), join(root, "../orfanatonib-api/test")];
const covered = new Set();
const unknown = new Set();
const TITLE = /\[([a-z0-9-]+(?:\.[a-z0-9-]+)+(?:#[a-z0-9-]+)?)\]/g;
for (const r of roots) {
  let files = [];
  try { files = walk(r); } catch { continue; }
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(TITLE)) {
      const id = m[1];
      if (scenarios.has(id)) covered.add(id);
      else if (/^[a-z-]+\.(get|post|put|patch|delete|s3)\./.test(id) || id.includes("#")) unknown.add(`${id}  (${f.replace(root, ".")})`);
    }
  }
}

const byUnit = new Map();
for (const [id, unit] of scenarios) {
  const e = byUnit.get(unit) ?? { total: 0, done: 0 };
  e.total += 1;
  if (covered.has(id)) e.done += 1;
  byUnit.set(unit, e);
}
let failed = false;
console.log("unidade".padEnd(30), "cobertos/total");
for (const [unit, e] of [...byUnit].sort()) console.log(unit.padEnd(30), `${e.done}/${e.total}`);
if (unknown.size > 0) {
  failed = true;
  console.error(`\nIDs de teste que não existem em nenhuma matriz (${unknown.size}):\n${[...unknown].join("\n")}`);
}
const required = strict ? [...byUnit.keys()] : unitArg ? [unitArg] : [];
for (const unit of required) {
  const e = byUnit.get(unit);
  if (!e) { failed = true; console.error(`unidade desconhecida: ${unit}`); continue; }
  if (e.done < e.total) {
    failed = true;
    const missing = [...scenarios].filter(([id, u]) => u === unit && !covered.has(id)).map(([id]) => id);
    console.error(`\n${unit}: faltam ${e.total - e.done} cenários\n${missing.slice(0, 40).join("\n")}${missing.length > 40 ? "\n…" : ""}`);
  }
}
process.exit(failed ? 1 : 0);
