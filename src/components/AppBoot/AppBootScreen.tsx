import { Box, Button, CircularProgress, Typography } from "@mui/material";

interface AppBootScreenProps {
  /** A verificação passou do prazo: mostra a falha com nova tentativa, em vez de abrir o app "meio pronto". */
  timedOut: boolean;
  onRetry: () => void;
  onLogout: () => void;
}

/**
 * Tela de entrada enquanto a sessão é verificada. Não existe mais o "forceReady"
 * (renderizar o app após 15 s mesmo sem saber quem é o usuário): se demorar,
 * o usuário vê o problema e pode tentar de novo ou sair.
 */
export default function AppBootScreen({
  timedOut,
  onRetry,
  onLogout,
}: AppBootScreenProps) {
  return (
    <Box
      data-testid={timedOut ? "app-boot-timeout" : "app-auth-loading"}
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)",
        backgroundAttachment: "fixed",
        gap: 3,
        px: 2,
        textAlign: "center",
      }}
    >
      {timedOut ? (
        <>
          <Typography variant="h6" component="h1">
            Não foi possível verificar sua sessão
          </Typography>
          <Typography variant="body1" color="text.secondary">
            O servidor demorou para responder. Verifique sua conexão e tente de
            novo.
          </Typography>
          <Button
            data-testid="app-boot-retry"
            variant="contained"
            onClick={onRetry}
            sx={{ minHeight: 44 }}
          >
            Tentar novamente
          </Button>
        </>
      ) : (
        <>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Verificando autenticação...
          </Typography>
        </>
      )}
      <Button
        data-testid="app-auth-loading-logout"
        variant="outlined"
        color="error"
        onClick={onLogout}
        sx={{
          minHeight: 44,
          borderWidth: 2,
          "&:hover": { borderWidth: 2, bgcolor: "rgba(211, 47, 47, 0.04)" },
        }}
      >
        Sair
      </Button>
    </Box>
  );
}
