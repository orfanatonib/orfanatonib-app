import React from "react";
import { Avatar, Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Edit, LocationOnOutlined, Phone, Visibility, WhatsApp } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { AdminEntityCard } from "@/components/common/admin-shell";
import AdminChipRow from "@/components/common/admin-shell/AdminChipRow";
import type { AdminChipRowItem } from "@/components/common/admin-shell/chipRow.types";
import type { RootState } from "@/store/slices";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { formatDate, gLabel, timeDifference } from "@/utils/dateUtils";
import { CopyButton } from "@/components/common/CopyButton";
import { initials } from "@/utils/textUtils";
import { MIN_TOUCH_TARGET_PX, SHELTERED_MESSAGES } from "../constants";
import { shortAddressLabel, toTestIdSuffix } from "../utils";
import type { ShelteredResponseDto } from "../types";
import type { ShelteredRowActions } from "./shelteredColumns";

const TARGET_SX = { minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX } as const;

/**
 * Cartão do celular, no padrão `AdminEntityCard`: avatar + nome, responsável como subtítulo, chips de
 * abrigo/gênero/idade/tempo, contato do responsável e ações (Ver, Editar; excluir é a lixeira do topo).
 */
export default function ShelteredCard({
  sheltered,
  onOpenView,
  onStartEdit,
  onAskDelete,
}: ShelteredRowActions & { sheltered: ShelteredResponseDto }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const suffix = toTestIdSuffix(sheltered.id);
  const age = timeDifference(sheltered.birthDate);
  const tenure = timeDifference(sheltered.joinedAt);
  const whatsapp = buildWhatsappLink(
    sheltered.name,
    user?.name,
    sheltered.guardianPhone ?? undefined,
  );

  const chips: AdminChipRowItem[] = [
    {
      key: "shelter",
      testId: `sheltered-card-shelter-${suffix}`,
      label: sheltered.shelter ? `Abrigo ${sheltered.shelter.name}` : SHELTERED_MESSAGES.NO_SHELTER,
      color: sheltered.shelter ? "primary" : "default",
    },
    { key: "gender", testId: `sheltered-card-gender-${suffix}`, label: gLabel(sheltered.gender), color: "info" },
  ];
  if (age) chips.push({ key: "age", testId: `sheltered-card-age-${suffix}`, label: `Idade: ${age}`, color: "success" });
  if (tenure) chips.push({ key: "tenure", testId: `sheltered-card-tenure-${suffix}`, label: `No abrigo há ${tenure}`, color: "warning" });

  return (
    <AdminEntityCard
      testId={`sheltered-card-${suffix}`}
      title={sheltered.name}
      titleTestId={`sheltered-card-title-${suffix}`}
      subtitle={sheltered.guardianName || SHELTERED_MESSAGES.NO_GUARDIAN}
      subtitleTestId={`sheltered-card-guardian-${suffix}`}
      avatar={
        <Avatar
          aria-hidden
          sx={{ width: 44, height: 44, bgcolor: sheltered.shelter ? "primary.main" : "grey.500", fontWeight: 700 }}
        >
          {initials(sheltered.name)}
        </Avatar>
      }
      meta={
        <Stack spacing={1}>
          <AdminChipRow testId={`sheltered-card-chips-${suffix}`} chips={chips} />
          {sheltered.guardianPhone && (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {sheltered.guardianPhone}
              </Typography>
              <Stack direction="row">
                <Tooltip title="Ligar">
                  <IconButton
                    href={`tel:${sheltered.guardianPhone}`}
                    aria-label={`Ligar para o responsável por ${sheltered.name}`}
                    data-testid={`sheltered-card-call-${suffix}`}
                    sx={TARGET_SX}
                  >
                    <Phone fontSize="small" />
                  </IconButton>
                </Tooltip>
                {whatsapp && (
                  <Tooltip title="WhatsApp">
                    <IconButton
                      color="success"
                      component="a"
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir WhatsApp do responsável por ${sheltered.name}`}
                      data-testid={`sheltered-card-whatsapp-${suffix}`}
                      sx={TARGET_SX}
                    >
                      <WhatsApp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <CopyButton value={sheltered.guardianPhone} title="Copiar telefone" />
              </Stack>
            </Stack>
          )}
          <Typography variant="body2" color="text.secondary">
            Nascimento: {formatDate(sheltered.birthDate)} · No abrigo desde: {formatDate(sheltered.joinedAt)}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocationOnOutlined aria-hidden sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {shortAddressLabel(sheltered.address)}
            </Typography>
          </Box>
        </Stack>
      }
      onDelete={() => onAskDelete(sheltered)}
      deleteTestId={`sheltered-card-delete-${suffix}`}
      actions={[
        {
          key: "view",
          label: "Ver",
          variant: "outlined",
          icon: <Visibility />,
          onClick: () => onOpenView(sheltered),
          ariaLabel: `Ver detalhes de ${sheltered.name}`,
          testId: `sheltered-card-view-${suffix}`,
        },
        {
          key: "edit",
          label: "Editar",
          variant: "outlined",
          icon: <Edit />,
          onClick: () => onStartEdit(sheltered),
          ariaLabel: `Editar ${sheltered.name}`,
          testId: `sheltered-card-edit-${suffix}`,
        },
      ]}
    />
  );
}
