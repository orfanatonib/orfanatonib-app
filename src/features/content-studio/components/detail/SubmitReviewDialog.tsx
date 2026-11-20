import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import {
  SUBMIT_REVIEW_TEXTS,
  TRACK_REVIEW_STATE_COLORS,
  TRACK_REVIEW_STATE_LABELS,
} from "../../review.constants";
import type { ContentAudience, ContentTrackResponse } from "../../types";
import { TrackReviewState, trackReviewState } from "../../workspace.utils";

interface SubmitReviewDialogProps {
  open: boolean;
  tracks: readonly ContentTrackResponse[];
  busy: boolean;
  onClose: () => void;
  /** Categorias escolhidas; `undefined` envia todas as prontas. */
  onSubmit: (audiences: readonly ContentAudience[]) => void;
}

/** Envio para revisão por categoria: uma de cada vez, várias ou todas as que já estão prontas. */
export function SubmitReviewDialog({ open, tracks, busy, onClose, onSubmit }: SubmitReviewDialogProps) {
  const ready = tracks.filter((track) => trackReviewState(track) === TrackReviewState.READY_TO_SUBMIT);
  const [selected, setSelected] = useState<readonly ContentAudience[]>([]);

  const toggle = (audience: ContentAudience) =>
    setSelected((current) =>
      current.includes(audience) ? current.filter((item) => item !== audience) : [...current, audience],
    );
  const allSelected = ready.length > 0 && ready.every((track) => selected.includes(track.audience));

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" data-testid="content-studio-submit-review-dialog">
      <DialogTitle>{SUBMIT_REVIEW_TEXTS.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography color="text.secondary">{SUBMIT_REVIEW_TEXTS.intro}</Typography>
          {ready.length === 0 && <Typography>{SUBMIT_REVIEW_TEXTS.none}</Typography>}
          {ready.length > 1 && (
            <FormControlLabel
              label={SUBMIT_REVIEW_TEXTS.all}
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={selected.length > 0 && !allSelected}
                  onChange={() => setSelected(allSelected ? [] : ready.map((track) => track.audience))}
                  inputProps={{ "data-testid": "content-studio-submit-review-all" } as object}
                />
              }
            />
          )}
          {tracks.map((track) => {
            const state = trackReviewState(track);
            const isReady = state === TrackReviewState.READY_TO_SUBMIT;
            return (
              <Stack key={track.id} direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <FormControlLabel
                  disabled={!isReady}
                  label={track.audienceName}
                  control={
                    <Checkbox
                      checked={selected.includes(track.audience)}
                      onChange={() => toggle(track.audience)}
                      inputProps={{ "data-testid": `content-studio-submit-review-${track.audience}` } as object}
                    />
                  }
                />
                <Chip
                  size="small"
                  color={TRACK_REVIEW_STATE_COLORS[state]}
                  variant={state === TrackReviewState.IN_PRODUCTION ? "outlined" : "filled"}
                  label={state === TrackReviewState.IN_PRODUCTION ? SUBMIT_REVIEW_TEXTS.notReady : TRACK_REVIEW_STATE_LABELS[state]}
                />
              </Stack>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={busy} onClick={onClose} sx={{ minHeight: 44 }}>
          {SUBMIT_REVIEW_TEXTS.cancel}
        </Button>
        <Button
          variant="contained"
          disabled={busy || selected.length === 0}
          onClick={() => onSubmit(selected)}
          data-testid="content-studio-submit-review-confirm"
          sx={{ minHeight: 44 }}
        >
          {allSelected && ready.length > 1 ? SUBMIT_REVIEW_TEXTS.confirmAll : SUBMIT_REVIEW_TEXTS.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
