import { Box, Container, IconButton, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  ADMIN_HEADING_COLOR,
  ADMIN_LABELS,
  ADMIN_SHELL_FRAME_WIDTH,
  ADMIN_SHELL_MAX_WIDTH_NARROW,
  ADMIN_SHELL_TEST_ID_SUFFIX,
  ADMIN_TOUCH_TARGET_PX,
} from './constants';
import type { AdminPageShellProps } from './types';
import { buildAdminTestId } from './utils';

/** Casca única das telas administrativas: fundo, largura e linha voltar+título. */
export default function AdminPageShell({
  testId,
  title,
  onBack,
  actions,
  fluid = true,
  children,
}: AdminPageShellProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <Box
      data-testid={testId}
      sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 1.5, md: 4 } }}
    >
      <Container
        data-testid={buildAdminTestId(testId, ADMIN_SHELL_TEST_ID_SUFFIX.FRAME)}
        maxWidth={fluid ? false : ADMIN_SHELL_MAX_WIDTH_NARROW}
        sx={
          fluid
            ? {
                width: ADMIN_SHELL_FRAME_WIDTH,
                px: 0,
                // Centraliza mesmo quando o frame é mais largo que o pai (padding do <main>).
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)',
              }
            : { px: { xs: 1.5, sm: 2, md: 3 } }
        }
      >
        <Box
          sx={{
            mb: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
          }}
        >
          <IconButton
            aria-label={ADMIN_LABELS.BACK_ARIA}
            data-testid={buildAdminTestId(testId, ADMIN_SHELL_TEST_ID_SUFFIX.BACK)}
            onClick={handleBack}
            sx={{
              width: ADMIN_TOUCH_TARGET_PX,
              height: ADMIN_TOUCH_TARGET_PX,
              flexShrink: 0,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            component="h1"
            data-testid={buildAdminTestId(testId, ADMIN_SHELL_TEST_ID_SUFFIX.HEADING)}
            fontWeight={700}
            sx={{
              flex: 1,
              minWidth: 0,
              color: ADMIN_HEADING_COLOR,
              fontSize: { xs: '1.25rem', sm: '2rem' },
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </Typography>
          {actions ? (
            <Box
              data-testid={buildAdminTestId(testId, ADMIN_SHELL_TEST_ID_SUFFIX.ACTIONS)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
            >
              {actions}
            </Box>
          ) : null}
        </Box>
        {children}
      </Container>
    </Box>
  );
}
