import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  Typography,
} from "@mui/material";
import { Bug, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import type { AppError } from "@/types/error";

interface ErrorDetailsCardProps {
  error?: AppError;
  showDetails?: boolean;
}

/** Detalhes técnicos do erro (ID, status, categoria…), recolhidos por padrão. */
export default function ErrorDetailsCard({
  error,
  showDetails,
}: ErrorDetailsCardProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (!showDetails && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <Card
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Button
            data-testid="error-screen-details-toggle"
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            fullWidth
            sx={{
              p: 2,
              justifyContent: "space-between",
              textTransform: "none",
              borderRadius: 2,
            }}
            endIcon={
              showErrorDetails ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Bug size={18} />
              <Typography variant="body2" fontWeight={500}>
                Detalhes técnicos
              </Typography>
            </Box>
            <Chip
              label="Debug"
              size="small"
              variant="outlined"
              color="warning"
            />
          </Button>

          <Collapse in={showErrorDetails}>
            <Box sx={{ p: 2, pt: 0 }}>
              {error && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Categoria:
                    </Typography>
                    <Chip
                      label={error.category || "UNKNOWN"}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Severidade:
                    </Typography>
                    <Chip
                      label={error.severity || "MEDIUM"}
                      size="small"
                      color={
                        error.severity === "CRITICAL"
                          ? "error"
                          : error.severity === "HIGH"
                            ? "warning"
                            : "info"
                      }
                      variant="outlined"
                    />
                  </Grid>
                  {(error.metadata?.requestId || error.correlationId) && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Código do erro:
                      </Typography>
                      <Typography
                        data-testid="error-screen-request-id"
                        variant="body2"
                        sx={{
                          overflowWrap: "anywhere",
                          fontFamily: "monospace",
                          bgcolor: "grey.100",
                          p: 1,
                          borderRadius: 1,
                          mt: 0.5,
                        }}
                      >
                        {error.metadata?.requestId ?? error.correlationId}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}

              {error?.context && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Contexto:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {error.context}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
}
