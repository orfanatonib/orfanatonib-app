import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export type ErrorType = '404' | '500' | 'network' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

const errorConfig = {
  '404': {
    icon: SentimentDissatisfiedIcon,
    defaultTitle: 'Nada por aqui!',
    defaultMessage: 'Não encontramos o que você está procurando. Volte mais tarde para conferir as novidades!',
    color: '#FF9800',
  },
  '500': {
    icon: WarningAmberIcon,
    defaultTitle: 'Ops! Algo deu errado',
    defaultMessage: 'Estamos com problemas no servidor. Nossa equipe já foi notificada. Tente novamente em alguns minutos.',
    color: '#F44336',
  },
  network: {
    icon: WifiOffIcon,
    defaultTitle: 'Sem conexão',
    defaultMessage: 'Parece que você está sem conexão com a internet. Verifique sua conexão e tente novamente.',
    color: '#9E9E9E',
  },
  generic: {
    icon: ErrorOutlineIcon,
    defaultTitle: 'Algo deu errado',
    defaultMessage: 'Ops! Algo inesperado aconteceu. Tente novamente mais tarde.',
    color: '#FF5252',
  },
};

export default function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  showRetryButton = true,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 4,
        textAlign: 'center',
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        border: `2px solid ${config.color}20`,
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 3,
          borderRadius: '50%',
          bgcolor: `${config.color}15`,
          mb: 3,
        }}
      >
        <Icon
          sx={{
            fontSize: '3rem',
            color: config.color,
          }}
        />
      </Box>

      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
        {title || config.defaultTitle}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        {message || config.defaultMessage}
      </Typography>

      {showRetryButton && onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{
            bgcolor: config.color,
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Tentar novamente
        </Button>
      )}
    </Paper>
  );
}
