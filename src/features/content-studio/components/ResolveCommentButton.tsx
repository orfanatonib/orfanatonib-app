import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { REVIEW_NOTE_MAX_LENGTH } from "../review-workspace.constants";

interface ResolveCommentButtonProps {
  commentId: string;
  disabled: boolean;
  testId: string;
  /** Recebe o recado que segue com o item de volta para a revisão. */
  onResolve: (commentId: string, message: string) => void;
}

/** "Resolver e devolver": pede o recado para o revisor antes de devolver o item para a revisão. */
export function ResolveCommentButton({ commentId, disabled, testId, onResolve }: ResolveCommentButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const trimmed = message.trim();

  const confirm = () => {
    onResolve(commentId, trimmed);
    setOpen(false);
    setMessage("");
  };

  return (
    <>
      <Button
        color="inherit"
        size="small"
        disabled={disabled}
        onClick={() => setOpen(true)}
        data-testid={testId}
        sx={{ minHeight: 44, textTransform: "none" }}
      >
        Resolver e devolver
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" data-testid={`${testId}-dialog`}>
        <DialogTitle>Devolver para a revisão</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Conte ao revisor o que foi ajustado. Se você gerar o item de novo e concluí-lo, ele volta para a revisão sozinho,
            sem recado.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Recado para o revisor"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, REVIEW_NOTE_MAX_LENGTH))}
            inputProps={{ "data-testid": `${testId}-message` }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={trimmed.length === 0} onClick={confirm} data-testid={`${testId}-confirm`}>
            Resolver e devolver
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
