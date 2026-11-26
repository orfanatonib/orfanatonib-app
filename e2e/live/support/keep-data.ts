/**
 * REGRA DE MASSA DO E2E (decisão do usuário)
 *
 * 1. Cada cenário faz o CRUD completo da feature (criar, ler, editar, apagar) e prova no banco E no S3
 *    que nada ficou órfão (objeto sem linha, linha sem objeto). Apagar dentro do CRUD é teste, não limpeza.
 * 2. Além disso, TODA execução deixa massa: de 5 a 10 registros novos por feature (`massCount()`),
 *    criados pela UI quando existe tela, senão pela API. Ficam no banco e acumulam a cada rodada.
 *    Massa com mídia fica consistente (linha + objeto no S3), nunca órfã.
 * 3. O que um cenário cria e não apaga no próprio CRUD também fica: por padrão nenhuma limpeza de dados.
 *    `E2E_CLEANUP=1` liga a limpeza (CI efêmero). Restaurar flags/estado e fechar o banco acontecem sempre.
 *
 * Todo dado leva o `RUN_TAG` da execução, então nunca colide e nenhum spec pode assumir banco vazio.
 */
export const CLEANUP_ENABLED = process.env.E2E_CLEANUP === "1";
export const KEEP_DATA = !CLEANUP_ENABLED;

export const MASS_MIN = 5;
export const MASS_MAX = 10;

/**
 * Quantos registros de massa a execução cria por feature: sorteio entre 5 e 10, ou o valor fixo de
 * `E2E_MASS_COUNT` (limitado a 5..10) para runs reproduzíveis.
 */
export function massCount(): number {
  const fixed = Number(process.env.E2E_MASS_COUNT);
  if (Number.isInteger(fixed) && fixed > 0) return Math.min(MASS_MAX, Math.max(MASS_MIN, fixed));
  return MASS_MIN + Math.floor(Math.random() * (MASS_MAX - MASS_MIN + 1));
}

/** Roda a limpeza de dados só quando ela está ligada (`E2E_CLEANUP=1`). */
export async function cleanupData(run: () => Promise<void>): Promise<void> {
  if (CLEANUP_ENABLED) await run();
}
