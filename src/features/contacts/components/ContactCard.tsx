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
} from "@mui/material";
import { Delete, Visibility, CheckCircle, RadioButtonUnchecked, Phone } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";
import { Contact } from "../types";

type Props = {
  contact: Pick<Contact, "id" | "name" | "phone" | "read">;
  onView: () => void;
  onDelete: () => void;
};

export default function ContactCard({ contact, onView, onDelete }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const statusLabel = contact.read ? "Lido" : "Não lido";
  const statusColor: "success" | "warning" = contact.read ? "success" : "warning";

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      sx={{
        width: "100%",
        minHeight: { xs: 240, sm: 260 },
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: contact.read ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 152, 0, 0.3)",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          borderColor: contact.read ? "rgba(76, 175, 80, 0.6)" : "rgba(255, 152, 0, 0.6)",
        },
      }}
    >
      {/* Header with Status */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: contact.read ? "rgba(76, 175, 80, 0.08)" : "rgba(255, 152, 0, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Chip
          icon={
            contact.read ? (
              <CheckCircle fontSize="small" />
            ) : (
              <RadioButtonUnchecked fontSize="small" />
            )
          }
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

      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            fontSize: { xs: "1.1rem", sm: "1.3rem" },
            lineHeight: 1.3,
            color: "text.primary",
          }}
          title={contact.name}
        >
          {contact.name}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "action.hover",
            mt: "auto",
          }}
        >
          <Phone sx={{ fontSize: { xs: 18, sm: 20 }, color: "primary.main" }} />
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 500,
              color: "text.primary",
            }}
          >
            {contact.phone}
          </Typography>
        </Box>
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
}
