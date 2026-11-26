import { Save, TaskAlt } from "@mui/icons-material";
import { Button } from "@mui/material";

import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { ContentStageStatus, type ContentStageResponse } from "../../types";
import { MANUAL_EDIT_ALLOWED_STATUSES } from "../../workspace.constants";
import { stageDraftValue } from "../../workspace.utils";

interface StageActionsBarProps {
  stage: ContentStageResponse;
  workspace: StudioWorkspace;
  busy: boolean;
  dirty: boolean;
  conflict: boolean;
  /** Item concluído: a página leva ao próximo item (sem gerar nada sozinha). */
  onCompleted?: () => void;
}

/** Salvar versão (campos), descartar rascunho e concluir o item (concluir NÃO envia para a revisão). */
export function StageActionsBar({ stage, workspace, busy, dirty, conflict, onCompleted }: StageActionsBarProps) {
  return (
    <>
      <Button
        data-testid="content-studio-save-stage"
        variant="outlined"
        startIcon={<Save />}
        disabled={busy || conflict || !dirty || !MANUAL_EDIT_ALLOWED_STATUSES.includes(stage.status)}
        onClick={() => void workspace.handleSaveContent(stage)}
        sx={{ minHeight: 44 }}
      >
        Salvar versão
      </Button>
      {dirty && (
        <Button
          data-testid="content-studio-discard-stage"
          color="inherit"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Descartar as alterações não salvas desta etapa?"))
              workspace.handleDraftChange(stage.id, stageDraftValue(stage));
          }}
          sx={{ minHeight: 44, gridColumn: { xs: "1 / -1", sm: "auto" } }}
        >
          Descartar alterações
        </Button>
      )}
      <Button
        data-testid="content-studio-complete-stage"
        variant="contained"
        startIcon={<TaskAlt />}
        disabled={busy || dirty || !stage.currentVersionId || stage.status !== ContentStageStatus.DRAFT}
        onClick={() =>
          void workspace.handleCompleteProduction(stage).then((done) => {
            if (done) onCompleted?.();
          })
        }
        sx={{ minHeight: 44 }}
      >
        Concluir este item
      </Button>
    </>
  );
}
