import { ArrowForward, CheckCircle, DoneAll, RateReview } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import type { RefObject } from "react";

import { CONTENT_STUDIO_REVIEW_CHECKLIST } from "../../constants";
import { REVIEW_BLOCK_REASONS, REVIEW_NOTE_MAX_LENGTH, REVIEW_WORKSPACE_TEXTS } from "../../review-workspace.constants";
import { ReviewBlockReason } from "../../review-workspace.types";
import { ContentReviewCommentStatus, ContentStageStatus, type ContentStageResponse } from "../../types";
import { formatContentStudioDateTime } from "../../utils";
import { ResolveCommentButton } from "../ResolveCommentButton";
import { commentsNewestFirst } from "../../review-timeline.utils";
import { ReviewCommentBody } from "../ReviewCommentBody";
import { ReviewTimeline, reviewTimelineCount } from "../ReviewTimeline";
import { REVIEW_TIMELINE_TITLE } from "../../review-timeline.constants";

const BLOCK_TEXT: Record<ReviewBlockReason, string> = {
  [ReviewBlockReason.DISABLED]: REVIEW_BLOCK_REASONS.disabled,
  [ReviewBlockReason.PACKAGE_CLOSED]: REVIEW_BLOCK_REASONS.packageClosed,
  [ReviewBlockReason.TRACK_PUBLISHED]: REVIEW_BLOCK_REASONS.trackPublished,
  [ReviewBlockReason.APPROVED]: REVIEW_BLOCK_REASONS.approved,
  [ReviewBlockReason.RETURNED]: REVIEW_BLOCK_REASONS.returned,
  [ReviewBlockReason.NOT_RELEASED]: REVIEW_BLOCK_REASONS.notReleased,
  [ReviewBlockReason.NO_VERSION]: REVIEW_BLOCK_REASONS.noVersion,
  [ReviewBlockReason.VERSION_CHANGED]: REVIEW_BLOCK_REASONS.versionChanged,
};

interface ReviewDecisionCardProps {
  stage: ContentStageResponse;
  block: ReviewBlockReason | null;
  note: string;
  onNoteChange: (text: string) => void;
  noteInputRef: RefObject<HTMLTextAreaElement | null>;
  busy: boolean;
  canDecide: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
  nextLabel: string | null;
  pendingCount: number;
  onNext: () => void;
  onResolveComment: (commentId: string, message: string) => void;
  /** "Aprovar esta categoria": itens pendentes da categoria aberta e se já dá para aprovar em lote. */
  categoryPendingCount: number;
  categoryBlocked: boolean;
  onApproveCategory: () => void;
}

/** A decisão do revisor sobre a etapa aberta: aprovar ou devolver com o ajuste, mais o histórico dela. */
export function ReviewDecisionCard({
  stage,
  block,
  note,
  onNoteChange,
  noteInputRef,
  busy,
  canDecide,
  onApprove,
  onRequestChanges,
  nextLabel,
  pendingCount,
  onNext,
  onResolveComment,
  categoryPendingCount,
  categoryBlocked,
  onApproveCategory,
}: ReviewDecisionCardProps) {
  const open = block === null || block === ReviewBlockReason.VERSION_CHANGED;
  return (
    <Card
      component="section"
      elevation={0}
      data-testid="content-studio-review-decision"
      sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider" }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" component="h2" fontWeight={800} gutterBottom>
          {open ? REVIEW_WORKSPACE_TEXTS.decisionTitle : REVIEW_WORKSPACE_TEXTS.noDecisionTitle}
        </Typography>

        {open ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {REVIEW_WORKSPACE_TEXTS.decisionHint}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={10}
              label={REVIEW_WORKSPACE_TEXTS.feedbackLabel}
              placeholder={REVIEW_WORKSPACE_TEXTS.feedbackPlaceholder}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              inputRef={noteInputRef}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { maxLength: REVIEW_NOTE_MAX_LENGTH, "data-testid": "content-studio-review-feedback-input" },
              }}
              helperText={`${note.length}/${REVIEW_NOTE_MAX_LENGTH} · só é enviado ao devolver a etapa`}
              sx={{ mb: 2 }}
            />
            <Stack spacing={1.25}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircle />}
                data-testid="content-studio-review-approve"
                disabled={!canDecide}
                onClick={onApprove}
                sx={{ borderRadius: 2.5, fontWeight: 800, minHeight: 48, textTransform: "none" }}
              >
                {busy ? "Aprovando…" : REVIEW_WORKSPACE_TEXTS.approve}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<RateReview />}
                data-testid="content-studio-review-request-changes"
                disabled={!canDecide || !note.trim()}
                onClick={onRequestChanges}
                sx={{ borderRadius: 2.5, fontWeight: 700, minHeight: 44, textTransform: "none" }}
              >
                {REVIEW_WORKSPACE_TEXTS.requestChanges}
              </Button>
              {block === null && !note.trim() && (
                <Typography data-testid="content-studio-review-feedback-needed" variant="caption" color="text.secondary">
                  {REVIEW_WORKSPACE_TEXTS.feedbackNeeded}
                </Typography>
              )}
              {block === ReviewBlockReason.VERSION_CHANGED && (
                <Typography data-testid="content-studio-review-block-reason" variant="caption" color="text.secondary">
                  {BLOCK_TEXT[block]}
                </Typography>
              )}
            </Stack>
          </>
        ) : (
          <Typography data-testid="content-studio-review-block-reason" variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {block ? BLOCK_TEXT[block] : ""}
          </Typography>
        )}

        {nextLabel && (
          <Button
            fullWidth
            data-testid="content-studio-review-next-pending"
            endIcon={<ArrowForward />}
            onClick={onNext}
            sx={{ mt: 1, minHeight: 44, fontWeight: 700, textTransform: "none" }}
          >
            {REVIEW_WORKSPACE_TEXTS.nextPending} ({pendingCount})
          </Button>
        )}

        {categoryPendingCount > 0 && (
          <Button
            fullWidth
            variant="outlined"
            color="success"
            startIcon={<DoneAll />}
            data-testid="content-studio-review-approve-category"
            disabled={busy || categoryBlocked}
            onClick={onApproveCategory}
            sx={{ mt: 1.25, borderRadius: 2.5, fontWeight: 700, minHeight: 44, textTransform: "none" }}
          >
            {REVIEW_WORKSPACE_TEXTS.approveCategory} ({categoryPendingCount})
          </Button>
        )}

        <Box sx={{ mt: 2 }}>
          <ReviewHistory stage={stage} busy={busy} onResolveComment={onResolveComment} />
        </Box>

        {/* Sem moldura própria: já está dentro do cartão de decisão (uma camada a menos). */}
        <Accordion
          elevation={0}
          disableGutters
          square
          data-testid="content-studio-review-checklist"
          sx={{ mt: 1.5, bgcolor: "transparent", borderTop: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={700} variant="body2">
              {REVIEW_WORKSPACE_TEXTS.checklistTitle}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {CONTENT_STUDIO_REVIEW_CHECKLIST.map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} slotProps={{ primary: { variant: "body2" } }} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

interface ReviewHistoryProps {
  stage: ContentStageResponse;
  busy: boolean;
  onResolveComment: (commentId: string, message: string) => void;
}

/** Observações abertas (com "resolver") à vista; as resolvidas e o histórico de decisões ficam recolhidos. */
function ReviewHistory({ stage, busy, onResolveComment }: ReviewHistoryProps) {
  if (stage.reviewComments.length === 0 && stage.reviewDecisions.length === 0) return null;
  const open = commentsNewestFirst(stage.reviewComments).filter((comment) => comment.status === ContentReviewCommentStatus.OPEN);
  const resolved = commentsNewestFirst(stage.reviewComments).filter((comment) => comment.status !== ContentReviewCommentStatus.OPEN);
  const events = reviewTimelineCount(stage.reviewDecisions);
  return (
    <Stack spacing={1} data-testid="content-studio-review-history">
      <Typography variant="subtitle2" component="h3" fontWeight={800}>
        {REVIEW_WORKSPACE_TEXTS.historyTitle}
      </Typography>
      {open.map((comment) => (
        <Alert key={comment.id} severity="warning" icon={false} data-testid={`content-studio-review-comment-${comment.id}`}>
          <Stack spacing={1} alignItems="flex-start">
            <ReviewCommentBody comment={comment} replyLabel="Resposta da produção" />
            <ResolveCommentButton
              commentId={comment.id}
              disabled={busy}
              testId={`content-studio-review-resolve-${comment.id}`}
              onResolve={onResolveComment}
            />
          </Stack>
        </Alert>
      ))}
      {resolved.length > 0 && (
        <Accordion disableGutters variant="outlined" data-testid="content-studio-review-resolved">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={800}>
              Observações resolvidas ({resolved.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5} divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
              {resolved.map((comment) => (
                <Box key={comment.id} data-testid={`content-studio-review-comment-${comment.id}`}>
                  <ReviewCommentBody comment={comment} replyLabel="Resposta da produção" />
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
      {events > 0 && (
        <Accordion disableGutters variant="outlined">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={800}>
              {REVIEW_TIMELINE_TITLE} ({events})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ReviewTimeline hideTitle decisions={stage.reviewDecisions} testId="content-studio-review-timeline" />
          </AccordionDetails>
        </Accordion>
      )}
      {stage.status === ContentStageStatus.CHANGES_REQUESTED && (
        <Typography variant="caption" color="text.secondary">
          A produção está ajustando esta etapa.
        </Typography>
      )}
    </Stack>
  );
}
