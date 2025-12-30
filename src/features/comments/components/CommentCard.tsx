import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Tooltip,
  Box,
  Button,
  Chip,
} from "@mui/material";
import { Delete, Edit, Publish, Visibility, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";
import { CommentData } from "store/slices/comment/commentsSlice";

type Props = {
  comment: CommentData;
  onView: (c: CommentData) => void;
  onEdit: (c: CommentData) => void;
  onAskPublish: (c: CommentData) => void;
  onAskDelete: (c: CommentData) => void;
  truncate?: (s: string, len?: number) => string;
};

export default function CommentCard({
  comment,
  onView,
  onEdit,
  onAskPublish,
  onAskDelete,
  truncate = (s, l = 100) => (s?.length > l ? s.slice(0, l) + "..." : s),
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      sx={{
        width: "100%",
        minHeight: { xs: 260, sm: 280 },
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: comment.published ? "success.light" : "warning.light",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          borderColor: comment.published ? "success.main" : "warning.main",
        },
        position: "relative",
      }}
    >
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: comment.published ? "success.lighter" : "warning.lighter",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Chip
          icon={
            comment.published ? (
              <CheckCircle fontSize="small" />
            ) : (
              <RadioButtonUnchecked fontSize="small" />
            )
          }
          label={comment.published ? "Publicado" : "Não Publicado"}
          color={comment.published ? "success" : "warning"}
          size="small"
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            height: { xs: 24, sm: 28 },
            fontWeight: 600,
          }}
        />
        <Tooltip title="Excluir comentário">
          <IconButton
            size="small"
            onClick={() => onAskDelete(comment)}
            sx={{
              color: "error.main",
              "&:hover": {
                bgcolor: "error.lighter",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
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
          title={comment.name || "Sem Nome"}
        >
          {comment.name || "Sem Nome"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: "0.8rem", sm: "0.85rem" },
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={comment.comment || ""}
        >
          {comment.comment || ""}
        </Typography>
      </CardContent>

      <CardActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          pt: 0,
          gap: { xs: 0.5, sm: 1 },
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Tooltip title="Ver detalhes">
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            startIcon={<Visibility />}
            onClick={() => onView(comment)}
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              flex: 1,
              minWidth: { xs: "100%", sm: 100 },
            }}
          >
            Detalhes
          </Button>
        </Tooltip>
        <Tooltip title="Editar">
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            startIcon={<Edit />}
            onClick={() => onEdit(comment)}
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              flex: 1,
              minWidth: { xs: "100%", sm: 100 },
            }}
          >
            Editar
          </Button>
        </Tooltip>
        {!comment.published && (
          <Tooltip title="Publicar">
            <Button
              variant="contained"
              size={isMobile ? "small" : "medium"}
              startIcon={<Publish />}
              onClick={() => onAskPublish(comment)}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "success.main",
                "&:hover": {
                  bgcolor: "success.dark",
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
                transition: "all 0.2s ease",
                flex: 1,
                minWidth: { xs: "100%", sm: 100 },
              }}
            >
              Publicar
            </Button>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
