import { AiProviderHealthStatus } from './types';
import type { AiProviderHealthResult } from './types';

export type HealthSeverity = 'success' | 'warning' | 'error';

/** Gravidade do alerta do "Testar conexão". */
export function healthSeverity(result: AiProviderHealthResult): HealthSeverity {
  if (result.ok) return 'success';
  if (
    result.status === AiProviderHealthStatus.MODEL_MISSING ||
    result.status === AiProviderHealthStatus.NO_KEY ||
    result.status === AiProviderHealthStatus.UNREADABLE_KEY
  )
    return 'warning';
  return 'error';
}

const numberFormat = new Intl.NumberFormat('pt-BR');

/** 12.345 → "12.345"; negativo, NaN ou ausente → "0". */
export function formatCount(value: number | null | undefined): string {
  return numberFormat.format(Number.isFinite(value) && (value as number) > 0 ? (value as number) : 0);
}

/** 1500 → "1,5 s"; menos de 1 s → "850 ms". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
}
