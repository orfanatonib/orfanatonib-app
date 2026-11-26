import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import { PersonOutline as PersonIcon } from '@mui/icons-material';
import { MediaType, type MediaItem } from '@/store/slices/types';
import { MEMBER_CARD_SX } from '@/pages/MemberArea/constants/navigation';
import VisitVideoPlayerView from '@/pages/PageView/VisitMaterialViewPage/VisitVideoPlayerView';
import VisitDocumentViewer from '@/pages/PageView/VisitMaterialViewPage/VisitDocumentViewer';
import VisitImageGalleryView from '@/pages/PageView/VisitMaterialViewPage/VisitImageGalleryView';
import { IDEAS_MEDIA_GRID_MIN_WIDTH, IDEAS_VIEW_COPY } from '../constants';
import type { IdeaSectionCardProps } from '../types';
import { groupSectionMedias, mediaKey } from '../utils';
import UserInfoModal from './UserInfoModal';

const renderMedia = (mediaType: MediaType, media: MediaItem): React.ReactNode => {
  switch (mediaType) {
    case MediaType.VIDEO:
      return <VisitVideoPlayerView video={media} />;
    case MediaType.DOCUMENT:
      return <VisitDocumentViewer document={media} />;
    case MediaType.IMAGE:
      return <VisitImageGalleryView image={media} />;
    default:
      return null;
  }
};

/** Uma seção da página de ideias: título, descrição, autor e as mídias agrupadas por tipo. */
const IdeaSectionCard: React.FC<IdeaSectionCardProps> = ({ section, index }) => {
  const [authorOpen, setAuthorOpen] = useState(false);
  const groups = useMemo(() => groupSectionMedias(section.medias ?? []), [section.medias]);
  const { user } = section;
  // `data-testid` estável: usa o id da seção (nunca a posição na lista).
  const testIdBase = section.id ? `idea-section-${section.id}` : 'idea-section';

  return (
    <Paper data-testid={testIdBase} elevation={0} sx={MEMBER_CARD_SX}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography component="h4" variant="h6" fontWeight={800} color="#0f2942">
            {section.title}
          </Typography>
          {section.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
              {section.description}
            </Typography>
          )}
        </Box>

        {user && (
          <Button
            data-testid={`${testIdBase}-author`}
            variant="outlined"
            size="small"
            startIcon={<PersonIcon />}
            onClick={() => setAuthorOpen(true)}
            sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
          >
            {`${IDEAS_VIEW_COPY.SHARED_BY} ${user.name}`}
          </Button>
        )}
      </Box>

      {groups.length === 0 ? (
        <Typography data-testid={`${testIdBase}-empty`} variant="body2" color="text.secondary">
          {IDEAS_VIEW_COPY.EMPTY_SECTION}
        </Typography>
      ) : (
        groups.map(({ mediaType, label, icon: Icon, color, items }) => (
          <Box key={mediaType} data-testid={`${testIdBase}-${mediaType}`} sx={{ mt: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color }}>
              <Icon fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="#0f2942">
                {label}
              </Typography>
              <Chip label={items.length} size="small" sx={{ bgcolor: color, color: 'white', height: 20, fontWeight: 700 }} />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${IDEAS_MEDIA_GRID_MIN_WIDTH}px), 1fr))`,
              }}
            >
              {items.map((media, mediaIndex) => (
                <Box key={mediaKey(media, index, mediaIndex)}>{renderMedia(mediaType, media)}</Box>
              ))}
            </Box>
          </Box>
        ))
      )}

      {user && (
        <UserInfoModal
          open={authorOpen}
          onClose={() => setAuthorOpen(false)}
          user={user}
          ideaTitle={section.title}
        />
      )}
    </Paper>
  );
};

export default IdeaSectionCard;
