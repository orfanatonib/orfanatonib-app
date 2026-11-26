import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  MEMBER_GALLERY_COPY,
  MEMBER_GALLERY_IMAGE_HEIGHT,
  MEMBER_GALLERY_MIN_CARD_WIDTH,
  MEMBER_GALLERY_PAGE_SIZE,
} from '../../constants/gallery';
import { MEMBER_CARD_SX } from '../../constants/navigation';
import type { MemberGalleryGridProps } from '../../types/gallery';
import { filterGalleryItems, sliceGalleryItems } from '../../utils/gallery';

interface GalleryCardImageProps {
  imageUrl: string | null;
  accentColor: string;
}

/** Imagem do cartão; se faltar ou não carregar, cai numa faixa com o acento da seção. */
const GalleryCardImage: React.FC<GalleryCardImageProps> = ({ imageUrl, accentColor }) => {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) return <Box sx={{ height: 6, bgcolor: accentColor }} />;
  return (
    <CardMedia
      component="img"
      image={imageUrl}
      alt=""
      onError={() => setFailed(true)}
      sx={{ height: MEMBER_GALLERY_IMAGE_HEIGHT, objectFit: 'cover' }}
    />
  );
};

/** Galeria padrão das subpáginas: busca, grade responsiva de cartões e "Mostrar mais". */
const MemberGalleryGrid: React.FC<MemberGalleryGridProps> = ({
  items,
  testIdPrefix,
  searchLabel,
  emptyMessage,
  accentColor,
  onSelect,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(MEMBER_GALLERY_PAGE_SIZE);

  const filtered = useMemo(() => filterGalleryItems(items, search), [items, search]);
  const { visible, hasMore } = useMemo(
    () => sliceGalleryItems(filtered, visibleCount),
    [filtered, visibleCount],
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setVisibleCount(MEMBER_GALLERY_PAGE_SIZE);
  };

  if (loading) {
    return (
      <Box data-testid={`${testIdPrefix}-loading`} sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Carregando" />
      </Box>
    );
  }

  return (
    <Paper data-testid={`${testIdPrefix}-gallery`} elevation={0} sx={MEMBER_CARD_SX}>
      {items.length > 0 && (
        <TextField
          fullWidth
          size="small"
          label={searchLabel}
          value={search}
          onChange={handleSearch}
          inputProps={{ 'data-testid': `${testIdPrefix}-search` }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2.5 }}
        />
      )}

      {items.length === 0 ? (
        <Typography data-testid={`${testIdPrefix}-empty`} variant="body2" color="text.secondary" textAlign="center" py={4}>
          {emptyMessage}
        </Typography>
      ) : filtered.length === 0 ? (
        <Typography data-testid={`${testIdPrefix}-no-results`} variant="body2" color="text.secondary" textAlign="center" py={4}>
          {MEMBER_GALLERY_COPY.NO_RESULTS}
        </Typography>
      ) : (
        <Box
          data-testid={`${testIdPrefix}-grid`}
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${MEMBER_GALLERY_MIN_CARD_WIDTH}px), 1fr))`,
          }}
        >
          {visible.map((item) => (
            <Card
              key={item.id}
              data-testid={`${testIdPrefix}-card-${item.id}`}
              variant="outlined"
              sx={{ borderRadius: 2.5, borderColor: '#dbe4f0', '&:hover': { borderColor: accentColor } }}
            >
              <CardActionArea
                onClick={() => onSelect(item.id)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
              >
                <GalleryCardImage imageUrl={item.imageUrl} accentColor={accentColor} />
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#0f2942" sx={{ lineHeight: 1.3, mb: 0.75 }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.description || MEMBER_GALLERY_COPY.NO_DESCRIPTION}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
          <Button
            data-testid={`${testIdPrefix}-show-more`}
            variant="outlined"
            onClick={() => setVisibleCount((count) => count + MEMBER_GALLERY_PAGE_SIZE)}
            sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
          >
            {MEMBER_GALLERY_COPY.SHOW_MORE}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default MemberGalleryGrid;
