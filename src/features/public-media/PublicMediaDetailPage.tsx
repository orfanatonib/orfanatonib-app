import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import PageRenderer from '@/components/PageRenderer/PageRenderer';

import { PUBLIC_MEDIA_BASE_PATH, PUBLIC_MEDIA_ENTITY_BY_KIND, PublicMediaKind } from './constants';

interface Props {
  kind: PublicMediaKind;
}

/** Página pública de uma coleção, por id: abre mesmo com login, sem desvio para a Área do Membro. */
const PublicMediaDetailPage: React.FC<Props> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to={PUBLIC_MEDIA_BASE_PATH} replace />;
  return (
    <PageRenderer
      key={`${kind}-${id}`}
      entityType={PUBLIC_MEDIA_ENTITY_BY_KIND[kind]}
      idToFetch={id}
    />
  );
};

export default PublicMediaDetailPage;
