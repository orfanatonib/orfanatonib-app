import { splitSort } from '@/components/common/admin-shell';

/** Próxima ordenação ao clicar numa coluna: inverte se já é a atual, senão começa por A–Z. */
export function nextSortValue(current: string, column: string): string {
  const { sortBy, order } = splitSort(current);
  if (sortBy === column) return `${column}:${order === 'ASC' ? 'DESC' : 'ASC'}`;
  return `${column}:ASC`;
}
