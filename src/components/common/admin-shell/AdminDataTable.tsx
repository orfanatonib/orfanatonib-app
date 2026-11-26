import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { ADMIN_SORT_FILTER_KEY } from './constants';
import { splitSort } from './listQuery';
import type { AdminTableColumn, UseAdminListResult } from './types';

interface Props<TItem> {
  testIdPrefix: string;
  columns: AdminTableColumn<TItem>[];
  items: TItem[];
  rowKey: (item: TItem) => string;
  list: Pick<UseAdminListResult<TItem>, 'filters' | 'setFilter'>;
}

/** Próximo valor de `sort` ao clicar numa coluna: nova coluna começa ASC; a mesma alterna. */
export function nextSort(current: string | undefined, sortKey: string): string {
  const { sortBy, order } = splitSort(current);
  if (sortBy === sortKey) return `${sortKey}:${order === 'ASC' ? 'DESC' : 'ASC'}`;
  return `${sortKey}:ASC`;
}

/** Tabela do desktop: cabeçalho com ordenação no servidor e linhas sem altura variável. */
export default function AdminDataTable<TItem>({
  testIdPrefix,
  columns,
  items,
  rowKey,
  list,
}: Props<TItem>) {
  const sort = list.filters[ADMIN_SORT_FILTER_KEY];
  const { sortBy, order } = splitSort(sort);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, width: "100%", minWidth: 0, contain: "inline-size" }}>
      <Table size="small" data-testid={`${testIdPrefix}-table`} sx={{ tableLayout: 'auto' }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align}
                sx={{ width: column.width, fontWeight: 700, whiteSpace: 'nowrap' }}
                sortDirection={column.sortKey && sortBy === column.sortKey ? (order === 'ASC' ? 'asc' : 'desc') : false}
              >
                {column.sortKey ? (
                  <TableSortLabel
                    data-testid={`${testIdPrefix}-sort-${column.sortKey}`}
                    active={sortBy === column.sortKey}
                    direction={sortBy === column.sortKey && order === 'ASC' ? 'asc' : 'desc'}
                    onClick={() =>
                      list.setFilter(ADMIN_SORT_FILTER_KEY, nextSort(sort, column.sortKey as string))
                    }
                  >
                    {column.header}
                  </TableSortLabel>
                ) : (
                  column.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const id = rowKey(item);
            return (
              <TableRow key={id} hover data-testid={`${testIdPrefix}-row-${id}`}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    data-testid={`${testIdPrefix}-cell-${column.key}-${id}`}
                    sx={{ verticalAlign: 'middle' }}
                  >
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
