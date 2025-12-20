import React from 'react';
import { Card, CardContent, Typography, IconButton, Button, Box, Chip, CardActions, Tooltip } from '@mui/material';
import { Visibility, Delete, Public } from '@mui/icons-material';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import { truncate } from '../utils';
import { motion } from 'framer-motion';
import { useTheme, useMediaQuery } from '@mui/material';

interface Props {
  page: IdeasPageData;
  onView: () => void;
  onDelete: () => void;
}

export default function IdeasPageCard({ page, onView, onDelete }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      sx={{
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          borderColor: 'primary.main',
        },
      }}
    >
      {/* Header with Delete Button */}
      <Box
        sx={{
          position: 'relative',
          p: { xs: 1.5, sm: 2 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        {page.public && (
          <Chip
            icon={<Public fontSize="small" />}
            label="Público"
            size="small"
            color="success"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              height: { xs: 24, sm: 28 },
              fontWeight: 600,
            }}
          />
        )}
        <Tooltip title="Excluir página">
          <IconButton
            onClick={onDelete}
            sx={{
              position: 'absolute',
              top: { xs: 8, sm: 12 },
              right: { xs: 8, sm: 12 },
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.lighter',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
            size={isMobile ? 'small' : 'medium'}
            aria-label={`Excluir página ${page.title}`}
          >
            <Delete fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            lineHeight: 1.3,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {page.title}
        </Typography>

        {page.subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              fontWeight: 500,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textAlign: 'center',
              fontSize: { xs: '0.875rem', sm: '0.9rem' },
            }}
          >
            {page.subtitle}
          </Typography>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
            mb: 2,
            textAlign: 'center',
            fontSize: { xs: '0.8rem', sm: '0.85rem' },
          }}
        >
          {truncate(page.description, 100)}
        </Typography>
      </CardContent>

      <CardActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          pt: 0,
          gap: 1,
        }}
      >
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={onView}
          fullWidth
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: { xs: 1, sm: 1.25 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
            transition: 'all 0.2s ease',
          }}
          aria-label={`Ver detalhes da página ${page.title}`}
        >
          {isMobile ? 'Ver' : 'Ver Detalhes'}
        </Button>
      </CardActions>
    </Card>
  );
}
