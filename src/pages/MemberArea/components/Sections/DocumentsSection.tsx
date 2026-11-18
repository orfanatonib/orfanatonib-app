import React, { useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/config/axiosConfig';
import { RootState } from '@/store/slices';
import { clearDocumentData, setDocumentData } from 'store/slices/documents/documentSlice';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';
import { MemberGalleryGrid } from '../Gallery';
import { MEMBER_DOCUMENTS_COPY, MEMBER_DOCUMENT_ENTITY_TYPE } from '../../constants/sections';
import { MemberNavItemId } from '../../types/navigation';
import { MEMBER_NAV_ITEMS } from '../../constants/navigation';
import type { MemberGalleryItem } from '../../types/gallery';

const ACCENT = MEMBER_NAV_ITEMS.find((item) => item.id === MemberNavItemId.Documents)?.accentColor ?? '#0284c7';

const DocumentsSection: React.FC = () => {
  const dispatch = useDispatch();
  const documentData = useSelector((state: RootState) => state.document.documentData);
  const routes = useSelector((state: RootState) => state.routes.routes);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentRoutes = useMemo(
    () => routes.filter((route) => route.entityType === MEMBER_DOCUMENT_ENTITY_TYPE),
    [routes],
  );
  const items = useMemo<MemberGalleryItem[]>(
    () =>
      documentRoutes.map((route) => ({
        id: route.id,
        title: route.title,
        description: route.description,
        imageUrl: null,
      })),
    [documentRoutes],
  );

  const handleSelect = async (id: string) => {
    const route = documentRoutes.find((candidate) => candidate.id === id);
    if (!route) return;
    try {
      setError(null);
      const response = await api.get(`/documents/${route.idToFetch}`);
      dispatch(setDocumentData(response.data));
      setOpenModal(true);
    } catch {
      setError(MEMBER_DOCUMENTS_COPY.LOAD_FAILED);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    dispatch(clearDocumentData());
  };

  return (
    <Box data-testid="member-documents-section">
      {error && (
        <Alert data-testid="member-documents-error" severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <MemberGalleryGrid
        items={items}
        testIdPrefix="member-documents"
        searchLabel={MEMBER_DOCUMENTS_COPY.SEARCH}
        emptyMessage={MEMBER_DOCUMENTS_COPY.EMPTY}
        accentColor={ACCENT}
        onSelect={handleSelect}
      />
      <MediaDocumentPreviewModal
        open={openModal}
        onClose={handleCloseModal}
        media={documentData?.media || null}
        title={documentData?.name}
      />
    </Box>
  );
};

export default DocumentsSection;
