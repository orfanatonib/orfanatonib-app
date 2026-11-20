import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import FactCheck from "@mui/icons-material/FactCheck";
import Groups from "@mui/icons-material/Groups";
import { Box, Button, Typography } from "@mui/material";

import ListingCard from "@/components/common/listing/ListingCard";

import { reviewListStatusView } from "../package-list-status.utils";
import { audienceNames, pluralize } from "../production.utils";
import { relativeTimeLabel } from "../production-list.utils";
import { releasedListSummary, releasedSegmentAudiences, releasedSegments, reviewProgressText } from "../review-workspace.utils";
import { ContentPackageStatus, type ContentAudienceDefinitionResponse, type ContentPackageListItemResponse } from "../types";
import { PackageStageSegments } from "./PackageStageSegments";

interface ReviewPackageCardProps {
  item: ContentPackageListItemResponse;
  audiences: readonly ContentAudienceDefinitionResponse[];
  onOpen: (packageId: string) => void;
}

/** Um material na fila de revisão: situação, andamento da revisão por etapa e o próximo passo do revisor. */
export function ReviewPackageCard({ item, audiences, onOpen }: ReviewPackageCardProps) {
  // O cartão só fala do que foi liberado para revisão: categorias ainda em produção não entram na conta nem na tela.
  const segments = releasedSegments(item.stageSegments ?? []);
  const summary = releasedListSummary(item);
  const releasedAudiences = releasedSegmentAudiences(item.stageSegments ?? []);
  // Status do ponto de vista da REVISÃO (só aqui existem "Iniciar revisão" e "Continuar revisão").
  const view = reviewListStatusView(item);
  const action = { label: view.action, variant: view.actionVariant, color: view.actionColor };
  const statusColor = view.color;
  const names = audienceNames(releasedAudiences.length > 0 ? releasedAudiences : (item.audiences ?? []), audiences);
  const done = item.status === ContentPackageStatus.PUBLISHED || item.status === ContentPackageStatus.READY_FOR_PUBLICATION;

  return (
    <ListingCard
      data-testid={`content-studio-review-card-${item.id}`}
      avatar={<FactCheck fontSize="small" />}
      title={item.theme}
      subtitle={item.biblicalReferences}
      accent={summary.returned > 0 ? "warning" : statusColor}
      badges={[{ label: view.label, color: statusColor }]}
      meta={[
        { icon: <Groups sx={{ fontSize: 16 }} />, label: names.length > 0 ? names.join(", ") : `${item.tracksCount} ${pluralize(item.tracksCount, "faixa", "faixas")}` },
        { label: `Mexido ${relativeTimeLabel(item.updatedAt)}` },
      ]}
      onClick={() => onOpen(item.id)}
      stackedFooter
      footer={
        <Box sx={{ mt: 1 }}>
          <PackageStageSegments segments={segments} audiences={audiences} />
          <Typography
            data-testid={`content-studio-review-card-progress-${item.id}`}
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ display: "block", mt: 0.75 }}
          >
            {summary.total > 0 ? reviewProgressText(summary) : "Nenhuma categoria foi enviada para revisão ainda"}
          </Typography>
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
