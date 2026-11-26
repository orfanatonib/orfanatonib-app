import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { BulkApproveScope, ReviewBulkApproveDialog } from "../components/review/ReviewBulkApproveDialog";
import { ReviewDecisionCard } from "../components/review/ReviewDecisionCard";
import { ReviewHeader } from "../components/review/ReviewHeader";
import { ReviewMobileBar } from "../components/review/ReviewMobileBar";
import { ReviewStagePanel } from "../components/review/ReviewStagePanel";
import { ReviewNavigation } from "../components/review/ReviewTabs";
import { useReviewWorkspace } from "../hooks/useReviewWorkspace";
import { REVIEW_ROUTES, REVIEW_WORKSPACE_TEXTS } from "../review-workspace.constants";
import { ReviewBlockReason } from "../review-workspace.types";

const PAGE_WIDTH = { xs: "98%", md: "95%" } as const;

/**
 * Revisão de UM material (`/adm/estudio/revisao/:id`).
 *
 * Mostra só as categorias que a produção liberou para revisão, uma etapa por vez, em modo leitura, com a decisão
 * (aprovar ou devolver com ajuste) sempre à mão. Cópia adaptada da revisão do Clubinho.
 */
export function ContentReviewPackagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const review = useReviewWorkspace(id);
  const noteInput = useRef<HTMLTextAreaElement | null>(null);
  const [bulkScope, setBulkScope] = useState<BulkApproveScope | null>(null);
  const { contentPackage, track, stage } = review;

  if (review.loading && !contentPackage) {
    return (
      <Box data-testid="content-studio-review-loading" role="status" sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress aria-label="Carregando o material para revisão" />
      </Box>
    );
  }

  if (review.error || !contentPackage) {
    return (
      <Box data-testid="content-studio-review-error" sx={{ width: PAGE_WIDTH, mx: "auto", py: 4 }}>
        <Alert severity="error" action={<Button onClick={() => void review.reload()}>Tentar novamente</Button>}>
          {REVIEW_WORKSPACE_TEXTS.loadError}
        </Alert>
      </Box>
    );
  }

  // Nada foi liberado: a revisão não tem o que mostrar. Não vira a tela de produção por engano.
  if (!track || !stage || !review.headerStatus) {
    return (
      <Box data-testid="content-studio-review-empty" sx={{ width: PAGE_WIDTH, mx: "auto", py: { xs: 2, md: 3 } }}>
        <Alert severity="info">
          <Typography fontWeight={800}>{REVIEW_WORKSPACE_TEXTS.notFoundTitle}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {REVIEW_WORKSPACE_TEXTS.notFoundBody}
          </Typography>
        </Alert>
      </Box>
    );
  }

  const focusNote = () => {
    noteInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    noteInput.current?.focus();
  };

  return (
    <Box data-testid="content-studio-review-workspace" sx={{ width: PAGE_WIDTH, mx: "auto", py: { xs: 2, md: 3 }, pb: { xs: 12, lg: 3 } }}>
      {review.feedback && (
        <Alert
          data-testid="content-studio-review-feedback"
          severity={review.feedback.severity}
          onClose={() => review.setFeedback(null)}
          sx={{ mb: 2 }}
        >
          {review.feedback.message}
        </Alert>
      )}
      {review.notes.recovered && (
        <Alert data-testid="content-studio-review-recovered" severity="info" onClose={review.notes.dismissRecovered} sx={{ mb: 2 }}>
          {REVIEW_WORKSPACE_TEXTS.recoveredNotes}
        </Alert>
      )}

      <ReviewHeader
        contentPackage={contentPackage}
        summary={review.summary}
        status={review.headerStatus}
        busy={review.busy}
        onChanged={review.reload}
        approvableCount={review.approvableCount}
        approveAllBlocked={review.approveAllBlocked}
        onApproveAll={() => setBulkScope(BulkApproveScope.ALL)}
        publishableNames={review.publishableNames}
        firstPublication={review.firstPublication}
        publishRequest={review.publishRequest}
        // Aprovado e publicado: o material já está em Materiais de Visita, é para lá que a revisão leva.
        onPublished={() => navigate(REVIEW_ROUTES.visitMaterialPages)}
      />
      <ReviewBulkApproveDialog
        scope={bulkScope}
        count={bulkScope === BulkApproveScope.CATEGORY ? review.categoryPendingCount : review.approvableCount}
        categoryName={track.audienceName}
        busy={review.busy}
        onClose={() => setBulkScope(null)}
        onConfirm={() => {
          const scope = bulkScope;
          setBulkScope(null);
          if (scope === BulkApproveScope.CATEGORY) void review.approveCategory();
          else void review.approveAll();
        }}
      />

      <ReviewNavigation
        tracks={review.tracks}
        selectedTrack={track.audience}
        onSelectTrack={review.selectTrack}
        stages={review.stages}
        selectedStageId={stage.id}
        onSelectStage={review.selectStage}
      />

      <Box
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" }, gap: { xs: 2, md: 3 }, alignItems: "start" }}
      >
        <ReviewStagePanel
          packageId={contentPackage.id}
          theme={contentPackage.theme}
          track={track}
          stage={stage}
          versionChanged={review.versionChanged}
          onAcknowledge={() => review.acknowledge(stage)}
        />
        <Stack spacing={2} sx={{ minWidth: 0, position: { lg: "sticky" }, top: { lg: 88 } }}>
          <ReviewDecisionCard
            stage={stage}
            block={review.block}
            note={review.note}
            onNoteChange={(text) => review.notes.change(stage.id, text)}
            noteInputRef={noteInput}
            busy={review.busy}
            canDecide={review.canDecide}
            onApprove={() => void review.approve(stage)}
            onRequestChanges={() => void review.requestChanges(stage)}
            nextLabel={review.next ? review.next.stageType : null}
            pendingCount={review.pendingCount}
            onNext={() => review.next && review.selectStage(review.next.stageType)}
            onResolveComment={(commentId, message) => void review.resolveComment(commentId, stage.id, message)}
            categoryPendingCount={review.categoryPendingCount}
            categoryBlocked={review.categoryBlocked}
            onApproveCategory={() => setBulkScope(BulkApproveScope.CATEGORY)}
          />
        </Stack>
      </Box>

      {(review.block === null || review.block === ReviewBlockReason.VERSION_CHANGED) && (
        <ReviewMobileBar
          approving={review.busy}
          approveDisabled={!review.canDecide}
          requestChangesDisabled={review.block !== null && review.block !== ReviewBlockReason.VERSION_CHANGED ? true : review.busy}
          onApprove={() => void review.approve(stage)}
          onFocusFeedback={focusNote}
        />
      )}
    </Box>
  );
}
