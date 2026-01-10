import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Tooltip,
  useMediaQuery,
  Chip,
  Stack,
} from '@mui/material';
import { Delete, Visibility, Image as ImageIcon, Edit as EditIcon, Public, Lock } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { truncate } from '../utils';
import { useTheme } from '@mui/material/styles';

interface Props {
  section: SectionData;
  onDelete: (section: SectionData) => void;
  onEdit: (section: SectionData) => void;
  onViewDetails: (section: SectionData) => void;
}

export default function ImagePageCard({ section, onDelete, onEdit, onViewDetails }: Props) {
  const preview = section.mediaItems?.[0]?.url;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          transition: 'all 0.3s ease',
          '&:hover': { 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            borderColor: '#3b82f6',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            bgcolor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt={section.caption || 'Miniatura'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageIcon fontSize="large" color="disabled" />
          )}

          <Chip
            icon={section.public ? <Public fontSize="small" /> : <Lock fontSize="small" />}
            label={section.public ? 'Público' : 'Privado'}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: section.public ? 'success.main' : 'error.main',
              color: 'white',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              height: { xs: 24, sm: 28 },
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: 'white',
                fontSize: '0.8rem',
              },
            }}
          />

          <Chip
            label={`${section.mediaItems?.length || 0} ${section.mediaItems?.length === 1 ? 'imagem' : 'imagens'}`}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              height: { xs: 24, sm: 28 },
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          />

          <Tooltip title="Excluir galeria">
            <IconButton
              size="small"
              onClick={() => onDelete(section)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': { 
                  bgcolor: 'error.dark',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
                boxShadow: 2,
              }}
              aria-label="Excluir galeria"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 2.5 }, pb: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: { xs: '0.9rem', md: '1rem' },
              lineHeight: 1.4,
              mb: 1,
            }}
            title={section.caption || 'Sem Título'}
          >
            {section.caption || 'Sem Título'}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: { xs: '0.8rem', md: '0.85rem' },
              lineHeight: 1.4,
            }}
            title={section.description}
          >
            {truncate(section.description)}
          </Typography>
        </CardContent>

        <CardActions
          sx={{
            p: { xs: 1.5, md: 2 },
            pt: 0,
            gap: { xs: 1, md: 1.5 },
            flexDirection: 'column',
          }}
        >
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={1}
            sx={{ width: '100%' }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<Visibility fontSize="small" />}
              onClick={() => onViewDetails(section)}
              fullWidth
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '0.75rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 0.75 },
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
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => onEdit(section)}
              fullWidth
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '0.75rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 0.75 },
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
                transition: 'all 0.2s ease',
              }}
            >
              Editar
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </motion.div>
  );
}
