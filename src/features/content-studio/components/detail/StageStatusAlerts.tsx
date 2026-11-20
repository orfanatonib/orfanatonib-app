import { Alert, Button, CircularProgress } from "@mui/material";

import { CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { generationErrorMessage, generationStatusLabel } from "../../generation.utils";
import { GenerationConnectionState } from "../../stream.utils";
import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { ContentStageStatus, type ContentStageResponse } from "../../types";

interface StageStatusAlertsProps {
  stage: ContentStageResponse;
  workspace: StudioWorkspace;
  busy: boolean;
  locked: boolean;
  dependenciesReady: boolean;
  conflict: boolean;
}

/** Avisos do estado da etapa: gerando, desatualizada, falha, dependências e conflito de versão. */
export function StageStatusAlerts({ stage, workspace, busy, locked, dependenciesReady, conflict }: StageStatusAlertsProps) {
  const job = workspace.generationJobs[stage.id];
  return (
    <>
      {stage.status === ContentStageStatus.GENERATING && (
        <Alert
          icon={<CircularProgress size={20} />}
          data-testid="content-studio-generation-progress"
          action={
            workspace.generationEnabled && !locked ? (
              <Button disabled={busy} onClick={() => void workspace.handleCancelGeneration(stage)} sx={{ minHeight: 44 }}>
                Cancelar geração
              </Button>
            ) : undefined
          }
        >
          {job ? generationStatusLabel(job.status) : "Gerando conteúdo."} Você pode acompanhar outras etapas enquanto aguarda. Se a página
          cair ou for atualizada, a geração continua e o acompanhamento volta sozinho.
          {job?.attempts > 1 && ` (tentativa ${job.attempts})`}
          {workspace.generationConnection === GenerationConnectionState.RECONNECTING && (
            <span data-testid="content-studio-generation-reconnecting"> Reconectando ao acompanhamento…</span>
          )}
        </Alert>
      )}
      {stage.status === ContentStageStatus.STALE && (
        <Alert severity="warning">Uma etapa anterior mudou. Confira e atualize este conteúdo antes de concluir.</Alert>
      )}
      {stage.status === ContentStageStatus.FAILED && (
        <Alert severity="error" data-testid="content-studio-generation-error">
          {generationErrorMessage(job ?? null)} Tente novamente ou edite o conteúdo manualmente.
        </Alert>
      )}
      {!dependenciesReady && stage.dependencies.length > 0 && (
        <Alert severity="info">
          Prepare primeiro: {stage.dependencies.map((dependency) => CONTENT_STAGE_TYPE_LABELS[dependency]).join(", ")}.
        </Alert>
      )}
      {conflict && (
        <Alert severity="warning" data-testid="content-studio-version-conflict">
          Existe uma versão mais recente no servidor. Seu rascunho foi preservado. Copie o que deseja manter e descarte as alterações para
          carregar a versão atual antes de editar novamente.
        </Alert>
      )}
    </>
  );
}
