import { Event as EventIcon, Edit as EditIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import dayjs from "dayjs";

import { AdminChipRow, AdminEntityCard, type AdminCardAction } from "@/components/common/admin-shell";
import type { AdminChipRowItem } from "@/components/common/admin-shell/chipRow.types";
import { ShelterScheduleResponseDto } from "../types";

interface VisitCardProps {
  schedule: ShelterScheduleResponseDto;
  onViewDetails: (schedule: ShelterScheduleResponseDto) => void;
  onEdit: (schedule: ShelterScheduleResponseDto) => void;
  onDelete: (schedule: ShelterScheduleResponseDto) => void;
}

/** Cartão de um agendamento: abrigo, equipe, lição e datas (casca `AdminEntityCard`). */
export default function VisitCard({ schedule, onViewDetails, onEdit, onDelete }: VisitCardProps) {
  const id = schedule.id;
  const { shelter } = schedule;
  const place = shelter.address?.city ? ` · ${shelter.address.city}/${shelter.address.state}` : "";

  const chips: AdminChipRowItem[] = [
    { key: "number", label: `Visita nº ${schedule.visitNumber}`, testId: `shelter-schedule-card-number-${id}`, color: "primary" },
  ];
  if (schedule.visitDate) {
    chips.push({
      key: "visit",
      label: `${dayjs(schedule.visitDate).format("DD/MM")} (Visita)`,
      testId: `shelter-schedule-card-visit-${id}`,
      color: "success",
      icon: <EventIcon />,
    });
  }
  if (schedule.meetingDate) {
    chips.push({
      key: "meeting",
      label: `${dayjs(schedule.meetingDate).format("DD/MM")} (Reunião)`,
      testId: `shelter-schedule-card-meeting-${id}`,
      color: "info",
      icon: <EventIcon />,
    });
  }
  if (!schedule.visitDate && !schedule.meetingDate) {
    chips.push({ key: "tbd", label: "Data a definir", testId: `shelter-schedule-card-tbd-${id}`, icon: <EventIcon /> });
  }

  const actions: AdminCardAction[] = [
    {
      key: "details",
      label: "Detalhes",
      ariaLabel: "Ver detalhes",
      testId: `schedule-details-${id}`,
      variant: "outlined",
      icon: <VisibilityIcon />,
      onClick: () => onViewDetails(schedule),
    },
    {
      key: "edit",
      label: "Editar",
      ariaLabel: "Editar agendamento",
      testId: `schedule-edit-${id}`,
      variant: "outlined",
      icon: <EditIcon />,
      onClick: () => onEdit(schedule),
    },
  ];

  return (
    <AdminEntityCard
      testId={`shelter-schedule-card-${id}`}
      title={shelter.name}
      titleTestId={`shelter-schedule-card-title-${id}`}
      subtitle={`Equipe ${shelter.team.numberTeam}${place}`}
      subtitleTestId={`shelter-schedule-card-team-${id}`}
      description={schedule.lessonContent}
      descriptionTestId={`shelter-schedule-card-lesson-${id}`}
      meta={<AdminChipRow testId={`shelter-schedule-card-dates-${id}`} chips={chips} />}
      actions={actions}
      onDelete={() => onDelete(schedule)}
      deleteTestId={`schedule-delete-${id}`}
      deleteLabel="Excluir agendamento"
    />
  );
}
