import { Box, IconButton, Modal } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import type { MediaItem } from 'store/slices/types';
import { getMediaPreviewUrl } from 'utils/getMediaPreviewUrl';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface SectionLightboxProps {
  open: boolean;
  caption: string;
  mediaItems: MediaItem[];
  startIndex: number;
  onClose: () => void;
}

export default function SectionLightbox({
  open,
  caption,
  mediaItems,
  startIndex,
  onClose,
}: SectionLightboxProps) {
  return (
    <Modal
      data-testid="image-section-lightbox"
      open={open}
      onClose={() => onClose()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            width: '90vw',
            height: '90vh',
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <IconButton
            data-testid="image-section-lightbox-close"
            aria-label="Fechar"
            onClick={() => onClose()}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'white',
              zIndex: 10,
              backdropFilter: 'blur(8px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Swiper
            modules={[Navigation, Pagination, EffectCoverflow]}
            navigation
            pagination={{ clickable: true }}
            effect="coverflow"
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: true,
            }}
            initialSlide={startIndex}
            style={{ width: '100%', height: '100%' }}
          >
            {mediaItems.map((item, index) => {
              const src = getMediaPreviewUrl(item);
              return (
                <SwiperSlide key={item.id || index}>
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      component="img"
                      src={src || ''}
                      alt={`${caption} - ${index + 1}`}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </Box>
      </motion.div>
    </Modal>
  );
}
