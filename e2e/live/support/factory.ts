/**
 * Dados do cenário: criados **pela API** e apagados pelo próprio cenário.
 * Cada execução tem um `RUN_TAG` único para nenhum dado colidir nem sobrar.
 */
export const RUN_TAG = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

type Cleanup = { label: string; run: () => Promise<void> };

export class Cleaner {
  private readonly stack: Cleanup[] = [];

  /** Registra como desfazer o que foi criado (executa em ordem inversa). */
  track(label: string, run: () => Promise<void>): void {
    this.stack.push({ label, run });
  }

  /** Executa tudo; falhas não interrompem a limpeza, mas são reportadas no fim. */
  async run(): Promise<void> {
    const errors: string[] = [];
    for (const item of this.stack.splice(0).reverse()) {
      try {
        await item.run();
      } catch (error) {
        errors.push(`${item.label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (errors.length > 0) throw new Error(`Falha na limpeza dos dados do E2E:\n${errors.join("\n")}`);
  }
}

/** Nome único e legível por cenário (`<tag>-<rótulo>`). */
export const tagged = (label: string): string => `${RUN_TAG}-${label}`;
