import {
  Card, CardContent, Typography, IconButton, Button, Box, Chip,
  useMediaQuery, useTheme, Tooltip, CardActions
} from '@mui/material';
import { Visibility, Delete, Public, Lock, Edit, Star } from '@mui/icons-material';
import { VisitMaterialPageData } from 'store/slices/visit-material/visitMaterialSlice';
import { truncate } from '../../visit-materials/utils';
import { motion } from 'framer-motion';

interface Props {
  material: VisitMaterialPageData;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetAsCurrent?: () => void;
}

export default function VisitMaterialCard({
  material, onView, onEdit, onDelete, onSetAsCurrent,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isPublic = material.route.public;

  return (
    <Card
        component={motion.div}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        sx={{
          flex: 1,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
            borderColor: 'primary.main',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          }}
        >
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap', flex: 1 }}>
            <Tooltip title={isPublic ? 'Público' : 'Privado'}>
              <Chip
                icon={isPublic ? <Public fontSize="small" /> : <Lock fontSize="small" />}
                label={isPublic ? 'Público' : 'Privado'}
                size="small"
                sx={{
                  bgcolor: isPublic ? 'success.main' : 'error.main',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                }}
              />
            </Tooltip>
            {material.testament && (
              <Chip
                label={material.testament === 'OLD_TESTAMENT' ? (isMobile ? '📖 AT' : '📖 Antigo Testamento') : (isMobile ? '✝️ NT' : '✝️ Novo Testamento')}
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={onDelete}
            aria-label="Excluir material"
            sx={{
              color: 'error.main',
              flexShrink: 0,
              '&:hover': {
                bgcolor: 'error.lighter',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            <Delete fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>

        <CardContent sx={{ p: { xs: 2, sm: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            {material.title}
          </Typography>

          {material.subtitle && (
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
              }}
            >
              {material.subtitle}
            </Typography>
          )}

          {material.description && (
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
              }}
            >
              {truncate(material.description)}
            </Typography>
          )}

          {material.currentWeek && (
            <Box sx={{ mb: 2 }}>
              <Chip
                icon={<Star />}
                label="Material Atual"
                color="primary"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ p: { xs: 1.5, sm: 2 }, pt: 0, gap: { xs: 0.5, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' } }}>
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
          >
            Ver
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={onEdit}
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: { xs: 1, sm: 1.25 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Editar
          </Button>
        </CardActions>

        {!material.currentWeek && onSetAsCurrent && (
          <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } }}>
            <Button
              variant="text"
              fullWidth
              onClick={onSetAsCurrent}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'primary.main',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 0.75, sm: 1 },
                '&:hover': {
                  bgcolor: 'primary.lighter',
                },
              }}
            >
              ⭐ Tornar material atual
            </Button>
          </Box>
        )}
      </Card>
  );
}
