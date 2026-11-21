import { useSelector } from 'react-redux';
import { Button, Container, Stack } from '@mui/material';
import { DeleteOutline as DeleteIcon, EditOutlined as EditIcon, LightbulbOutlined as IdeasIcon } from '@mui/icons-material';
import { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { useIdeasPage } from './hooks';
import {
  PAGE_VIEW_MIN_TOUCH_TARGET,
  PageViewEmpty,
  PageViewError,
  PageViewHero,
  PageViewLoading,
  PageViewType,
  formatCountLabel,
} from '@/components/common/page-view';
import { IdeaSectionCard } from './components';
import { IDEAS_VIEW_COPY, IDEAS_VIEW_TEST_IDS } from './constants';
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
    content = <PageViewLoading type={PageViewType.IDEAS} testId={IDEAS_VIEW_TEST_IDS.LOADING} cardCount={2} />;
  } else if (error) {
    content = <PageViewError testId={IDEAS_VIEW_TEST_IDS.ERROR} message={error} />;
  } else if (!ideasPage) {
    content = <PageViewEmpty testId={IDEAS_VIEW_TEST_IDS.EMPTY} heading={IDEAS_VIEW_COPY.EMPTY} />;
  } else {
    content = (
      <>
        <Stack data-testid="ideas-page" spacing={{ xs: 2, md: 3 }}>
          <PageViewHero
            type={PageViewType.IDEAS}
            icon={IdeasIcon}
            title={ideasPage.title}
            subtitle={ideasPage.subtitle}
            description={ideasPage.description}
            chips={[
              {
                key: 'sections',
                label: formatCountLabel(ideasPage.sections.length, IDEAS_VIEW_COPY.IDEA, IDEAS_VIEW_COPY.IDEAS),
              },
            ]}
            onBack={handleBack}
            backLabel={IDEAS_VIEW_COPY.BACK}
            testIds={{
              root: IDEAS_VIEW_TEST_IDS.HEADER,
              back: IDEAS_VIEW_TEST_IDS.BACK,
              title: IDEAS_VIEW_TEST_IDS.TITLE,
            }}
            actions={
              isAdmin ? (
                <>
                  <Button
                    data-testid={IDEAS_VIEW_TEST_IDS.EDIT}
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    sx={{ minHeight: PAGE_VIEW_MIN_TOUCH_TARGET, textTransform: 'none', fontWeight: 600, bgcolor: 'common.white', color: 'secondary.dark', '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    {IDEAS_VIEW_COPY.EDIT}
                  </Button>
                  <Button
                    data-testid={IDEAS_VIEW_TEST_IDS.DELETE}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteConfirmOpen(true)}
                    sx={{ minHeight: PAGE_VIEW_MIN_TOUCH_TARGET, textTransform: 'none', fontWeight: 600 }}
                  >
                    {IDEAS_VIEW_COPY.DELETE}
                  </Button>
                </>
              ) : undefined
            }
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
