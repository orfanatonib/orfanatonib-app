import { describe, expect, it } from "vitest";

import { Cleaner, RUN_TAG, tagged } from "./factory";

describe("Cleaner", () => {
  it("desfaz em ordem inversa à da criação", async () => {
    const order: string[] = [];
    const cleaner = new Cleaner();
    cleaner.track("a", async () => void order.push("a"));
    cleaner.track("b", async () => void order.push("b"));
    cleaner.track("c", async () => void order.push("c"));
    await cleaner.run();
    expect(order).toEqual(["c", "b", "a"]);
  });

  it("uma falha não interrompe a limpeza e é reportada no fim, com o rótulo", async () => {
    const order: string[] = [];
    const cleaner = new Cleaner();
    cleaner.track("primeiro", async () => void order.push("primeiro"));
    cleaner.track("quebra", async () => {
      throw new Error("boom");
    });
    cleaner.track("ultimo", async () => void order.push("ultimo"));
    await expect(cleaner.run()).rejects.toThrow(/quebra: boom/);
    expect(order).toEqual(["ultimo", "primeiro"]);
  });

  it("não executa a mesma limpeza duas vezes", async () => {
    let runs = 0;
    const cleaner = new Cleaner();
    cleaner.track("x", async () => void (runs += 1));
    await cleaner.run();
    await cleaner.run();
    expect(runs).toBe(1);
  });
});

describe("RUN_TAG / tagged", () => {
  it("o nome fica prefixado pela tag da execução", () => {
    expect(tagged("abrigo")).toBe(`${RUN_TAG}-abrigo`);
    expect(RUN_TAG).toMatch(/^e2e-[a-z0-9]+-[a-z0-9]+$/);
  });
});
