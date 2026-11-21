/** Mesmo limite visual do selo das outras filas: acima do máximo vira "99+". */
export function clampBadgeCount(count: number, max: number): string {
  return count > max ? `${max}+` : String(count);
}
