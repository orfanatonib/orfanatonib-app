import { DoneAll } from "@mui/icons-material";
import { Box, Button, Chip, LinearProgress, Stack, Typography } from "@mui/material";

import { REVIEW_WORKSPACE_TEXTS } from "../../review-workspace.constants";
import type { ReviewHeaderStatus, ReviewSummary } from "../../review-workspace.types";
import { reviewProgressText } from "../../review-workspace.utils";
import type { ContentPackageResponse } from "../../types";
import { PackagePublication } from "../detail/PackagePublication";

interface ReviewHeaderProps {
  contentPackage: ContentPackageResponse;
  summary: ReviewSummary;
  status: ReviewHeaderStatus;
  busy: boolean;
  onChanged: () => Promise<void> | void;
  /** Itens que esperam decisão e o botão "Aprovar tudo". */
  approvableCount: number;
  approveAllBlocked: boolean;
  onApproveAll: () => void;
  /** Categorias que a publicação levaria agora, e se esta é a primeira publicação do material. */
  publishableNames: readonly string[];
  firstPublication: boolean;
  publishRequest: number;
  onPublished: () => void;
}

/**
 * Identidade do material, andamento da revisão e as ações do material (aprovar tudo, publicar).
 * Sem moldura: é o topo da página, não mais uma camada. O andamento aparece UMA vez (linha + barra); o selo só entra
 * quando diz algo que a linha não diz (pronto para publicar, publicando, publicado).
 */
export function ReviewHeader({
  contentPackage,
  summary,
  status,
  busy,
  onChanged,
  approvableCount,
  approveAllBlocked,
  onApproveAll,
  publishableNames,
  firstPublication,
  publishRequest,
  onPublished,
}: ReviewHeaderProps) {
  const allApproved = summary.total > 0 && summary.approved === summary.total;
  return (
    <Box
      component="header"
      data-testid="content-studio-review-header"
      sx={{
        mb: 2,
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 280px" },
        gap: 2,
        alignItems: "center",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {status.color !== "warning" && (
          <Chip
            data-testid="content-studio-review-status-chip"
            size="small"
            label={status.label}
            color={status.color}
            sx={{ fontWeight: 800, borderRadius: 1.5, mb: 0.75 }}
          />
        )}
        <Typography
          component="h1"
          fontWeight={800}
          sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" }, lineHeight: 1.25, overflowWrap: "anywhere" }}
        >
          {contentPackage.theme}
        </Typography>
        <Typography color="text.secondary" fontWeight={600} sx={{ mb: 1.25, overflowWrap: "anywhere" }}>
          {contentPackage.biblicalReferences}
        </Typography>
        <Box sx={{ maxWidth: 560 }}>
          <Typography
            data-testid="content-studio-review-progress"
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            {reviewProgressText(summary)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={summary.percent}
            color={allApproved ? "success" : "primary"}
            aria-label="Progresso da revisão"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Box>
      <Stack gap={1} sx={{ minWidth: 0 }}>
        {approvableCount > 0 && (
          <Button
            data-testid="content-studio-review-approve-all"
            variant="contained"
            color="success"
            startIcon={<DoneAll />}
            disabled={busy || approveAllBlocked}
            onClick={onApproveAll}
            sx={{ minHeight: 44, borderRadius: 3, fontWeight: 800, textTransform: "none" }}
          >
            {REVIEW_WORKSPACE_TEXTS.approveAll} ({approvableCount})
          </Button>
        )}
        {approvableCount > 0 && approveAllBlocked && (
          <Typography variant="caption" color="text.secondary" data-testid="content-studio-review-approve-all-blocked">
            {REVIEW_WORKSPACE_TEXTS.approveAllBlocked}
          </Typography>
        )}
        <PackagePublication
          packageId={contentPackage.id}
          status={contentPackage.status}
          disabled={busy}
          onChanged={onChanged}
          categoryNames={publishableNames}
          firstPublication={firstPublication}
          onPublished={onPublished}
          openRequest={publishRequest}
        />
        {!allApproved ? (
          <Typography variant="caption" color="text.secondary" textAlign={{ xs: "left", md: "center" }}>
            {REVIEW_WORKSPACE_TEXTS.publishHint}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
