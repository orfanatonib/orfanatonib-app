import { createConnection } from "mysql2/promise";

import { dbConfig } from "./env";

/**
 * Único caminho de ESCRITA direta no banco dos E2E: promover alguém a admin.
 *
 * A API nunca concede `admin` (cadastro, `POST/PUT /users`, complete-register),
 * então os testes que precisam de um admin descartável criam a conta como
 * membro pela API e a promovem aqui, como se faria em produção (UPDATE manual).
 * `dbConfig()` já recusa qualquer host que não seja a máquina local.
 */
export async function promoteToAdminInDb(userId: string): Promise<void> {
  const { host, port, user, password, database } = dbConfig();
  const connection = await createConnection({ host, port, user, password, database });
  try {
    const [result] = await connection.execute("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);
    const affected = (result as { affectedRows: number }).affectedRows;
    if (affected !== 1) throw new Error(`Promoção a admin afetou ${affected} linhas (esperado 1) para ${userId}.`);
  } finally {
    await connection.end();
  }
}
