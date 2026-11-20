import { Alert, Button, Stack, Typography } from "@mui/material";

import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { ContentReviewCommentStatus, type ContentStageResponse } from "../../types";
import { ReviewTimeline } from "../ReviewTimeline";
import { formatContentStudioDateTime } from "../../utils";

interface StageReviewSectionProps {
  stage: ContentStageResponse;
  workspace: StudioWorkspace;
  busy: boolean;
}

/**
 * O que a revisão disse sobre a etapa: observações (a produção as resolve depois de ajustar) e histórico de decisões.
 * Aprovar e devolver acontecem SÓ na tela de revisão; a produção não decide.
 */
export function StageReviewSection({ stage, workspace, busy }: StageReviewSectionProps) {
  return (
    <>
      {stage.reviewComments.length > 0 && (
        <Stack spacing={0.75} mt={1} data-testid={`content-studio-stage-comments-${stage.id}`}>
          {stage.reviewComments.map((comment) => (
            <Alert
              key={comment.id}
              severity={comment.status === ContentReviewCommentStatus.OPEN ? "warning" : "success"}
              data-testid={`content-studio-stage-comment-${comment.id}`}
              action={
                comment.status === ContentReviewCommentStatus.OPEN ? (
                  <Button
                    color="inherit"
                    size="small"
                    disabled={busy}
                    onClick={() => void workspace.resolveComment(comment.id, stage.id)}
                    data-testid={`content-studio-resolve-comment-${comment.id}`}
                  >
                    Resolver
                  </Button>
                ) : null
              }
            >
              {comment.message}
              <Typography component="div" variant="caption" mt={0.5}>
                Versão {stage.currentVersion?.id === comment.versionId ? stage.currentVersion.versionNumber : comment.versionId}
                {" · "}
                {formatContentStudioDateTime(comment.createdAt)}
              </Typography>
            </Alert>
          ))}
        </Stack>
      )}
      <ReviewTimeline decisions={stage.reviewDecisions} testId={`content-studio-stage-review-history-${stage.id}`} />
    </>
  );
}
