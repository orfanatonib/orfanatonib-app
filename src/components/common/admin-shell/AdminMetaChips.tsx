import { Chip, Stack } from '@mui/material';
import type { ReactElement } from 'react';

interface MetaChip {
  key: string;
  label: string;
  testId?: string;
  icon?: ReactElement;
}

/** Linha de chips de metadados do cartão (compatível com os cartões que só passam `chips`). */
export default function AdminMetaChips({ chips, testId }: { chips: MetaChip[]; testId?: string }) {
  return (
    <Stack data-testid={testId} direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
      {chips.map((chip) => (
        <Chip key={chip.key} data-testid={chip.testId} icon={chip.icon} label={chip.label} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      ))}
    </Stack>
  );
}
