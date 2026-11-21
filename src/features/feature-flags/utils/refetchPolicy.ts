export interface RefetchPolicyInput {
  /** A aba está visível agora. */
  visible: boolean;
  /** Quando o mapa foi lido pela última vez (`null` = nunca: o boot cuida disso). */
  lastFetched: number | null;
  now: number;
  minIntervalMs: number;
}

/** Só relê quando a aba voltou, o boot já leu o mapa e a leitura ficou velha. */
export function shouldRefetchFlags({
  visible,
  lastFetched,
  now,
  minIntervalMs,
}: RefetchPolicyInput): boolean {
  if (!visible || lastFetched === null) return false;
  return now - lastFetched >= minIntervalMs;
}
