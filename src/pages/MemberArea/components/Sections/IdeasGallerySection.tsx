import { useVisibleRoutes } from '@/features/feature-flags';
import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/slices';
import { MediaTargetType } from '@/store/slices/types';
import { MemberGalleryGrid } from '../Gallery';
import { MEMBER_IDEAS_COPY } from '../../constants/sections';
import { MEMBER_NAV_ITEMS } from '../../constants/navigation';
import { MemberNavItemId } from '../../types/navigation';
import type { MemberGalleryItem } from '../../types/gallery';
import { buildMemberContentPath } from '../../utils/navigation';

const ACCENT = MEMBER_NAV_ITEMS.find((item) => item.id === MemberNavItemId.Ideas)?.accentColor ?? '#9333ea';

const IdeasGallerySection: React.FC = () => {
  const navigate = useNavigate();
  const routes = useVisibleRoutes();
  const loading = useSelector((state: RootState) => state.routes.loading);

  const ideaRoutes = useMemo(
    () => routes.filter((route) => route.entityType === MediaTargetType.IdeasPage),
    [routes],
  );
  const items = useMemo<MemberGalleryItem[]>(
    () =>
      ideaRoutes.map((route) => ({
        id: route.id,
        title: route.title,
        description: route.subtitle || route.description,
        imageUrl: route.image,
      })),
    [ideaRoutes],
  );

  const handleSelect = (id: string) => {
    const route = ideaRoutes.find((candidate) => candidate.id === id);
    const target = route ? buildMemberContentPath(MediaTargetType.IdeasPage, route.idToFetch) : null;
    if (target) navigate(target);
  };

  return (
    <Box data-testid="member-ideas-section">
      <MemberGalleryGrid
        items={items}
        loading={loading && ideaRoutes.length === 0}
        testIdPrefix="member-ideas"
        searchLabel={MEMBER_IDEAS_COPY.SEARCH}
        emptyMessage={MEMBER_IDEAS_COPY.EMPTY}
        accentColor={ACCENT}
        onSelect={handleSelect}
      />
    </Box>
  );
};

export default IdeasGallerySection;
