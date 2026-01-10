import React from "react";
import { Box, Snackbar, Alert, Container } from "@mui/material";
import { motion } from "framer-motion";
import { useContacts, useContactMutations, useContactSearch } from "./hooks";
import ContactToolbar from "./components/ContactToolbar";
import ContactGrid from "./components/ContactGrid";
import ContactDetailsModal from "./components/ContactDetailsModal";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import BackHeader from "@/components/common/header/BackHeader";
import { Contact, SnackbarKind } from "./types";

export default function ContactsManager() {
  const { contacts, loading, error, setError, fetchContacts } = useContacts();
  const { searchTerm, setSearchTerm, filtered } = useContactSearch(contacts);
  const { busy, error: mError, setError: setMError, remove, markAsRead } =
    useContactMutations(fetchContacts);

  const [selected, setSelected] = React.useState<Contact | null>(null);
  const [toDelete, setToDelete] = React.useState<Contact | null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success" as SnackbarKind,
  });

  const showSnackbar = (message: string, severity: SnackbarKind) =>
    setSnackbar({ open: true, message, severity });

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      showSnackbar("Contato excluído com sucesso", "success");
    } catch {
      showSnackbar(mError || "Erro ao excluir contato", "error");
    } finally {
      setToDelete(null);
    }
  };

  const handleMarkAsRead = async () => {
    if (!selected) return;
    try {
      await markAsRead(selected.id);
      showSnackbar("Contato marcado como lido", "success");
    } catch {
      showSnackbar(mError || "Erro ao marcar como lido", "error");
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📞 Gerenciar Contatos" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ContactToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={fetchContacts}
            loading={busy}
          />
        </motion.div>

        <ContactGrid
          items={filtered}
          loading={loading}
          error={error}
          onView={(c) => setSelected(c)}
          onDeleteAsk={(c) => setToDelete(c)}
        />

      <ContactDetailsModal
        contact={selected}
        onClose={() => setSelected(null)}
        onMarkAsRead={handleMarkAsRead}
        onDelete={() => {
          if (selected) setToDelete(selected);
          setSelected(null);
        }}
      />

      <DeleteConfirmDialog
        open={!!toDelete}
        title={toDelete?.name || ""}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
