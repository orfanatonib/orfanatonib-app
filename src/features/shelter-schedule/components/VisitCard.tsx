import React from "react";
import {
  Card,
  CardContent,
  Box,
  Badge,
  IconButton,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

import { ShelterScheduleResponseDto } from "../types";

interface VisitCardProps {
  schedule: ShelterScheduleResponseDto;
  isSelected: boolean;
  getVisitColor: (visitNumber: number) => string;
  onViewDetails: (schedule: ShelterScheduleResponseDto) => void;
  onEdit: (schedule: ShelterScheduleResponseDto) => void;
  onDelete: (schedule: ShelterScheduleResponseDto) => void;
}

export default function VisitCard({
  schedule,
  isSelected,
  getVisitColor,
  onViewDetails,
  onEdit,
  onDelete,
}: VisitCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `2px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
        transition: "all 0.15s ease",
        "&:hover": {
          boxShadow: 4,
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
        minWidth: 0,
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Badge
            badgeContent={schedule.visitNumber}
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: getVisitColor(schedule.visitNumber),
                color: "white",
                fontWeight: "bold",
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                minWidth: { xs: 20, sm: 24 },
                height: { xs: 20, sm: 24 },
              },
            }}
          >
            <CalendarIcon
              sx={{
                fontSize: { xs: 24, sm: 28 },
                color: getVisitColor(schedule.visitNumber),
                opacity: 0.8,
              }}
            />
          </Badge>

          <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(schedule);
              }}
              sx={{ p: 0.5 }}
              title="Ver detalhes"
            >
              <VisibilityIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(schedule);
              }}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(schedule);
              }}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: { xs: 1, sm: 2 },
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.3,
            minHeight: { xs: "auto", sm: 34 },
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            wordBreak: "break-word",
          }}
        >
          {schedule.lessonContent}
        </Typography>

        <Box mt={1} display="flex" flexDirection="row" flexWrap="wrap" gap={1.5}>
          {schedule.visitDate && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <EventIcon sx={{ fontSize: 12, color: "success.main" }} />
              <Typography variant="caption" color="text.secondary">
                {dayjs(schedule.visitDate).format("DD/MM")} (Visita)
              </Typography>
            </Box>
          )}
          {schedule.meetingDate && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <EventIcon sx={{ fontSize: 12, color: "info.main" }} />
              <Typography variant="caption" color="text.secondary">
                {dayjs(schedule.meetingDate).format("DD/MM")} (Reunião)
              </Typography>
            </Box>
          )}
          {!schedule.visitDate && !schedule.meetingDate && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <EventIcon sx={{ fontSize: 12, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary">
                Data a definir
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
