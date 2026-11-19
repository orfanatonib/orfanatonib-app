import { Alert, Button, Stack, TextField, Typography } from "@mui/material";

import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import {
  ContentPackageStatus,
  ContentReviewCommentStatus,
  ContentReviewDecisionType,
  ContentStageStatus,
  type ContentPackageResponse,
  type ContentStageResponse,
} from "../../types";
import { formatContentStudioDateTime } from "../../utils";

interface StageReviewSectionProps {
  contentPackage: ContentPackageResponse;
  stage: ContentStageResponse;
  workspace: StudioWorkspace;
  busy: boolean;
}

/** Revisão da etapa: aprovar/pedir ajustes, comentários abertos e histórico de decisões. */
export function StageReviewSection({ contentPackage, stage, workspace, busy }: StageReviewSectionProps) {
  const canReview =
    workspace.reviewEnabled &&
    [ContentPackageStatus.IN_REVIEW, ContentPackageStatus.CHANGES_REQUESTED].includes(contentPackage.status) &&
    stage.status === ContentStageStatus.IN_REVIEW;
  return (
    <>
      {canReview && (
        <Stack spacing={2} data-testid="content-studio-review-actions">
          <TextField
            label="Comentário para ajustes"
            multiline
            minRows={2}
            value={workspace.changeMessages[stage.id] ?? ""}
            onChange={(event) => workspace.handleChangeMessage(stage.id, event.target.value)}
          />
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="contained" disabled={busy} onClick={() => void workspace.handleApproveStage(stage)} sx={{ minHeight: 44 }}>
              Aprovar etapa
            </Button>
            <Button variant="outlined" disabled={busy} onClick={() => void workspace.handleRequestChanges(stage)} sx={{ minHeight: 44 }}>
              Solicitar ajustes
            </Button>
          </Stack>
        </Stack>
      )}
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
      {stage.reviewDecisions.length > 0 && (
        <Stack spacing={0.5} mt={1} data-testid={`content-studio-stage-review-history-${stage.id}`}>
          <Typography variant="caption" fontWeight={700}>
            Histórico de decisões
          </Typography>
          {stage.reviewDecisions.map((decision) => (
            <Typography key={decision.id} variant="caption" color="text.secondary">
              {decision.decision === ContentReviewDecisionType.APPROVED ? "Aprovada" : "Ajustes solicitados"} · versão{" "}
              {decision.versionNumber ?? decision.versionId} · {formatContentStudioDateTime(decision.decidedAt)}
            </Typography>
          ))}
        </Stack>
      )}
    </>
  );
}
