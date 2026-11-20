import { useState } from 'react';
import { Box, Chip, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { VideoLibrary, Description, Image, Audiotrack } from '@mui/icons-material';

import {
  VISIT_MATERIAL_CATEGORY_HINTS,
  VISIT_MATERIAL_CATEGORY_LABELS,
  VISIT_MATERIAL_CATEGORY_ORDER,
} from '@/features/visit-materials/constants';
import {
  VisitMaterialCategory,
  VisitMaterialCategoryDraft,
  VisitMaterialCategoryDrafts,
} from '@/features/visit-materials/types';
import { categoryDraftMediaCount } from '@/features/visit-materials/utils';
import { PAGE_PAPER_SX } from '../shared/styles';
import { VISIT_TABS_SX } from './constants';
import VisitAudios from './VisitAudios';
import VisitDocuments from './VisitDocuments';
import VisitImages from './VisitImages';
import VisitVideos from './VisitVideos';

interface VisitCategoriesEditorProps {
  drafts: VisitMaterialCategoryDrafts;
  onChange: (category: VisitMaterialCategory, draft: VisitMaterialCategoryDraft) => void;
}

const SECTION_DESCRIPTION_MAX_LENGTH = 2000;

/**
 * Materiais por categoria: "Geral" (padrão, vale para todas as faixas) e uma seção para cada faixa etária.
 * Cada categoria tem suas quatro listas de mídia; as faixas etárias aceitam também título e descrição próprios.
 */
export default function VisitCategoriesEditor({ drafts, onChange }: VisitCategoriesEditorProps) {
  const [category, setCategory] = useState<VisitMaterialCategory>(VisitMaterialCategory.GENERAL);
  const [tab, setTab] = useState(0);
  const draft = drafts[category];
  const patch = (changes: Partial<VisitMaterialCategoryDraft>) => onChange(category, { ...draft, ...changes });
  const isGeneral = category === VisitMaterialCategory.GENERAL;

  return (
    <Paper elevation={2} sx={PAGE_PAPER_SX}>
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        📚 Materiais de Visita
      </Typography>

      <Box
        role="tablist"
        aria-label="Categoria dos materiais"
        data-testid="visit-material-page-editor-categories"
        sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 2 }}
      >
        {VISIT_MATERIAL_CATEGORY_ORDER.map((item) => {
          const count = categoryDraftMediaCount(drafts[item]);
          const selected = item === category;
          return (
            <Chip
              key={item}
              role="tab"
              aria-selected={selected}
              data-testid={`visit-material-page-editor-category-${item}`}
              clickable
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => {
                setCategory(item);
                setTab(0);
              }}
              sx={{ height: 44, borderRadius: 22, flexShrink: 0, fontWeight: 700 }}
              label={`${VISIT_MATERIAL_CATEGORY_LABELS[item]}${count > 0 ? ` · ${count}` : ''}`}
            />
          );
        })}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} data-testid="visit-material-page-editor-category-hint">
        {VISIT_MATERIAL_CATEGORY_LABELS[category]} · {VISIT_MATERIAL_CATEGORY_HINTS[category]}
        {isGeneral ? ' É onde ficam os materiais que valem para todos (e o que já existia antes das categorias).' : ' Deixe vazio se esta faixa não tem material.'}
      </Typography>

      {!isGeneral && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Título da seção (opcional)"
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
            inputProps={{ maxLength: 180, 'data-testid': 'visit-material-page-editor-section-title' }}
            fullWidth
          />
          <TextField
            label="Descrição da seção (opcional)"
            value={draft.description}
            onChange={(event) => patch({ description: event.target.value })}
            inputProps={{ maxLength: SECTION_DESCRIPTION_MAX_LENGTH, 'data-testid': 'visit-material-page-editor-section-description' }}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      )}

      <Tabs
        data-testid="visit-material-page-editor-media-tabs"
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={VISIT_TABS_SX}
      >
        <Tab icon={<VideoLibrary />} iconPosition="start" label={`Vídeos${draft.videos.length ? ` (${draft.videos.length})` : ''}`} />
        <Tab icon={<Description />} iconPosition="start" label={`Documentos${draft.documents.length ? ` (${draft.documents.length})` : ''}`} />
        <Tab icon={<Image />} iconPosition="start" label={`Imagens${draft.images.length ? ` (${draft.images.length})` : ''}`} />
        <Tab icon={<Audiotrack />} iconPosition="start" label={`Áudios${draft.audios.length ? ` (${draft.audios.length})` : ''}`} />
      </Tabs>

      <Box sx={{ minHeight: 300 }}>
        {tab === 0 && <VisitVideos key={category} videos={draft.videos} setVideos={(videos) => patch({ videos })} />}
        {tab === 1 && <VisitDocuments key={category} documents={draft.documents} setDocuments={(documents) => patch({ documents })} />}
        {tab === 2 && <VisitImages key={category} images={draft.images} setImages={(images) => patch({ images })} />}
        {tab === 3 && <VisitAudios key={category} audios={draft.audios} setAudios={(audios) => patch({ audios })} />}
      </Box>
    </Paper>
  );
}
