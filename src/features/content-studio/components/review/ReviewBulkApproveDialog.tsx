import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import { REVIEW_WORKSPACE_TEXTS } from "../../review-workspace.constants";

/** Escopo da aprovação em lote: a categoria aberta ou tudo (todas as categorias, e depois a publicação). */
export enum BulkApproveScope {
  CATEGORY = "CATEGORY",
  ALL = "ALL",
}

interface ReviewBulkApproveDialogProps {
  scope: BulkApproveScope | null;
  /** Quantos itens serão aprovados. */
  count: number;
  /** Nome da categoria aberta (usado no título do escopo CATEGORY). */
  categoryName: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmação das aprovações em lote: aprovar sem ler é o erro a evitar, então o revisor confirma que revisou. */
export function ReviewBulkApproveDialog({ scope, count, categoryName, busy, onConfirm, onClose }: ReviewBulkApproveDialogProps) {
  const isCategory = scope === BulkApproveScope.CATEGORY;
  const testId = isCategory ? "approve-category" : "approve-all";
  return (
    <Dialog
      open={scope !== null}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      data-testid={`content-studio-review-${testId}-dialog`}
    >
      <DialogTitle>
        {isCategory ? REVIEW_WORKSPACE_TEXTS.approveCategoryTitle(categoryName) : REVIEW_WORKSPACE_TEXTS.approveAllTitle}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>
          {count} {count === 1 ? "item aguarda" : "itens aguardam"} a sua decisão.
        </DialogContentText>
        <DialogContentText>
          {isCategory ? REVIEW_WORKSPACE_TEXTS.approveCategoryBody : REVIEW_WORKSPACE_TEXTS.approveAllBody}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy} data-testid={`content-studio-review-${testId}-cancel`} sx={{ minHeight: 44 }}>
          {REVIEW_WORKSPACE_TEXTS.approveAllCancel}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onConfirm}
          disabled={busy}
          data-testid={`content-studio-review-${testId}-confirm`}
          sx={{ minHeight: 44 }}
        >
          {isCategory ? REVIEW_WORKSPACE_TEXTS.approveCategoryConfirm : REVIEW_WORKSPACE_TEXTS.approveAllConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
