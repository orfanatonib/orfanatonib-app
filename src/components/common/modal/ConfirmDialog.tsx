import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, IconButton, Box, CircularProgress,
  type SxProps,
  type Theme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export type ConfirmDialogProps = {
  open: boolean;
  title?: React.ReactNode;
  content?: React.ReactNode;
  shelteredren?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "secondary" | "success" | "error" | "warning" | "info" | "inherit";
  confirmVariant?: "contained" | "outlined" | "text";
  cancelVariant?: "text" | "outlined" | "contained";
  onConfirm: () => void | Promise<unknown>;
  onClose: () => void;
  loading?: boolean;
  autoCloseOnConfirm?: boolean;
  disableBackdropClose?: boolean;
  disableEscapeKeyDown?: boolean;
  fullWidth?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  showCloseIcon?: boolean;
  startAdornment?: React.ReactNode;
  testId?: string;
  titleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actionsSx?: SxProps<Theme>;
};

const isPromiseLike = (value: unknown): value is Promise<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof value.then === "function";

export default function ConfirmDialog({
  open,
  title,
  content,
  shelteredren,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "primary",
  confirmVariant = "contained",
  cancelVariant = "text",
  onConfirm,
  onClose,
  loading,
  autoCloseOnConfirm = true,
  disableBackdropClose,
  disableEscapeKeyDown,
  fullWidth = true,
  maxWidth = "xs",
  showCloseIcon = true,
  startAdornment,
  testId,
  titleSx,
  contentSx,
  actionsSx,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isLoading = loading ?? internalLoading;

  const handleClose = (_: unknown, reason?: "backdropClick" | "escapeKeyDown") => {
    if (isLoading) return; 
    if (disableBackdropClose && reason === "backdropClick") return;
    if (disableEscapeKeyDown && reason === "escapeKeyDown") return;
    onClose();
  };

  const handleConfirm = async () => {
    try {
      const result = onConfirm?.();
      if (loading === undefined && isPromiseLike(result)) {
        setInternalLoading(true);
        await result;
        setInternalLoading(false);
        if (autoCloseOnConfirm) onClose();
      } else if (autoCloseOnConfirm && !isPromiseLike(result)) {
        onClose();
      }
    } catch {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      disableEscapeKeyDown={disableEscapeKeyDown}
      data-testid={testId}
      PaperProps={{
        sx: {
          overflowX: "hidden",
        },
      }}
      sx={{
        "& .MuiDialog-paper": { overflowX: "hidden" },
      }}
    >
      {!!title && (
        <DialogTitle sx={{ pr: showCloseIcon ? 6 : 3, overflowX: "hidden", ...titleSx }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {startAdornment}
            <Typography variant="h6" component="div">{title}</Typography>
          </Box>

          {showCloseIcon && (
            <IconButton
              aria-label="Fechar"
              onClick={onClose}
              edge="end"
              disabled={isLoading}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {(content || shelteredren) && (
        <DialogContent
          sx={{
            pt: title ? 1 : 2,
            overflowX: "hidden",
            "& *": { overflowWrap: "anywhere" },
            ...contentSx,
          }}
        >
          {content ? (
            typeof content === "string"
              ? <Typography>{content}</Typography>
              : content
          ) : shelteredren}
        </DialogContent>
      )}

      <DialogActions sx={{ justifyContent: "flex-end", gap: 1, overflowX: "hidden", ...actionsSx }}>
        <Button
          onClick={onClose}
          variant={cancelVariant}
          disabled={isLoading}
          data-testid={testId ? `${testId}-cancel` : undefined}
          sx={{ color: cancelVariant === "text" ? "#757575" : undefined }}
        >
          {cancelText}
        </Button>

        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant={confirmVariant}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} /> : null}
          data-testid={testId ? `${testId}-confirm` : undefined}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
