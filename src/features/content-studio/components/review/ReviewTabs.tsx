import { CheckCircle } from "@mui/icons-material";
import { Box, Chip, Divider, Paper, Stack, Tab, Tabs, Tooltip } from "@mui/material";

import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { REVIEW_STAGE_STATUS_COLORS, REVIEW_WORKSPACE_TEXTS } from "../../review-workspace.constants";
import { TRACK_REVIEW_STATE_COLORS, TRACK_REVIEW_STATE_LABELS } from "../../review.constants";
import { openCommentsCount } from "../../review-workspace.utils";
import { ContentStageStatus, type ContentStageResponse, type ContentTrackResponse } from "../../types";
import { TrackReviewState, trackReviewState } from "../../workspace.utils";

const TAB_SX = { minHeight: 48, textTransform: "none", fontWeight: 700 } as const;

interface ReviewNavigationProps {
  tracks: ContentTrackResponse[];
  selectedTrack: string | undefined;
  onSelectTrack: (audience: string) => void;
  stages: ContentStageResponse[];
  selectedStageId: string | undefined;
  onSelectStage: (stageType: string) => void;
}

/**
 * UM só bloco de navegação: categorias liberadas (com o estado de cada uma) e, logo abaixo, os itens da categoria.
 * Antes eram dois cartões empilhados, cada um com a sua moldura.
 */
export function ReviewNavigation({ tracks, selectedTrack, onSelectTrack, stages, selectedStageId, onSelectStage }: ReviewNavigationProps) {
  const selectedStage = stages.find((stage) => stage.id === selectedStageId);
  return (
    <Paper
      elevation={0}
      data-testid="content-studio-review-navigation"
      sx={{ mb: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
    >
      {tracks.length > 0 && (
        <>
          <Box data-testid="content-studio-review-track-tabs">
            <Tabs
              value={tracks.some((track) => track.audience === selectedTrack) ? selectedTrack : false}
              onChange={(_, next: string) => onSelectTrack(next)}
              aria-label="Categorias liberadas para revisão"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ px: 0.5, "& .MuiTab-root": TAB_SX }}
            >
              {tracks.map((track) => {
                const state = trackReviewState(track);
                const published = track.publishedAt !== null;
                // Enviada e sem nenhuma decisão ainda: "Pendente de revisão" (e não só "Em revisão").
                const untouched =
                  state === TrackReviewState.IN_REVIEW && track.stages.every((item) => item.status === ContentStageStatus.IN_REVIEW);
                return (
                  <Tab
                    key={track.id}
                    value={track.audience}
                    data-testid={`content-studio-review-track-${track.audience}`}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{track.audienceName}</span>
                        <Chip
                          size="small"
                          color={published ? "success" : TRACK_REVIEW_STATE_COLORS[state]}
                          label={
                            published
                              ? REVIEW_WORKSPACE_TEXTS.published
                              : untouched
                                ? REVIEW_WORKSPACE_TEXTS.pending
                                : TRACK_REVIEW_STATE_LABELS[state]
                          }
                          sx={{ height: 20, fontSize: "0.675rem", fontWeight: 800 }}
                        />
                      </Stack>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>
          <Divider />
        </>
      )}
      <Box data-testid="content-studio-review-stage-tabs">
        <Tabs
          value={selectedStage ? selectedStage.stageType : false}
          onChange={(_, next: string) => onSelectStage(next)}
          aria-label="Itens da categoria"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 0.5, "& .MuiTab-root": { ...TAB_SX, minHeight: 44 } }}
        >
          {stages.map((stage) => {
            const open = openCommentsCount(stage);
            return (
              <Tab
                key={stage.id}
                value={stage.stageType}
                data-testid={`content-studio-review-stage-${stage.stageType}`}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>
                      {stage.position}. {CONTENT_STAGE_TYPE_LABELS[stage.stageType]}
                    </span>
                    {stage.status === ContentStageStatus.APPROVED ? (
                      <Tooltip title={CONTENT_STAGE_STATUS_LABELS[stage.status]}>
                        <CheckCircle color="success" aria-label={CONTENT_STAGE_STATUS_LABELS[stage.status]} sx={{ fontSize: 18 }} />
                      </Tooltip>
                    ) : stage.status === ContentStageStatus.IN_REVIEW && open === 0 ? null : (
                      // O normal (esperando decisão) não leva selo: só aprovado (ícone), devolvido ou com observação aberta.
                      <Chip
                        size="small"
                        label={
                          open > 0 ? `${CONTENT_STAGE_STATUS_LABELS[stage.status]} · ${open}` : CONTENT_STAGE_STATUS_LABELS[stage.status]
                        }
                        color={REVIEW_STAGE_STATUS_COLORS[stage.status] ?? "default"}
                        sx={{ height: 20, fontSize: "0.675rem", fontWeight: 800, borderRadius: 1 }}
                      />
                    )}
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Box>
    </Paper>
  );
}
