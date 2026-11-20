import { Box, Chip, Stack, Typography } from '@mui/material';

import type { VisitMaterialCategoryView } from '@/features/visit-materials/utils';
import type { VisitMaterialCategory } from '@/features/visit-materials/types';

interface VisitCategorySelectorProps {
  categories: readonly VisitMaterialCategoryView[];
  active: VisitMaterialCategory;
  onChange: (category: VisitMaterialCategory) => void;
}

/** Categorias do material como uma fileira rolável de botões (só o nome da categoria, sem idade). */
export default function VisitCategorySelector({ categories, active, onChange }: VisitCategorySelectorProps) {
  return (
    <Box
      role="tablist"
      aria-label="Categorias do material"
      data-testid="visit-material-category-selector"
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
        mx: { xs: -0.5, sm: 0 },
        px: { xs: 0.5, sm: 0 },
        scrollbarWidth: 'thin',
      }}
    >
      {categories.map((category) => {
        const selected = category.category === active;
        return (
          <Chip
            key={category.category}
            role="tab"
            aria-selected={selected}
            data-testid={`visit-material-category-${category.category}`}
            clickable
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'filled' : 'outlined'}
            onClick={() => onChange(category.category)}
            sx={{ height: 44, borderRadius: 22, px: 0.5, flexShrink: 0, fontWeight: 700 }}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{category.label}</span>
                <Typography component="span" variant="caption" sx={{ opacity: 0.8 }}>
                  {category.totalMedia > 0 ? category.totalMedia : ''}
                </Typography>
              </Stack>
            }
          />
        );
      })}
    </Box>
  );
}
