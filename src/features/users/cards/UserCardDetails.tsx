import React from "react";
import { Box, CardContent, Chip, Divider, Paper, Slide, Stack } from "@mui/material";
import { fmtDate } from "@/utils/dateUtils";
import type { UserRow } from "../types";
import { CARD_PANEL_SX } from "./constants";
import { roleChipColor, roleLabel, yesNo } from "./utils";

const UserCardDetails: React.FC<{ user: UserRow; expanded: boolean }> = ({ user: u, expanded }) => (
  <Slide direction="down" in={expanded} timeout={300}>
    <Box data-testid="user-card-details">
      <Divider sx={{ mx: { xs: 1, sm: 1.25 } }} />
      <CardContent sx={{ p: { xs: 1.25, sm: 1.5 } }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 1.25, ...CARD_PANEL_SX }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap rowGap={1}>
              <Chip size="small" variant="outlined" label={`Criado: ${fmtDate(u.createdAt)}`} color="default" sx={{ fontWeight: 500 }} />
              <Chip size="small" variant="outlined" label={`Atualizado: ${fmtDate(u.updatedAt)}`} color="default" sx={{ fontWeight: 500 }} />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.25, ...CARD_PANEL_SX }}>
            <Stack direction="row" flexWrap="wrap" spacing={1} rowGap={1}>
              <Chip size="small" label={`Papel: ${roleLabel(u.role)}`} color={roleChipColor(u.role)} variant="outlined" sx={{ fontWeight: 500 }} />
              <Chip size="small" label={`Ativo: ${yesNo(u.active)}`} color={u.active ? "success" : "default"} sx={{ fontWeight: 500 }} />
              <Chip size="small" label={`Completo: ${yesNo(u.completed)}`} color={u.completed ? "success" : "default"} sx={{ fontWeight: 500 }} />
              {u.phone && <Chip size="small" label={u.phone} variant="outlined" sx={{ fontWeight: 500 }} />}
            </Stack>
          </Paper>
        </Stack>
      </CardContent>
    </Box>
  </Slide>
);

export default UserCardDetails;
