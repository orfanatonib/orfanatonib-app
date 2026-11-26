import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import type { ContentPackageListItemResponse } from "../types";

interface PackageArchiveDialogProps {
  item: ContentPackageListItemResponse | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirma o arquivamento: o material sai da lista principal, mas continua em "Arquivado". */
export function PackageArchiveDialog({ item, pending, error, onCancel, onConfirm }: PackageArchiveDialogProps) {
  return (
    <Dialog open={!!item} onClose={pending ? undefined : onCancel} aria-labelledby="package-archive-title" data-testid="content-studio-archive-dialog">
      <DialogTitle id="package-archive-title">Arquivar material?</DialogTitle>
      <DialogContent>
        <DialogContentText>“{item?.theme}” sai da lista de produção e deixa de aceitar edição. Você ainda o encontra no filtro “Arquivado”.</DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} data-testid="content-studio-archive-error">
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={pending} sx={{ minHeight: 44 }}>
          Cancelar
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={pending} data-testid="content-studio-archive-confirm" sx={{ minHeight: 44 }}>
          {pending ? "Arquivando…" : "Arquivar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
