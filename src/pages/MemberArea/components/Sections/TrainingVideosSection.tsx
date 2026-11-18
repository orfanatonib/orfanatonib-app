import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MediaTargetType } from '@/store/slices/types';
import { selectVideoRoutes } from '@/store/selectors/routeSelectors';
import { MemberGalleryGrid } from '../Gallery';
import { MEMBER_VIDEOS_COPY } from '../../constants/sections';
import { MEMBER_NAV_ITEMS } from '../../constants/navigation';
import { MemberNavItemId } from '../../types/navigation';
import type { MemberGalleryItem } from '../../types/gallery';
import { buildMemberContentPath } from '../../utils/navigation';

const ACCENT = MEMBER_NAV_ITEMS.find((item) => item.id === MemberNavItemId.Videos)?.accentColor ?? '#4f46e5';

const TrainingVideosSection: React.FC = () => {
  const navigate = useNavigate();
  const videoRoutes = useSelector(selectVideoRoutes);

  const items = useMemo<MemberGalleryItem[]>(
    () =>
      videoRoutes.map((route) => ({
        id: route.id,
        title: route.title,
        description: route.subtitle || route.description,
        imageUrl: route.image,
      })),
    [videoRoutes],
  );

  const handleSelect = (id: string) => {
    const route = videoRoutes.find((candidate) => candidate.id === id);
    const target = route ? buildMemberContentPath(MediaTargetType.VideosPage, route.idToFetch) : null;
    if (target) navigate(target);
  };

  return (
    <Box data-testid="member-videos-section">
      <MemberGalleryGrid
        items={items}
        testIdPrefix="member-videos"
        searchLabel={MEMBER_VIDEOS_COPY.SEARCH}
        emptyMessage={MEMBER_VIDEOS_COPY.EMPTY}
        accentColor={ACCENT}
        onSelect={handleSelect}
      />
    </Box>
  );
};

export default TrainingVideosSection;
