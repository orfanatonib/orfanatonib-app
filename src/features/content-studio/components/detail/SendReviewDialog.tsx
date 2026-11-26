import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import { SEND_REVIEW_TEXTS } from "../../review.constants";

interface SendReviewDialogProps {
  open: boolean;
  /** Nomes das categorias que serão enviadas. */
  names: readonly string[];
  /** Envio geral (todas as categorias prontas) em vez de uma categoria. */
  all: boolean;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirma o envio para a revisão: só acontece quando o usuário manda, e só das categorias indicadas. */
export function SendReviewDialog({ open, names, all, busy, onConfirm, onClose }: SendReviewDialogProps) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" data-testid="content-studio-send-review-dialog">
      <DialogTitle>{all ? SEND_REVIEW_TEXTS.titleAll : SEND_REVIEW_TEXTS.title(names.join(", "))}</DialogTitle>
      <DialogContent>
        <DialogContentText data-testid="content-studio-send-review-names" sx={{ mb: 1 }}>
          {all ? SEND_REVIEW_TEXTS.allIntro : SEND_REVIEW_TEXTS.intro}
          {names.length > 0 && (
            <>
              {" "}
              <strong>{names.join(", ")}</strong>.
            </>
          )}
        </DialogContentText>
        <DialogContentText>{SEND_REVIEW_TEXTS.effect}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={busy} onClick={onClose} data-testid="content-studio-send-review-cancel" sx={{ minHeight: 44 }}>
          {SEND_REVIEW_TEXTS.cancel}
        </Button>
        <Button
          variant="contained"
          disabled={busy}
          onClick={onConfirm}
          data-testid="content-studio-send-review-confirm"
          sx={{ minHeight: 44 }}
        >
          {SEND_REVIEW_TEXTS.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
