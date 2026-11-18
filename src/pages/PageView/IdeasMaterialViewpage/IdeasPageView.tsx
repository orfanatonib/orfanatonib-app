import { useSelector } from 'react-redux';
import { Container, Stack } from '@mui/material';
import { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { useIdeasPage } from './hooks';
import { EmptyState, ErrorState, IdeaSectionCard, IdeasPageHeader, LoadingState } from './components';
import type { IdeaSectionView } from './types';

interface IdeasPageViewProps {
  idToFetch: string;
}

/** Página de ideias (`/area-do-membro/ideias/:id`): cabeçalho + uma seção por cartão. */
export default function IdeasPageView({ idToFetch }: IdeasPageViewProps) {
  const {
    ideasPage,
    loading,
    error,
    isDeleting,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeletePage,
    handleEdit,
    handleBack,
  } = useIdeasPage({ idToFetch });

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  let content: React.ReactNode;
  if (loading) {
    content = <LoadingState />;
  } else if (error) {
    content = <ErrorState message={error} />;
  } else if (!ideasPage) {
    content = <EmptyState />;
  } else {
    content = (
      <>
        <Stack data-testid="ideas-page" spacing={{ xs: 2, md: 3 }}>
          <IdeasPageHeader
            title={ideasPage.title}
            subtitle={ideasPage.subtitle}
            description={ideasPage.description}
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={() => setDeleteConfirmOpen(true)}
          />
          {ideasPage.sections.map((section, index) => (
            <IdeaSectionCard
              key={section.id ?? index}
              section={section as IdeaSectionView}
              index={index}
            />
          ))}
        </Stack>

        <DeleteConfirmDialog
          open={deleteConfirmOpen}
          title={ideasPage.title}
          onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
          onConfirm={async () => {
            if (isDeleting) return;
            await handleDeletePage();
          }}
          loading={isDeleting}
        />
      </>
    );
  }

  return (
    <Container maxWidth="lg" disableGutters sx={{ px: 0 }}>
      {content}
    </Container>
  );
}
