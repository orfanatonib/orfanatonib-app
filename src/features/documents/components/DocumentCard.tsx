import React from 'react';
import { Paper, Box, Typography, IconButton, Stack, Tooltip, Card, CardContent, CardActions } from '@mui/material';
import { Visibility, Edit, Delete, Info } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme, useMediaQuery } from '@mui/material';
import { DocumentItem } from '../types';

export interface DocumentCardProps {
  document: DocumentItem;
  onPreviewFile: (doc: DocumentItem) => void;
  onViewDetails: (doc: DocumentItem) => void;
  onEdit: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPreviewFile,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
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
          }}
        >
          {document.name}
        </Typography>
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
            fontSize: { xs: '0.8rem', sm: '0.85rem' },
          }}
          title={document.description}
        >
          {document.description || 'Sem descrição'}
        </Typography>
      </CardContent>

      <CardActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          pt: 0,
          gap: { xs: 0.5, sm: 1 },
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <Tooltip title="Visualizar">
          <IconButton
            color="primary"
            onClick={() => onPreviewFile(document)}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '&:hover': {
                bgcolor: 'primary.lighter',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Visibility fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Detalhes">
          <IconButton
            color="info"
            onClick={() => onViewDetails(document)}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '&:hover': {
                bgcolor: 'info.lighter',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Info fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Editar">
          <IconButton
            color="warning"
            onClick={() => onEdit(document)}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '&:hover': {
                bgcolor: 'warning.lighter',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Edit fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Excluir">
          <IconButton
            color="error"
            onClick={() => onDelete(document)}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '&:hover': {
                bgcolor: 'error.lighter',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Delete fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default DocumentCard;
