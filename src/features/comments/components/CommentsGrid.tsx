import React from "react";
import { Grid, Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { Comment } from "@mui/icons-material";
import { motion } from "framer-motion";
import { CommentData } from "store/slices/comment/commentsSlice";
import CommentCard from "./CommentCard";

type Props = {
  comments: CommentData[];
  loading: boolean;
  error: string;
  onView: (c: CommentData) => void;
  onEdit: (c: CommentData) => void;
  onAskPublish: (c: CommentData) => void;
  onAskDelete: (c: CommentData) => void;
};

export default function CommentsGrid({
  comments, loading, error, onView, onEdit, onAskPublish, onAskDelete,
}: Props) {
  if (loading) {
    return (
      <Box
        data-testid="comments-grid-loading"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body2" mt={2} color="text.secondary">
          Carregando comentários...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert
          data-testid="comments-grid-error"
          severity="error"
          sx={{
            borderRadius: 3,
            fontSize: "1rem",
          }}
        >
          {error}
        </Alert>
      </motion.div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          data-testid="comments-grid-empty"
          elevation={1}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <Comment sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            📭 Nenhum comentário encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ainda não há comentários cadastrados.
          </Typography>
        </Paper>
      </motion.div>
    );
  }

  return (
    <Grid
      data-testid="comments-grid"
      container
      spacing={{ xs: 2, sm: 2.5, md: 3 }}
      alignItems="stretch"
    >
      {comments.map((comment, index) => (
        <Grid
          item
          key={comment.id || `${comment.createdAt}-${comment.name}`}
          xs={12}
          sm={6}
          md={4}
          lg={3}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          sx={{ display: "flex" }}
        >
          <CommentCard
            comment={comment}
            onView={onView}
            onEdit={onEdit}
            onAskPublish={onAskPublish}
            onAskDelete={onAskDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
}
