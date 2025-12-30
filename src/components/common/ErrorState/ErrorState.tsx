import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          borderRadius: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          border: `2px solid ${config.color}20`,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 10
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
                fontSize: { xs: '3rem', md: '4rem' },
                color: config.color,
              }}
            />
          </Box>
        </motion.div>

        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            mb: 2,
            color: 'text.primary',
          }}
        >
          {title || config.defaultTitle}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '1rem', md: '1.1rem' },
            mb: 4,
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          {message || config.defaultMessage}
        </Typography>

        {showRetryButton && onRetry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={onRetry}
              sx={{
                bgcolor: config.color,
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: { xs: '0.9rem', md: '1rem' },
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: `0 4px 12px ${config.color}40`,
                '&:hover': {
                  bgcolor: config.color,
                  filter: 'brightness(0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${config.color}50`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              Tentar novamente
            </Button>
          </motion.div>
        )}
      </Paper>
    </motion.div>
  );
}
