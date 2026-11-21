import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Card,
  CardContent,
  Chip,
  Alert,
  Stack,
  Collapse,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  WifiOff,
  RefreshCcw,
  AlertTriangle,
  Home,
  ArrowLeft,
  Info,
  ChevronDown,
  ChevronUp,
  Bug,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { AppError } from "@/types/error";
import ErrorDetailsCard from "./ErrorDetailsCard";
import { slugify } from "./ErrorScreen.utils";
import { errorConfigs } from "./ErrorScreen.config";
import type { ErrorScreenAction, ErrorScreenProps } from "./ErrorScreen.config";

export type {
  ErrorScreenType,
  ErrorScreenAction,
  ErrorScreenProps,
} from "./ErrorScreen.config";

export default function ErrorScreen({
  type = "generic",
  title,
  message,
  description,
  error,
  actions,
  showDetails,
  autoRetry,
  retryDelay = 3000,
  maxRetries = 3,
  onRetry,
  onHome,
  onBack,
}: ErrorScreenProps) {
  const navigate = useNavigate();
  const config = errorConfigs[type];
  const Icon = config.icon;

  const [retryCount, setRetryCount] = useState(0);
  const [timeUntilRetry, setTimeUntilRetry] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => onRetry?.();
  const handleHome = () => onHome?.() || navigate("/");
  const handleBack = () => onBack?.() || window.history.back();

  const defaultActions = config.actions.map((action) => ({
    ...action,
    onClick: () => {
      if (action.label === "Tentar novamente") handleRetry();
      else if (action.label === "Página inicial") handleHome();
      else if (action.label === "Voltar") handleBack();
    },
  }));

  const finalActions = actions || defaultActions;

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, minHeight: "60vh", display: "flex", alignItems: "center" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ width: "100%" }}
      >
        <Paper
          data-testid="error-screen"
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 3,
            background: config.gradient,
            border: `2px solid ${config.color}20`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background pattern */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.05,
              background: `radial-gradient(circle at 20% 80%, ${config.color} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${config.color} 0%, transparent 50%)`,
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: `${config.color}20`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    mx: "auto",
                  }}
                >
                  <Icon size={40} color={config.color} />
                </Box>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Typography
                  data-testid="error-screen-title"
                  variant="h4"
                  component="h1"
                  fontWeight="bold"
                  color="text.primary"
                  sx={{ mb: 2, fontSize: { xs: "1.75rem", md: "2.25rem" } }}
                >
                  {title || config.title}
                </Typography>

                <Typography
                  data-testid="error-screen-message"
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 1, fontSize: { xs: "1.1rem", md: "1.25rem" } }}
                >
                  {message || config.message}
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 500, mx: "auto", lineHeight: 1.6 }}
                >
                  {description || config.description}
                </Typography>
              </motion.div>
            </Box>

            <AnimatePresence>
              {autoRetry && retryCount < maxRetries && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    severity="info"
                    sx={{ mb: 3, borderRadius: 2 }}
                    icon={<RefreshCcw />}
                  >
                    <Typography variant="body2">
                      Tentando novamente em {timeUntilRetry} segundos...
                      (Tentativa {retryCount + 1} de {maxRetries})
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        ((retryDelay / 1000 - timeUntilRetry) /
                          (retryDelay / 1000)) *
                        100
                      }
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    />
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
                sx={{ mb: 3 }}
              >
                {finalActions.map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      data-testid={`error-screen-action-${slugify(action.label)}`}
                      variant={action.variant}
                      color={action.color || "primary"}
                      size="large"
                      onClick={action.onClick}
                      disabled={isRetrying}
                      startIcon={action.icon}
                      sx={{
                        minWidth: 160,
                        py: 1.5,
                        px: 3,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "1rem",
                        ...(action.variant === "contained" && {
                          boxShadow: `0 4px 12px ${config.color}40`,
                          "&:hover": {
                            boxShadow: `0 6px 16px ${config.color}50`,
                            transform: "translateY(-1px)",
                          },
                        }),
                      }}
                    >
                      {isRetrying && action.label === "Tentar novamente"
                        ? "Tentando..."
                        : action.label}
                    </Button>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>

            <ErrorDetailsCard error={error} showDetails={showDetails} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Alert
                severity="info"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.8)",
                }}
                icon={<Info size={18} />}
              >
                <Typography variant="body2">
                  Se o problema persistir, entre em contato com nosso suporte e
                  mencione o ID do erro.
                </Typography>
              </Alert>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}
