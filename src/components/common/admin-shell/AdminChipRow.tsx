import { Chip, Stack } from '@mui/material';
import type { AdminChipRowProps } from './chipRow.types';

/** Linha de chips de metadados do cartão (tipo, período, data de criação...). */
export default function AdminChipRow({ testId, chips }: AdminChipRowProps) {
  return (
    <Stack data-testid={testId} direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          data-testid={chip.testId}
          icon={chip.icon}
          label={chip.label}
          size="small"
          color={chip.color ?? 'default'}
          variant={chip.color && chip.color !== 'default' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
      ))}
    </Stack>
  );
}
