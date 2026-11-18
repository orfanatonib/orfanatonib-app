/** Guardas **puras** do acesso ao banco nos E2E (testadas em unitário).*/
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertSelectOnly(sql: string): void {
  const normalized = sql.trim().replace(/;+\s*$/, "");
  if (!/^select\s/i.test(normalized) || normalized.includes(";")) {
    throw new Error("db.ts só executa um único SELECT.");
  }
}

export function assertIdentifier(value: string): string {
  if (!IDENTIFIER.test(value)) throw new Error(`Identificador SQL inválido: ${value}`);
  return value;
}
