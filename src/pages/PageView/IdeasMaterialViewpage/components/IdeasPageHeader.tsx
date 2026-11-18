import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';
import { MEMBER_CARD_SX } from '@/pages/MemberArea/constants/navigation';
import { IDEAS_VIEW_COPY } from '../constants';
import type { IdeasPageHeaderProps } from '../types';

/** Cabeçalho da página de ideias: voltar, título, subtítulo, descrição e ações de admin. */
export default function IdeasPageHeader({
  title,
  subtitle,
  description,
  isAdmin,
  onBack,
  onEdit,
  onDelete,
}: IdeasPageHeaderProps) {
  return (
    <Paper data-testid="ideas-page-header" elevation={0} sx={MEMBER_CARD_SX}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Button
          data-testid="ideas-page-back"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ ml: -1, minHeight: 44, textTransform: 'none', fontWeight: 600 }}
        >
          {IDEAS_VIEW_COPY.BACK}
        </Button>

        {isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button
              data-testid="ideas-page-edit"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onEdit}
              sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
            >
              {IDEAS_VIEW_COPY.EDIT}
            </Button>
            <Button
              data-testid="ideas-page-delete"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
              sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
            >
              {IDEAS_VIEW_COPY.DELETE}
            </Button>
          </Stack>
        )}
      </Box>

      <Typography data-testid="ideas-page-title" component="h3" variant="h5" fontWeight={800} color="#0f2942">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 760 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
}
