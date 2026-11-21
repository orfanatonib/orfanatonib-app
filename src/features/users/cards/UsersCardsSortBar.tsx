import React from "react";
import { FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tooltip } from "@mui/material";
import { SwapVert } from "@mui/icons-material";
import { SORT_OPTIONS } from "./constants";
import type { CardSort } from "./utils";

interface Props {
  sort: CardSort;
  onField: (field: string) => void;
  onToggleDirection: () => void;
}

const UsersCardsSortBar: React.FC<Props> = ({ sort, onField, onToggleDirection }) => (
  <Stack direction="row" spacing={0.75} sx={{ mb: 1, px: { xs: 0, sm: 0.5 } }} alignItems="center" justifyContent="flex-end" data-testid="users-cards-sort">
    <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 180 } }}>
      <InputLabel>Ordenar por</InputLabel>
      <Select label="Ordenar por" value={sort.field} onChange={(e) => onField(String(e.target.value))} sx={{ ".MuiSelect-select": { py: 0.75 } }}>
        {SORT_OPTIONS.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <Tooltip title={sort.desc ? "Ordem: Descendente" : "Ordem: Ascendente"}>
      <IconButton size="small" onClick={onToggleDirection} aria-label="Inverter ordem" data-testid="users-cards-sort-direction" sx={{ minWidth: 44, minHeight: 44 }}>
        <SwapVert fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);

export default UsersCardsSortBar;
