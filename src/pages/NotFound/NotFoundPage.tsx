import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/** Rota que não existe (ou página de tipo desligado por flag): 404 de verdade, sem renderizar a Home por baixo. */
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box
      data-testid="not-found-page"
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" component="h1" fontWeight="bold">
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Não encontramos esta página.
      </Typography>
      <Button data-testid="not-found-home" variant="contained" onClick={() => navigate('/')} sx={{ minHeight: 44 }}>
        Voltar ao início
      </Button>
    </Box>
  );
}
