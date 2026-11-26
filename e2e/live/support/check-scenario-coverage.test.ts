import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

/**
 * Teste do próprio gate (plano 02, §7): remover um teste de uma matriz faz o `check-scenario-coverage` falhar,
 * e um teste com ID que não existe em nenhuma matriz também. A árvore de fixture é montada num diretório
 * temporário e o script roda de verdade (`--root=`), sem tocar nas matrizes reais.
 */
const SCRIPT = resolve(__dirname, "../../../scripts/check-scenario-coverage.mjs");
const dirs: string[] = [];

function fixture(scenarios: string[], specs: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "scenario-gate-"));
  dirs.push(root);
  mkdirSync(join(root, "e2e/scenarios"), { recursive: true });
  writeFileSync(join(root, "e2e/scenarios/demo.json"), JSON.stringify({ unit: "demo", scenarios }));
  for (const [file, body] of Object.entries(specs)) {
    const full = join(root, "e2e/live", file);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

const run = (root: string, ...flags: string[]): { code: number | null; out: string } => {
  const result = spawnSync(process.execPath, [SCRIPT, `--root=${root}`, ...flags], { encoding: "utf8" });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
};

const IDS = ["demo.get.items#feliz", "demo.post.items#validacao"];
const spec = (...ids: string[]): string => ids.map((id) => `test("[${id}] caso", () => {});`).join("\n");

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("check-scenario-coverage", () => {
  it("passa e reporta 2/2 quando cada ID da matriz tem teste", () => {
    const { code, out } = run(fixture(IDS, { "demo/a.api.spec.ts": spec(...IDS) }), "--unit=demo");
    expect(code).toBe(0);
    expect(out).toContain("2/2");
  });

  it("falha na unidade exigida quando um teste foi removido da matriz coberta", () => {
    const { code, out } = run(fixture(IDS, { "demo/a.api.spec.ts": spec(IDS[0]) }), "--unit=demo");
    expect(code).toBe(1);
    expect(out).toContain("demo: faltam 1 cenários");
    expect(out).toContain(IDS[1]);
  });

  it("falha no modo --strict com cobertura parcial, mas só reporta (exit 0) sem exigir a unidade", () => {
    const root = fixture(IDS, { "demo/a.api.spec.ts": spec(IDS[0]) });
    expect(run(root, "--strict").code).toBe(1);
    const relaxed = run(root);
    expect(relaxed.code).toBe(0);
    expect(relaxed.out).toContain("1/2");
  });

  it("falha quando um teste cita um ID inexistente em qualquer matriz", () => {
    const { code, out } = run(fixture(IDS, { "demo/a.api.spec.ts": spec(...IDS, "demo.get.fantasma#feliz") }));
    expect(code).toBe(1);
    expect(out).toContain("demo.get.fantasma#feliz");
  });

  it("não julga títulos de features sem matriz (outro esquema de rótulo)", () => {
    const { code } = run(fixture(IDS, { "demo/a.api.spec.ts": spec(...IDS, "feed.ui#mobile", "t8.1#aviso") }));
    expect(code).toBe(0);
  });

  it("falha ao exigir uma unidade que não existe", () => {
    const { code, out } = run(fixture(IDS, { "demo/a.api.spec.ts": spec(...IDS) }), "--unit=outra");
    expect(code).toBe(1);
    expect(out).toContain("unidade desconhecida: outra");
  });

  it("ignora no app os cenários de integração da API quando o repositório irmão não existe", () => {
    const withApiOnly = [...IDS, "demo.post.items#rollback-de-transacao"];
    const { code, out } = run(fixture(withApiOnly, { "demo/a.api.spec.ts": spec(...IDS) }), "--unit=demo");
    expect(code).toBe(0);
    expect(out).toContain("2/2");
  });
});
