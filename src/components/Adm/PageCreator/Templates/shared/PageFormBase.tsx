import { Box, Container, IconButton, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { PAGE_FORM_TEST_IDS } from './constants';
import type { PageFormBaseProps } from './types';
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning';

/** Casca dos criadores de página: fundo, container, voltar e título. */
export default function PageFormBase({
  heading,
  onBack,
  testId,
  fluid = true,
  warnOnUnsavedChanges = false,
  isDirty = false,
  children,
}: PageFormBaseProps) {
  useUnsavedChangesWarning(warnOnUnsavedChanges, isDirty);

  return (
    <Box
      data-testid={testId}
      sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, md: 4 } }}
    >
      <Container
        {...(fluid
          ? {
              maxWidth: false as const,
              sx: { width: { xs: '98%', md: '95%' }, mx: 'auto', px: { xs: 1, md: 2 } },
            }
          : { maxWidth: 'lg' as const })}
      >
        <Box
          sx={{
            mb: { xs: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
          }}
        >
          <IconButton
            aria-label="Voltar"
            data-testid={`${testId}-${PAGE_FORM_TEST_IDS.BACK}`}
            onClick={onBack}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.05)' },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            data-testid={`${testId}-${PAGE_FORM_TEST_IDS.HEADING}`}
            variant="h4"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {heading}
          </Typography>
        </Box>
        {children}
      </Container>
    </Box>
  );
}
