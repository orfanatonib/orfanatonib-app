/** Data curta (`dd/mm/aaaa`) de um ISO da API; vazio ou inválido vira `null`. */
export function formatAdminDate(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR');
}
