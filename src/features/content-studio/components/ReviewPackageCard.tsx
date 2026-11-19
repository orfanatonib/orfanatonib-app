import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import FactCheck from "@mui/icons-material/FactCheck";
import Groups from "@mui/icons-material/Groups";
import { Box, Button, LinearProgress, Typography } from "@mui/material";

import ListingCard from "@/components/common/listing/ListingCard";

import { CONTENT_PACKAGE_STATUS_LABELS } from "../constants";
import { PACKAGE_STATUS_COLORS } from "../period.utils";
import { audienceNames, pluralize } from "../production.utils";
import { relativeTimeLabel } from "../production-list.utils";
import { reviewCardAction, reviewPackageSummary, reviewProgressText } from "../review-list.utils";
import { ContentPackageStatus, type ContentAudienceDefinitionResponse, type ContentPackageListItemResponse } from "../types";
import { PackageStageSegments } from "./PackageStageSegments";

interface ReviewPackageCardProps {
  item: ContentPackageListItemResponse;
  audiences: readonly ContentAudienceDefinitionResponse[];
  onOpen: (packageId: string) => void;
}

/** Um material na fila de revisão: situação, andamento da revisão por etapa e o próximo passo do revisor. */
export function ReviewPackageCard({ item, audiences, onOpen }: ReviewPackageCardProps) {
  const summary = reviewPackageSummary(item);
  const action = reviewCardAction(item.status);
  const statusColor = PACKAGE_STATUS_COLORS[item.status];
  const names = audienceNames(item.audiences ?? [], audiences);
  const done = item.status === ContentPackageStatus.PUBLISHED || item.status === ContentPackageStatus.READY_FOR_PUBLICATION;

  return (
    <ListingCard
      data-testid={`content-studio-review-card-${item.id}`}
      avatar={<FactCheck fontSize="small" />}
      title={item.theme}
      subtitle={item.biblicalReferences}
      accent={summary.returned > 0 ? "warning" : statusColor}
      badges={[{ label: CONTENT_PACKAGE_STATUS_LABELS[item.status], color: statusColor }]}
      meta={[
        { icon: <Groups sx={{ fontSize: 16 }} />, label: names.length > 0 ? names.join(", ") : `${item.tracksCount} ${pluralize(item.tracksCount, "faixa", "faixas")}` },
        { label: `Mexido ${relativeTimeLabel(item.updatedAt)}` },
      ]}
      onClick={() => onOpen(item.id)}
      footer={
        <Box sx={{ mt: 1 }}>
          <PackageStageSegments segments={item.stageSegments ?? []} audiences={audiences} />
          <Typography
            data-testid={`content-studio-review-card-progress-${item.id}`}
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ display: "block", mt: 0.75, mb: 0.5 }}
          >
            {reviewProgressText(summary)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={summary.percent}
            color={summary.percent === 100 ? "success" : "primary"}
            aria-label={`${summary.percent}% das etapas aprovadas`}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      }
      actions={
        <Button
          fullWidth
          variant={action.variant}
          color={action.color}
          endIcon={done ? <CheckCircle /> : <ArrowForward />}
          data-testid={`content-studio-review-open-${item.id}`}
          aria-label={`${action.label}: ${item.theme}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item.id);
          }}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", minHeight: 44 }}
        >
          {action.label}
        </Button>
      }
    />
  );
}
