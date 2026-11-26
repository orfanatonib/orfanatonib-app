import React from 'react';
import { Box, Card, CardMedia, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import type { SectionData } from '@/features/image-pages/types';
import { formatDateTime } from '@/features/image-pages/utils';
import SectionHeader from './SectionHeader';
import SectionThumbnails from './SectionThumbnails';
import SectionLightbox from './SectionLightbox';
import { useSectionGallery } from './useSectionGallery';

export interface SectionItemProps extends Omit<SectionData, 'id' | 'public'> {}

const SectionImagePageView: React.FC<SectionItemProps> = ({
  caption,
  description,
  mediaItems,
  createdAt,
  updatedAt,
}) => {
  const theme = useTheme();
  const gallery = useSectionGallery(mediaItems);

  if (gallery.items.length === 0) return null;

  const created = createdAt ? formatDateTime(createdAt) : null;
  const updated = updatedAt ? formatDateTime(updatedAt) : null;

  return (
    <motion.div
      data-testid="image-section-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ marginBottom: theme.spacing(4) }}
    >
      <Card
        elevation={6}
        sx={{
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
          border: `2px solid ${theme.palette.success.main}20`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: theme.palette.success.main,
            boxShadow: `0 20px 40px ${theme.palette.success.main}20`,
          },
        }}
      >
        <SectionHeader
          caption={caption}
          description={description}
          mediaCount={gallery.items.length}
          created={created}
          updated={updated}
        />

        {gallery.heroSrc && (
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
            >
              <CardMedia
                component="img"
                image={gallery.heroSrc}
                alt={caption || 'Imagem principal'}
                data-testid="image-section-hero"
                onClick={() => gallery.open(0)}
                sx={{
                  height: { xs: 250, sm: 350, md: 450 },
                  objectFit: 'cover',
                  cursor: 'pointer',
                  transition: 'transform 0.6s ease',
                }}
              />
            </motion.div>

            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                pointerEvents: 'none',
              }}
            />
          </Box>
        )}

        {gallery.thumbnails.length > 0 && (
          <SectionThumbnails
            caption={caption}
            thumbnails={gallery.thumbnails}
            totalCount={gallery.items.length}
            showAll={gallery.showAll}
            hoveredImage={gallery.hoveredImage}
            onHover={gallery.setHoveredImage}
            onOpen={gallery.open}
            onShowAll={gallery.setShowAll}
          />
        )}

        <SectionLightbox
          open={gallery.openModal}
          caption={caption}
          mediaItems={gallery.items}
          startIndex={gallery.startIndex}
          onClose={gallery.close}
        />
      </Card>
    </motion.div>
  );
};

export default SectionImagePageView;
