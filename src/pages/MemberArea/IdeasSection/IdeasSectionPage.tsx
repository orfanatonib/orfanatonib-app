import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Container } from '@mui/material';
import { IdeasSectionAdminEditor, IdeasSectionUserCreator } from '@/components/Adm/PageCreator/Templates/IdeasSectionEditor';
import {
  IDEAS_SECTION_MESSAGES,
  readEditSectionId,
  useIdeasSectionToEdit,
} from '@/features/ideas-sections';
import { MEMBER_SUBPAGE_PATHS } from '@/pages/MemberArea/constants/navigation';

const ADMIN_LIST_PATH = '/adm/ideias-compartilhadas';

export const IDEAS_SECTION_PAGE_TEST_IDS = {
  LOADING: 'ideas-section-edit-loading',
  ERROR: 'ideas-section-edit-error',
  MISSING: 'ideas-section-edit-missing',
  BACK: 'ideas-section-edit-back',
} as const;

export default function IdeasSectionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicCreation = location.pathname === MEMBER_SUBPAGE_PATHS.shareIdea;
  const sectionId = isPublicCreation ? null : readEditSectionId(location.search);
  const { section, loading, error } = useIdeasSectionToEdit(sectionId);

  useEffect(() => {
    document.title = isPublicCreation ? 'Compartilhar Ideia Incrível' : 'Editar Seção de Ideias';
  }, [isPublicCreation]);

  if (isPublicCreation) {
    return <IdeasSectionUserCreator />;
  }

  const backButton = (
    <Button
      data-testid={IDEAS_SECTION_PAGE_TEST_IDS.BACK}
      variant="outlined"
      onClick={() => navigate(ADMIN_LIST_PATH)}
      sx={{ mt: 2, minHeight: 44 }}
    >
      Voltar para as ideias
    </Button>
  );

  if (!sectionId) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert data-testid={IDEAS_SECTION_PAGE_TEST_IDS.MISSING} severity="info">
          {IDEAS_SECTION_MESSAGES.MISSING_ID}
        </Alert>
        {backButton}
      </Container>
    );
  }

  if (loading) {
    return (
      <Box data-testid={IDEAS_SECTION_PAGE_TEST_IDS.LOADING} sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !section) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert data-testid={IDEAS_SECTION_PAGE_TEST_IDS.ERROR} severity="error">
          {error || IDEAS_SECTION_MESSAGES.LOAD_ONE_FAILED}
        </Alert>
        {backButton}
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 0, mb: 0, minWidth: '100%' }}>
      <IdeasSectionAdminEditor existingSection={section} />
    </Container>
  );
}
