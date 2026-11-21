import { Box, CardContent, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { MediaItem } from 'store/slices/types';
import { getMediaPreviewUrl } from 'utils/getMediaPreviewUrl';
import { INITIAL_THUMBNAILS } from '@/features/image-pages/constants';
import { ImageWithSkeleton, PlatformIcon } from './SectionImageParts';

interface SectionThumbnailsProps {
  caption: string;
  thumbnails: MediaItem[];
  totalCount: number;
  showAll: boolean;
  hoveredImage: number | null;
  onHover: (index: number | null) => void;
  onOpen: (index: number) => void;
  onShowAll: () => void;
}

export default function SectionThumbnails({
  caption,
  thumbnails,
  totalCount,
  showAll,
  hoveredImage,
  onHover,
  onOpen,
  onShowAll,
}: SectionThumbnailsProps) {
  return (
    <CardContent
      data-testid="image-section-thumbnails"
      sx={{ p: { xs: 2, md: 3 } }}
    >
      <Grid container spacing={1.5}>
        {thumbnails.map((item, index) => {
          const src = getMediaPreviewUrl(item);
          const actualIndex = index + 1;

          return (
            <Grid item xs={4} sm={2} md={2} key={item.id || index}>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: { xs: 2, md: 3 },
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform:
                      hoveredImage === actualIndex ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={() => onHover(actualIndex)}
                  onMouseLeave={() => onHover(null)}
                >
                  <ImageWithSkeleton
                    src={src || ''}
                    alt={`${caption} - ${actualIndex + 1}`}
                    onClick={() => onOpen(actualIndex)}
                    sx={{
                      width: '100%',
                      height: { xs: 70, sm: 90, md: 110 },
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  <motion.div
                    animate={{
                      scale: hoveredImage === actualIndex ? 1.2 : 1,
                      rotate: hoveredImage === actualIndex ? 5 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        borderRadius: 1,
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <PlatformIcon platform={item.platformType} />
                    </Box>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredImage === actualIndex ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(76, 175, 80, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      Ver Imagem
                    </Typography>
                  </motion.div>
                </Box>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {totalCount > 1 + INITIAL_THUMBNAILS && !showAll && (
        <Box textAlign="center" mt={3}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Typography
              variant="button"
              color="primary"
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: { xs: '0.85rem', md: '0.9rem' },
                fontWeight: 'bold',
              }}
              onClick={() => onShowAll()}
            >
              Ver todas as {totalCount} imagens
            </Typography>
          </motion.div>
        </Box>
      )}
    </CardContent>
  );
}
