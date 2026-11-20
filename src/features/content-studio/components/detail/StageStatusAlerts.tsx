import { Alert } from "@mui/material";

import { CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { generationErrorMessage, isStageWorking, progressJobFor } from "../../generation.utils";
import { GenerationConnectionState } from "../../stream.utils";
import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { GenerationProgressPanel } from "../activity/GenerationProgressPanel";
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
  const awaiting = workspace.awaitingImages[stage.id] === true;
  const working = isStageWorking(stage, job, awaiting);
  return (
    <>
      {working && (
        <GenerationProgressPanel
          job={progressJobFor(job, awaiting)}
          reconnecting={workspace.generationConnection === GenerationConnectionState.RECONNECTING}
          onCancel={workspace.generationEnabled && !locked ? () => void workspace.handleCancelGeneration(stage) : undefined}
          cancelDisabled={busy}
        />
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
