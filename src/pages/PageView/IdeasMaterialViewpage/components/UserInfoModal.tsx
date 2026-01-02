import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { buildIdeasWhatsappLink } from "@/utils/whatsapp";

interface UserInfoModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  ideaTitle?: string;
}

export default function UserInfoModal({ open, onClose, user, ideaTitle }: UserInfoModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Pegar iniciais do nome para o avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Copiar para clipboard
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  // Abrir WhatsApp
  const handleWhatsApp = () => {
    if (!user.phone) return;
    const link = buildIdeasWhatsappLink(user.name, ideaTitle, user.phone);
    if (link) window.open(link, "_blank");
  };

  // Abrir email
  const handleEmail = () => {
    window.open(`mailto:${user.email}`, "_blank");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {/* Header com gradiente */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            p: 3,
            pb: 5,
            position: "relative",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              bgcolor: "rgba(255,255,255,0.2)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          
          <Typography
            variant="overline"
            sx={{ color: "rgba(255,255,255,0.8)", letterSpacing: 1.5 }}
          >
            Compartilhado por
          </Typography>
        </Box>

        {/* Avatar sobreposto */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: -4,
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: "1.75rem",
              fontWeight: "bold",
              bgcolor: "#667eea",
              border: "4px solid white",
              boxShadow: 3,
            }}
          >
            {getInitials(user.name)}
          </Avatar>
        </Box>

        <DialogContent sx={{ pt: 0, pb: 3, px: 3 }}>
          {/* Nome */}
          <Typography
            variant="h6"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
          >
            {user.name}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Info cards */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Email */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                bgcolor: "grey.50",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.200",
              }}
            >
              <EmailIcon sx={{ color: "grey.500" }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  E-mail
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => handleCopy(user.email, "email")}
                sx={{
                  color: copied === "email" ? "success.main" : "grey.500",
                }}
              >
                {copied === "email" ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Box>

            {/* Telefone */}
            {user.phone && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <PhoneIcon sx={{ color: "grey.500" }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body2">{user.phone}</Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(user.phone!, "phone")}
                  sx={{
                    color: copied === "phone" ? "success.main" : "grey.500",
                  }}
                >
                  {copied === "phone" ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Botões de ação */}
          <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EmailIcon />}
              onClick={handleEmail}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                py: 1.2,
              }}
            >
              Enviar E-mail
            </Button>
            
            {user.phone && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<WhatsAppIcon />}
                onClick={handleWhatsApp}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  py: 1.2,
                  bgcolor: "#25D366",
                  "&:hover": { bgcolor: "#128C7E" },
                }}
              >
                WhatsApp
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar de confirmação */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          Copiado para a área de transferência!
        </Alert>
      </Snackbar>
    </>
  );
}
