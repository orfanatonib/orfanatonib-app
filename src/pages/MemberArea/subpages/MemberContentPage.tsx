import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import PageRenderer from '@/components/PageRenderer/PageRenderer';
import { MEMBER_CONTENT_PAGE_BASE_PATH } from '../constants/navigation';

interface MemberContentPageProps {
  entityType: string;
}

/** Página de conteúdo aberta por id dentro da casca: `/area-do-membro/<seção>/:id`. */
const MemberContentPage: React.FC<MemberContentPageProps> = ({ entityType }) => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to={MEMBER_CONTENT_PAGE_BASE_PATH[entityType]} replace />;
  // `key` remonta a página ao trocar de item (a rota é a mesma, só o id muda).
  return <PageRenderer key={`${entityType}-${id}`} entityType={entityType} idToFetch={id} />;
};

export default MemberContentPage;
