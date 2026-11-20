import { Box, Chip, Typography } from '@mui/material';

import {
  VISIT_MATERIAL_CATEGORY_LABELS,
  VISIT_MATERIAL_SECTION_CATEGORIES,
} from '../constants';
import { VisitMaterialSectionCategory } from '../types';

interface VisitCategoryFilterProps {
  value: VisitMaterialSectionCategory | undefined;
  onChange: (category: VisitMaterialSectionCategory | undefined) => void;
  testIdPrefix: string;
}

/** Filtro por categoria: "Todas as faixas" ou uma faixa etária (só páginas que têm seção dela). Fileira rolável, alvo de 44 px. */
export default function VisitCategoryFilter({ value, onChange, testIdPrefix }: VisitCategoryFilterProps) {
  return (
    <Box sx={{ mt: 2 }} data-testid={`${testIdPrefix}-category-filter`}>
      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
        Filtrar por categoria:
      </Typography>
      <Box role="group" aria-label="Filtrar por categoria" sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
        <Chip
          data-testid={`${testIdPrefix}-category-all`}
          label="Todas as faixas"
          clickable
          color={value === undefined ? 'primary' : 'default'}
          variant={value === undefined ? 'filled' : 'outlined'}
          onClick={() => onChange(undefined)}
          sx={{ height: 44, borderRadius: 22, flexShrink: 0, fontWeight: 600 }}
        />
        {VISIT_MATERIAL_SECTION_CATEGORIES.map((category) => (
          <Chip
            key={category}
            data-testid={`${testIdPrefix}-category-${category}`}
            label={VISIT_MATERIAL_CATEGORY_LABELS[category]}
            clickable
            color={value === category ? 'primary' : 'default'}
            variant={value === category ? 'filled' : 'outlined'}
            onClick={() => onChange(value === category ? undefined : category)}
            sx={{ height: 44, borderRadius: 22, flexShrink: 0, fontWeight: 600 }}
          />
        ))}
      </Box>
    </Box>
  );
}
