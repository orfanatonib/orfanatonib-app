import React from "react";
import { Avatar, Box, ButtonBase, Card, Chip, IconButton, Link, Stack, Tooltip, Typography } from "@mui/material";
import { AlternateEmail, Delete, Edit, ExpandMore as ExpandMoreIcon, PhoneIphone, Visibility } from "@mui/icons-material";
import type { UserRow } from "../types";
import CopyButton from "./CopyButton";
import UserCardDetails from "./UserCardDetails";
import WhatsAppButton from "./WhatsAppButton";
import { CARD_STATUS_CHIP_SX } from "./constants";
import { initials, roleAvatarColor, roleChipColor, roleLabel, yesNo } from "./utils";

interface Props {
  user: UserRow;
  expanded: boolean;
  whatsappLink: string | null;
  onToggle: () => void;
  onView: (u: UserRow) => void;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}

const UserCard: React.FC<Props> = ({ user: u, expanded, whatsappLink: wa, onToggle, onView, onEdit, onDelete }) => (
  <Card
    variant="outlined"
    data-testid="user-card"
    sx={{
      borderRadius: 2,
      overflow: "hidden",
      transition: "all 0.2s ease",
      "&:hover": { boxShadow: 4, transform: { xs: "none", sm: "translateY(-2px)" }, "& .user-avatar": { transform: "scale(1.05)" } },
      bgcolor: "background.paper",
      position: "relative",
      maxHeight: !expanded ? { xs: 190, sm: 190 } : "none",
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <Stack direction="row" alignItems="center" sx={{ px: { xs: 1, sm: 1.25 }, pt: 1, pb: 0.5, gap: { xs: 0.75, sm: 1 }, mt: 0.5 }}>
      <Avatar
        className="user-avatar"
        sx={{
          width: { xs: 40, sm: 48 },
          height: { xs: 40, sm: 48 },
          bgcolor: roleAvatarColor(u.role),
          color: "white",
          fontWeight: 700,
          fontSize: { xs: 14, sm: 16 },
          boxShadow: 2,
          transition: "transform 0.2s ease",
          flexShrink: 0,
        }}
        aria-label={`Avatar do usuário ${u.name}`}
      >
        {initials(u.name)}
      </Avatar>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap title={u.name} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }} data-testid="user-card-name">
          {u.name || "—"}
        </Typography>
        <Chip size="small" color={roleChipColor(u.role)} label={roleLabel(u.role)} sx={{ fontSize: "0.7rem", height: 20, mt: 0.25 }} data-testid="user-card-role" />
      </Box>

      <ButtonBase
        onClick={onToggle}
        aria-label={expanded ? "Recolher" : "Expandir"}
        data-testid="user-card-toggle"
        sx={{ minHeight: 44, minWidth: 44, borderRadius: 2, px: { xs: 0.75, sm: 1 }, py: 0.5, display: "flex", alignItems: "center", gap: 0.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", flexShrink: 0, "&:hover": { bgcolor: "action.hover" } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}>
          {expanded ? "Recolher" : "Detalhes"}
        </Typography>
        <ExpandMoreIcon fontSize="small" sx={{ transition: "transform .15s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
      </ButtonBase>
    </Stack>

    <Box sx={{ mx: { xs: 1, sm: 1.25 }, mb: 0.5, p: { xs: 0.75, sm: 1 }, borderRadius: 2, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <AlternateEmail sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={u.email} data-testid="user-card-email">
            {u.email}
          </Typography>
        </Box>
        <CopyButton value={u.email} title="Copiar e-mail" testId="user-card-copy-email" />
      </Stack>
    </Box>

    {!expanded && (
      <Box sx={{ px: { xs: 1, sm: 1.25 }, pb: 0.75 }}>
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" rowGap={0.25}>
          <Chip size="small" variant="filled" label={`Ativo: ${yesNo(u.active)}`} color={u.active ? "success" : "default"} sx={CARD_STATUS_CHIP_SX} />
          <Chip size="small" variant="filled" label={`Completo: ${yesNo(u.completed)}`} color={u.completed ? "success" : "default"} sx={CARD_STATUS_CHIP_SX} />
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
          {u.phone && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <PhoneIphone sx={{ fontSize: 14, color: "text.secondary" }} />
              <Link
                href={`tel:${u.phone}`}
                underline="hover"
                sx={{ fontSize: "0.75rem", color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-flex", alignItems: "center", minHeight: 44 }}
              >
                {u.phone}
              </Link>
              <CopyButton value={u.phone} title="Copiar telefone" testId="user-card-copy-phone" />
            </Stack>
          )}
          <WhatsAppButton href={wa} sx={{ ml: 0.5 }} />
        </Stack>
      </Box>
    )}

    <UserCardDetails user={u} expanded={expanded} />

    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, px: 1.25, pb: 1 }}>
      <WhatsAppButton href={wa} testId="user-card-whatsapp" />
      <Tooltip title="Visualizar">
        <IconButton size="small" onClick={() => onView(u)} aria-label="Visualizar usuário" data-testid="user-card-view" sx={{ minWidth: 44, minHeight: 44 }}>
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Editar">
        <IconButton size="small" onClick={() => onEdit(u)} aria-label="Editar usuário" data-testid="user-card-edit" sx={{ minWidth: 44, minHeight: 44 }}>
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Excluir">
        <IconButton size="small" color="error" onClick={() => onDelete(u)} aria-label="Excluir usuário" data-testid="user-card-delete" sx={{ minWidth: 44, minHeight: 44 }}>
          <Delete fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  </Card>
);

export default UserCard;
