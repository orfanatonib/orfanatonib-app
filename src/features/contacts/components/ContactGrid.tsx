import React from "react";
import { Grid, Box, CircularProgress, Typography, Paper, Alert } from "@mui/material";
import { ContactPhone } from "@mui/icons-material";
import { motion } from "framer-motion";
import ContactCard from "./ContactCard";
import { Contact } from "../types";

type Props = {
  items: Contact[];
  loading: boolean;
  error?: string;
  onView: (c: Contact) => void;
  onDeleteAsk: (c: Contact) => void;
};

export default function ContactGrid({ items, loading, error, onView, onDeleteAsk }: Props) {
  if (loading) {
    return (
      <Box
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
          Carregando contatos...
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

  if (!items.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <ContactPhone sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            📭 Nenhum contato encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ainda não há contatos cadastrados.
          </Typography>
        </Paper>
      </motion.div>
    );
  }

  return (
    <Grid container spacing={1} alignItems="stretch">
      {items.map((contact, index) => (
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
          key={contact.id}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          sx={{ display: "flex" }}
        >
          <ContactCard
            contact={{ id: contact.id, name: contact.name, phone: contact.phone, read: contact.read }}
            onView={() => onView(contact)}
            onDelete={() => onDeleteAsk(contact)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
