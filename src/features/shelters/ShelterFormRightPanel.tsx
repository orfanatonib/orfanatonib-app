import React from "react";
import { Box, Divider, Paper, TextField } from "@mui/material";
import TeamManagementSection, { TeamManagementRef } from "./components/TeamManagementSection";

type Props = {
  savedShelterId: string | null;
  teamsQuantity: number;
  onChangeTeamsQuantity: (value: number) => void;
  teamManagementRef: React.RefObject<TeamManagementRef | null>;
};

export default function ShelterFormRightPanel({
  savedShelterId,
  teamsQuantity,
  onChangeTeamsQuantity,
  teamManagementRef,
}: Props) {
  return (
    <Paper elevation={2} className="shelterFormCard">
      <Box className="shelterFormRight__top">
        <TextField
          label="Quantidade de Equipes"
          type="number"
          fullWidth
          value={teamsQuantity}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onChangeTeamsQuantity(Number.isFinite(val) && val > 0 ? val : 1);
          }}
          inputProps={{ min: 1, step: 1 }}
          required
          helperText="Número de equipes (obrigatório, mínimo: 1)"
          error={!teamsQuantity || teamsQuantity < 1}
        />
      </Box>

      <Divider className="shelterFormCard__dividerLarge" />

      <TeamManagementSection
        ref={teamManagementRef}
        shelterId={savedShelterId}
        teamsQuantity={teamsQuantity}
        onTeamsQuantityChange={(newQuantity) => onChangeTeamsQuantity(newQuantity)}
      />
    </Paper>
  );
}
