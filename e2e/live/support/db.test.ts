import { describe, expect, it } from "vitest";

import { assertIdentifier, assertSelectOnly } from "./sql-guards";
import { assertLocalHost, parseDotenv } from "./env";

describe("db.ts é somente leitura", () => {
  it("aceita um SELECT", () => {
    expect(() => assertSelectOnly("SELECT 1")).not.toThrow();
    expect(() => assertSelectOnly("  select * from t where a = ? ; ")).not.toThrow();
  });
  it.each(["DELETE FROM t", "UPDATE t SET a=1", "INSERT INTO t VALUES (1)", "DROP TABLE t", "SELECT 1; DELETE FROM t", "TRUNCATE t"])(
    "recusa %s",
    (sql) => expect(() => assertSelectOnly(sql)).toThrow(),
  );
  it("recusa identificador com SQL embutido", () => {
    expect(() => assertIdentifier("media_items")).not.toThrow();
    expect(() => assertIdentifier("t; DROP TABLE x")).toThrow();
    expect(() => assertIdentifier("a`b")).toThrow();
  });
});

describe("env dos E2E", () => {
  it("só aceita host local", () => {
    expect(() => assertLocalHost("localhost", "x")).not.toThrow();
    expect(() => assertLocalHost("127.0.0.1", "x")).not.toThrow();
    expect(() => assertLocalHost("db.prod.exemplo.com", "x")).toThrow("só rodam contra a máquina local");
  });
  it("lê dotenv simples sem executar nada", () => {
    expect(parseDotenv("A=1\n# c\nB=\"x y\"\nC='z'\n bad line")).toEqual({ A: "1", B: "x y", C: "z" });
  });
});
