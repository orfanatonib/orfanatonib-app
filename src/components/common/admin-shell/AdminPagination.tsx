import { Box, Pagination, Typography } from '@mui/material';
import type { AdminPaginationProps } from './types';

/** Resumo "1–12 de 30"; sem itens, "0 itens". */
export function paginationSummary(page: number, pageSize: number, total: number): string {
  if (total === 0) return '0 itens';
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  return `${first}–${last} de ${total}`;
}

/** Paginação padrão. Sempre ocupa o mesmo espaço (com ou sem várias páginas). */
export default function AdminPagination({
  testIdPrefix,
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: AdminPaginationProps) {
  const root = `${testIdPrefix}-pagination`;
  return (
    <Box
      data-testid={root}
      sx={{
        mt: 3,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography data-testid={`${root}-summary`} variant="body2" color="text.secondary">
        {paginationSummary(page, pageSize, total)}
      </Typography>
      <Pagination
        count={Math.max(1, totalPages)}
        page={page}
        onChange={(_, next) => onChange(next)}
        color="primary"
        shape="rounded"
        siblingCount={0}
        hidePrevButton={false}
        hideNextButton={false}
        showFirstButton
        showLastButton
        getItemAriaLabel={(type, itemPage) => {
          if (type === 'previous') return 'Página anterior';
          if (type === 'next') return 'Próxima página';
          if (type === 'first') return 'Primeira página';
          if (type === 'last') return 'Última página';
          return `Ir para a página ${itemPage}`;
        }}
        data-testid={`${root}-pages`}
      />
    </Box>
  );
}
