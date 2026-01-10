import React from "react";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Groups as GroupsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";

import { ShelterScheduleResponseDto } from "../types";
import VisitCard from "./VisitCard";

interface TeamGroup {
  teamId: string;
  teamNumber: number;
  schedules: ShelterScheduleResponseDto[];
}

interface ShelterGroup {
  shelterId: string;
  shelterName: string;
  shelterDescription: string;
  address: {
    city: string;
    state: string;
    street: string;
    number: string;
  };
  teams: TeamGroup[];
  totalSchedules: number;
}

interface ShelterCardProps {
  shelter: ShelterGroup;
  isExpanded: boolean;
  selectedScheduleId: string | null;
  getVisitColor: (visitNumber: number) => string;
  onToggleExpand: (shelterId: string) => void;
  onViewDetails: (schedule: ShelterScheduleResponseDto) => void;
  onEdit: (schedule: ShelterScheduleResponseDto) => void;
  onDelete: (schedule: ShelterScheduleResponseDto) => void;
}

export default function ShelterCard({
  shelter,
  isExpanded,
  selectedScheduleId,
  getVisitColor,
  onToggleExpand,
  onViewDetails,
  onEdit,
  onDelete,
}: ShelterCardProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": { boxShadow: 6 },
      }}
    >
      {/* Header do Abrigo */}
      <Box
        onClick={() => onToggleExpand(shelter.shelterId)}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.5, sm: 2 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : "none",
        }}
      >
        <Avatar
          sx={{
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            bgcolor: theme.palette.primary.main,
            fontSize: { xs: "1rem", sm: "1.2rem" },
            fontWeight: "bold",
          }}
        >
          {shelter.shelterName.charAt(0)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            noWrap
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            {shelter.shelterName}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {shelter.address.city}/{shelter.address.state}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
          <Chip
            label={`${shelter.teams.length} equipe${shelter.teams.length !== 1 ? "s" : ""}`}
            size="small"
            icon={<GroupsIcon />}
            sx={{ fontWeight: "medium", display: { xs: "none", sm: "flex" } }}
          />
          <Chip
            label={`${shelter.totalSchedules} visita${shelter.totalSchedules !== 1 ? "s" : ""}`}
            size="small"
            color="primary"
            sx={{ fontWeight: "medium", fontSize: { xs: "0.7rem", sm: "0.8125rem" } }}
          />
          <IconButton size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Conteúdo Expandido - Equipes */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {shelter.teams.map((team, teamIndex) => (
            <Box key={team.teamId}>
              {teamIndex > 0 && <Divider sx={{ my: 2 }} />}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Chip
                  icon={<GroupsIcon />}
                  label={`Equipe ${team.teamNumber}`}
                  color="secondary"
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {team.schedules.length} agendamento{team.schedules.length !== 1 ? "s" : ""}
                </Typography>
              </Box>

              {/* Grid de Visitas */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                    xl: "repeat(5, 1fr)",
                  },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                {team.schedules.map((schedule) => (
                  <VisitCard
                    key={schedule.id}
                    schedule={schedule}
                    isSelected={selectedScheduleId === schedule.id}
                    getVisitColor={getVisitColor}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}
