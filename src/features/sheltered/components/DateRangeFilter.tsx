import React from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Close, Event } from "@mui/icons-material";
import { summaryLabel } from "@/utils/dateUtils";
import { DateFilterMode } from "../enums";
import { MIN_TOUCH_TARGET_PX } from "../constants";

type Props = {
  label: string;
  testId: string;
  from?: string;
  to?: string;
  onChange: (from: string, to: string) => void;
  disabled?: boolean;
};

const resolveMode = (from: string, to: string): DateFilterMode =>
  from && to && from !== to ? DateFilterMode.RANGE : DateFilterMode.SINGLE;

/**
 * Single date or date range, applied only when the user confirms, so the list
 * is not refetched on every keystroke.
 */
export default function DateRangeFilter({
  label,
  testId,
  from = "",
  to = "",
  onChange,
  disabled,
}: Props) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [mode, setMode] = React.useState<DateFilterMode>(resolveMode(from, to));
  const [draftFrom, setDraftFrom] = React.useState(from);
  const [draftTo, setDraftTo] = React.useState(to || from);

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDraftFrom(from);
    setDraftTo(to || from);
    setMode(resolveMode(from, to));
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleApply = () => {
    if (mode === DateFilterMode.SINGLE) {
      onChange(draftFrom, draftFrom);
      handleClose();
      return;
    }

    const start = draftFrom;
    const end = draftTo || draftFrom;
    onChange(start, start || end ? end || start : "");
    handleClose();
  };

  const handleClear = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    onChange("", "");
  };

  return (
    <>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={summaryLabel(from, to)}
        onClick={handleOpen}
        placeholder="Selecionar…"
        disabled={disabled}
        data-testid={testId}
        inputProps={{ "aria-label": label, readOnly: true }}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <Event fontSize="small" />
            </InputAdornment>
          ),
          endAdornment:
            from || to ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={handleClear}
                  aria-label={`Limpar ${label}`}
                  data-testid={`${testId}-clear`}
                  sx={{ minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
        }}
      />

      <Popover
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 1.5, width: 320 } } }}
        data-testid={`${testId}-popover`}
      >
        <Stack spacing={1.25}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={mode}
            onChange={(_event, next: DateFilterMode | null) => next && setMode(next)}
            aria-label="Tipo de filtro de data"
          >
            <ToggleButton
              value={DateFilterMode.SINGLE}
              data-testid={`${testId}-mode-single`}
            >
              Data única
            </ToggleButton>
            <ToggleButton
              value={DateFilterMode.RANGE}
              data-testid={`${testId}-mode-range`}
            >
              Período
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === DateFilterMode.SINGLE ? (
            <TextField
              fullWidth
              label="Data"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              data-testid={`${testId}-single-input`}
            />
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <TextField
                fullWidth
                label="De"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
                data-testid={`${testId}-from-input`}
              />
              <TextField
                fullWidth
                label="Até"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
                data-testid={`${testId}-to-input`}
              />
            </Box>
          )}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              onClick={() => handleClear()}
              color="secondary"
              data-testid={`${testId}-clear-action`}
            >
              Limpar
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              data-testid={`${testId}-apply`}
            >
              Aplicar
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Uma data única é enviada como início e fim do período.
          </Typography>
        </Stack>
      </Popover>
    </>
  );
}
