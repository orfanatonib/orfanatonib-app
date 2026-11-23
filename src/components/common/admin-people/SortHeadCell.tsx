import { TableCell, TableSortLabel } from '@mui/material';
import type { SortHeadCellProps } from './types';

/** Cabeçalho de coluna ordenável: o clique pede a ordenação ao servidor. */
export default function SortHeadCell({ label, testId, active, direction, onClick, width }: SortHeadCellProps) {
  return (
    <TableCell
      sx={{
        width,
        bgcolor: 'background.default',
        fontWeight: 600,
        borderBottom: '2px solid',
        borderColor: 'divider',
      }}
      sortDirection={active ? direction : false}
    >
      <TableSortLabel active={active} direction={direction} onClick={onClick} data-testid={testId}>
        {label}
      </TableSortLabel>
    </TableCell>
  );
}
