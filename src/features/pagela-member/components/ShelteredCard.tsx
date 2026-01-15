import * as React from "react";
import {
  Card, CardActionArea, CardContent, Stack, Typography,
  Box, Avatar, Tooltip, IconButton, useTheme, Chip, Switch
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PhoneIcon from "@mui/icons-material/Phone";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import { ShelteredSimpleResponseDto } from "@/features/sheltered/types";
import DecisionModal from "./DecisionModal";
import ConfirmDialog from "@/components/common/modal/ConfirmDialog";

function genderPastel(seed: string, gender: string | undefined) {
  const g = (gender || "").toUpperCase();
  
  if (g === "F") {
    return {
      solid: "#e91e63",
      soft: "#f8bbd0",
      light: "#fce4ec",
    };
  } else if (g === "M") {
    return {
      solid: "#2196f3",
      soft: "#90caf9",
      light: "#e3f2fd",
    };
  } else {
    return {
      solid: "#9e9e9e", 
      soft: "#e0e0e0", 
      light: "#f5f5f5", 
    };
  }
}

export default function ShelteredCard({
  sheltered,
  onClick,
  onEdit,
  onRefresh,
  onToggleStatus
}: {
  sheltered: ShelteredSimpleResponseDto;
  onClick: (c: ShelteredSimpleResponseDto) => void;
  onEdit?: (c: ShelteredSimpleResponseDto) => void;
  onRefresh?: () => void;
  onToggleStatus?: (id: string, active: boolean) => Promise<void>;
}) {
  const theme = useTheme();
  const colors = genderPastel(sheltered.name || sheltered.id, sheltered.gender);
  const initials = React.useMemo(() => {
    const parts = (sheltered.name || "").trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("");
  }, [sheltered.name]);

  const acceptedChrists = sheltered.acceptedChrists || [];
  const hasAnyDecision = acceptedChrists.length > 0;
  
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = React.useState(false);
  const [pendingActive, setPendingActive] = React.useState<boolean | null>(null);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const getHeartColor = () => {
    return hasAnyDecision ? theme.palette.error.main : "#ccc";
  };

  const getTooltipText = () => {
    return hasAnyDecision 
      ? "Tem decisão(ões) registrada(s) - Clique para registrar nova"
      : "Registrar decisão por Jesus";
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 4,
          height: "100%",
          overflow: "hidden",
          borderColor: colors.solid,
          borderWidth: 2,
          transition: "all 0.2s ease-in-out",
          position: "relative",
          background:
            theme.palette.mode === "light"
              ? `linear-gradient(180deg, ${colors.light} 0%, #fff 100%)`
              : "linear-gradient(180deg, #1e1e1e 0%, #161616 100%)",
          "&:hover": { 
            transform: "translateY(-2px)", 
            boxShadow: `0 4px 12px ${colors.solid}30`,
            borderColor: colors.solid,
            background: theme.palette.mode === "light"
              ? `linear-gradient(180deg, ${colors.soft} 0%, ${colors.light} 50%, #fff 100%)`
              : "linear-gradient(180deg, #1e1e1e 0%, #161616 100%)",
          },
        }}
      >
        <Tooltip title={getTooltipText()}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            sx={{
              position: "absolute",
              top: { xs: 6, sm: 8 },
              left: { xs: 6, sm: 8 },
              bgcolor: "background.paper",
              border: "2px solid",
              borderColor: hasAnyDecision ? getHeartColor() : "divider",
              zIndex: 3,
              boxShadow: hasAnyDecision ? 2 : 0,
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              transition: "all 0.2s ease",
              "&:hover": { 
                bgcolor: "background.paper",
                transform: "scale(1.1)",
                boxShadow: 3,
              },
            }}
          >
            <FavoriteIcon 
              sx={{ 
                color: getHeartColor(),
                fontSize: { xs: "1.1rem", sm: "1.3rem" },
                animation: hasAnyDecision ? "heartbeat 1.5s ease-in-out infinite" : "none",
                "@keyframes heartbeat": {
                  "0%, 100%": { transform: "scale(1)" },
                  "10%, 30%": { transform: "scale(0.9)" },
                  "20%, 40%": { transform: "scale(1.1)" },
                }
              }} 
            />
          </IconButton>
        </Tooltip>

        {!!onEdit && (
          <Tooltip title="Editar acolhido">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(sheltered); }}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                zIndex: 3,
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Box
          sx={{
            height: { xs: 80, sm: 90 },
            background: `linear-gradient(135deg, ${colors.soft} 0%, ${colors.solid} 100%)`,
            position: "relative",
          }}
        >
          <Box sx={{ position: "absolute", top: -10, left: -10, width: 80, height: 80, borderRadius: "50%", opacity: 0.18, backgroundColor: colors.solid, filter: "blur(2px)" }} />
          <Box sx={{ position: "absolute", bottom: -14, right: -10, width: 72, height: 72, borderRadius: "50%", opacity: 0.12, backgroundColor: colors.soft, filter: "blur(1px)" }} />

          <Avatar
            sx={{
              position: "absolute",
              left: 14,
              bottom: -24,
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              border: "3px solid",
              borderColor: "background.paper",
              bgcolor: colors.solid,
              fontWeight: 900,
            }}
          >
            {initials || <PersonIcon />}
          </Avatar>
        </Box>

        <CardActionArea 
          onClick={() => onClick(sheltered)} 
          sx={{ 
            display: "flex",
            backgroundColor: "transparent !important",
            color: "inherit !important",
            "&:hover": {
              backgroundColor: "transparent !important",
              color: "inherit !important",
              "&::before": {
                display: "none !important",
              },
              "& .MuiTypography-root": {
                color: "inherit !important",
              },
            },
            "&:focus": {
              backgroundColor: "transparent !important",
              color: "inherit !important",
            },
            "&:active": {
              backgroundColor: "transparent !important",
              color: "inherit !important",
            },
            "&::before": {
              display: "none !important",
            },
            "& .MuiTypography-root": {
              color: "inherit",
            },
          }}
        >
          <CardContent sx={{ pt: 3.5, pb: 2.25, px: { xs: 1.5, sm: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
              <PersonIcon fontSize="small" sx={{ opacity: 0.7 }} />
              <Typography
                variant="subtitle1"
                fontWeight={900}
                title={sheltered.name}
                sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {sheltered.name}
              </Typography>
              <Chip
                icon={sheltered.gender === "F" ? <FemaleIcon /> : <MaleIcon />}
                label={sheltered.gender === "F" ? "F" : "M"}
                size="small"
                sx={{
                  height: { xs: 20, sm: 24 },
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  bgcolor: colors.light,
                  color: colors.solid,
                  border: `1px solid ${colors.solid}`,
                  "& .MuiChip-icon": {
                    color: colors.solid,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  },
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
              <FamilyRestroomIcon fontSize="small" sx={{ opacity: 0.7 }} />
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                title={sheltered.guardianName ?? undefined}
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Resp.: {sheltered.guardianName || "—"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <PhoneIcon fontSize="small" sx={{ opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary" noWrap title={sheltered.guardianPhone ?? undefined}>
                Tel.: {sheltered.guardianPhone || "—"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ mt: 1.25 }} alignItems="center" flexWrap="wrap">
              <EmojiEmotionsIcon fontSize="small" sx={{ opacity: 0.65 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.15 }}>
                toque para abrir as pagelas
              </Typography>
              <FavoriteIcon fontSize="inherit" sx={{ opacity: 0.5, ml: 0.25 }} />
            </Stack>

            {!!onToggleStatus && (
              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    flex: 1,
                  }}
                >
                  {sheltered.active 
                    ? "O acolhido não está mais frequentando?" 
                    : "O acolhido voltou a frequentar?"}
                </Typography>
                <Tooltip title={sheltered.active ? "Desativar acolhido" : "Ativar acolhido"}>
                  <Switch
                    checked={sheltered.active}
                    onChange={async (e) => {
                      e.stopPropagation();
                      setPendingActive(!sheltered.active);
                      setConfirmToggleOpen(true);
                    }}
                    size="small"
                    color="success"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "success.main",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "success.main",
                      },
                    }}
                  />
                </Tooltip>
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
      <DecisionModal
        open={modalOpen}
        onClose={handleCloseModal}
        sheltered={sheltered}
        onSuccess={async () => {
          if (onRefresh) await onRefresh();
          handleCloseModal();
        }}
      />

      <ConfirmDialog
        open={confirmToggleOpen}
        title={pendingActive ? "Ativar acolhido" : "Desativar acolhido"}
        content={
          <Typography sx={{ wordBreak: "break-word" }}>
            {pendingActive
              ? `Deseja ativar o acolhido "${sheltered.name}"?`
              : `Deseja desativar o acolhido "${sheltered.name}"?`}
          </Typography>
        }
        confirmText={pendingActive ? "Ativar" : "Desativar"}
        confirmColor={pendingActive ? "success" : "error"}
        confirmVariant="contained"
        cancelVariant="text"
        startAdornment={pendingActive ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
        actionsSx={{
          flexDirection: { xs: "column-reverse", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          "& .MuiButton-root": {
            width: { xs: "100%", sm: "auto" },
          },
        }}
        onClose={() => {
          setConfirmToggleOpen(false);
          setPendingActive(null);
        }}
        onConfirm={() => {
          if (!onToggleStatus || pendingActive === null) return;
          return onToggleStatus(sheltered.id, pendingActive);
        }}
      />

    </>
  );
}
