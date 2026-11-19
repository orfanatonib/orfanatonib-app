import ArrowForward from "@mui/icons-material/ArrowForward";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Groups from "@mui/icons-material/Groups";
import PictureAsPdfOutlined from "@mui/icons-material/PictureAsPdfOutlined";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import ListingCard from "@/components/common/listing/ListingCard";
import type { ListingBadge } from "@/components/common/listing";

import { CONTENT_PACKAGE_STATUS_LABELS } from "../constants";
import { PACKAGE_STATUS_COLORS } from "../period.utils";
import { PRODUCTION_LIST_TEXTS } from "../production-list.constants";
import { canArchivePackage, canExportPackage, nextStep, relativeTimeLabel } from "../production-list.utils";
import { audienceNames, pluralize, stageProgress } from "../production.utils";
import { ContentPackageStatus, type ContentAudienceDefinitionResponse, type ContentPackageListItemResponse } from "../types";
import { PackageStageSegments } from "./PackageStageSegments";

interface PackageCardProps {
  item: ContentPackageListItemResponse;
  audiences: readonly ContentAudienceDefinitionResponse[];
  /** Material cujo PDF está sendo baixado agora, se houver. */
  downloadingId: string | null;
  onOpen: (packageId: string) => void;
  onDownload: (item: ContentPackageListItemResponse) => void;
  onArchive: (item: ContentPackageListItemResponse) => void;
}

/** Um material para visita na listagem: onde ele está, o que fazer agora e as ações que valem. */
export function PackageCard({ item, audiences, downloadingId, onOpen, onDownload, onArchive }: PackageCardProps) {
  const progress = stageProgress(item);
  const step = nextStep(item);
  const statusColor = PACKAGE_STATUS_COLORS[item.status];
  const failed = item.failedStagesCount > 0;
  const generating = item.generatingStagesCount > 0;
  const names = audienceNames(item.audiences ?? [], audiences);

  const badges: ListingBadge[] = [{ label: CONTENT_PACKAGE_STATUS_LABELS[item.status], color: statusColor }];
  if (failed) badges.push({ label: PRODUCTION_LIST_TEXTS.failedBadge, color: "error" });
  if (generating) badges.push({ label: PRODUCTION_LIST_TEXTS.generatingBadge, color: "info" });

  return (
    <ListingCard
      data-testid={`content-studio-package-card-${item.id}`}
      avatar={<AutoAwesome fontSize="small" />}
      title={item.theme}
      subtitle={item.biblicalReferences}
      accent={failed ? "error" : statusColor}
      badges={badges}
      meta={[
        {
          icon: <Groups sx={{ fontSize: 16 }} />,
          label: names.length > 0 ? names.join(", ") : `${item.tracksCount} ${pluralize(item.tracksCount, "faixa", "faixas")}`,
        },
      ]}
      onClick={() => onOpen(item.id)}
      stackedFooter
      footer={
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <PackageStageSegments segments={item.stageSegments ?? []} audiences={audiences} />
          <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              Mexido {relativeTimeLabel(item.updatedAt)}
            </Typography>
            <Typography
              data-testid={`content-studio-package-progress-${item.id}`}
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ flexShrink: 0 }}
            >
              {progress.approved} de {progress.required} etapas
            </Typography>
          </Stack>
        </Box>
      }
      actions={
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ flex: 1, width: "100%", minWidth: 0 }}>
          <Button
            variant="contained"
            color={step.color}
            endIcon={<ArrowForward />}
            aria-label={`Abrir ${item.theme}: ${step.label}`}
            data-testid={`content-studio-package-${item.id}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(item.id);
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              justifyContent: "space-between",
              "& .MuiButton-endIcon": { flexShrink: 0 },
            }}
          >
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {step.label}
            </Box>
          </Button>

          {canExportPackage(item) && (
            <Tooltip title={PRODUCTION_LIST_TEXTS.pdfTooltip}>
              <span>
                <IconButton
                  color="secondary"
                  data-testid={`content-studio-package-download-${item.id}`}
                  disabled={Boolean(downloadingId)}
                  sx={{ minWidth: 44, minHeight: 44 }}
                  aria-label={`Baixar PDF de ${item.theme}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDownload(item);
                  }}
                >
                  {downloadingId === item.id ? <CircularProgress size={20} aria-label="Baixando PDF" /> : <PictureAsPdfOutlined fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          )}

          {item.status !== ContentPackageStatus.ARCHIVED && (
            <Tooltip title={canArchivePackage(item) ? PRODUCTION_LIST_TEXTS.archiveTooltip : PRODUCTION_LIST_TEXTS.archiveBlockedTooltip}>
              <span>
                <IconButton
                  color="error"
                  data-testid={`content-studio-package-archive-${item.id}`}
                  disabled={!canArchivePackage(item)}
                  sx={{ minWidth: 44, minHeight: 44 }}
                  aria-label={`Arquivar ${item.theme}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onArchive(item);
                  }}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      }
    />
  );
}
