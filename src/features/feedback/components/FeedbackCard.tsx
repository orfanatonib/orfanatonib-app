import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  Rating,
} from "@mui/material";
import { Delete, Visibility, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";
import { FeedbackData } from "@/store/slices/feedback/feedbackSlice";
import { FeedbackCategory, FeedbackCategoryLabels } from "@/store/slices/types";

type Props = {
  feedback: FeedbackData;
  onView: () => void;
  onDelete: () => void;
};

const FeedbackCard: React.FC<Props> = ({ feedback, onView, onDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const statusLabel = feedback.read ? "Lido" : "Não lido";
  const statusColor: "success" | "warning" = feedback.read ? "success" : "warning";

  const categoryLabel =
    FeedbackCategoryLabels[feedback.category as FeedbackCategory] || feedback.category;

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: feedback.read ? "success.light" : "warning.light",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          borderColor: feedback.read ? "success.main" : "warning.main",
        },
      }}
    >
      {/* Header with Status */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: feedback.read ? "success.lighter" : "warning.lighter",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Chip
          icon={feedback.read ? <CheckCircle fontSize="small" /> : <RadioButtonUnchecked fontSize="small" />}
          label={statusLabel}
          color={statusColor}
          size="small"
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            height: { xs: 24, sm: 28 },
            fontWeight: 600,
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            fontSize: { xs: "1rem", sm: "1.25rem" },
            mb: 1.5,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
          title={feedback.name}
        >
          {feedback.name}
        </Typography>

        <Stack spacing={1.5} mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              Avaliação
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Rating value={feedback.rating} readOnly size="small" />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {feedback.rating}/5
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              Categoria
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={categoryLabel}
            >
              {categoryLabel}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          pt: 0,
          gap: { xs: 0.5, sm: 1 },
          justifyContent: "flex-end",
        }}
      >
        <Tooltip title="Ver detalhes">
          <IconButton
            size={isMobile ? "small" : "medium"}
            color="primary"
            onClick={onView}
            aria-label="Ver detalhes"
            sx={{
              "&:hover": {
                bgcolor: "primary.lighter",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <Visibility fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            size={isMobile ? "small" : "medium"}
            color="error"
            onClick={onDelete}
            aria-label="Excluir"
            sx={{
              "&:hover": {
                bgcolor: "error.lighter",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <Delete fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default FeedbackCard;
