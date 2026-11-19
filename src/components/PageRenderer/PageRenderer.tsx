import IdeasPageView from 'pages/PageView/IdeasMaterialViewpage/IdeasPageView';
import PageGalleryView from 'pages/PageView/ImagePageView/ImagePageView';
import PageVideoView from 'pages/PageView/VideoViewPage/PageVideoView';
import VisitMaterialsPageView from 'pages/PageView/VisitMaterialViewPage/VisitMaterialsPageView';
import ShelterPageView from 'pages/PageView/ShelterPageView/ShelterPageView';
import React from 'react';
import NotFoundPage from '@/pages/NotFound/NotFoundPage';
import { FeatureFlagKeys, FeatureFlagRoute } from '@/features/feature-flags';
import { MediaTargetType } from 'store/slices/types';

interface PageRendererProps {
  entityType: string;
  idToFetch: string;
}

const PageRenderer: React.FC<PageRendererProps> = ({ entityType, idToFetch }) => {
  switch (entityType) {
    case MediaTargetType.ImagesPage:
      return <PageGalleryView idToFetch={idToFetch} />;
    case MediaTargetType.VideosPage:
      return (
        <FeatureFlagRoute featureKey={FeatureFlagKeys.PUBLIC_VIDEOS}>
          <PageVideoView idToFetch={idToFetch} />
        </FeatureFlagRoute>
      );
    case MediaTargetType.VisitMaterialsPage:
      return <VisitMaterialsPageView idToFetch={idToFetch} />;
    case MediaTargetType.IdeasPage:
      return <IdeasPageView idToFetch={idToFetch} />;
    case MediaTargetType.ShelterPage:
      return (
        <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_PAGES}>
          <ShelterPageView idToFetch={idToFetch} />
        </FeatureFlagRoute>
      );
    default:
      // Tipo que o front não conhece: 404, nunca um texto técnico na tela.
      return <NotFoundPage />;
  }
};

export default PageRenderer;
