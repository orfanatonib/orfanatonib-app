import React from "react";
import { Box, Paper, Stack, Tab, Tabs, Tooltip } from "@mui/material";

import { CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { PROMPT_STAGE_CONFIG, PROMPT_TEXTS } from "../constants";
import { ContentStageType } from "../../types";
import type { PromptLocalDrafts, PromptPreference } from "../types";

interface Props {
  stage: ContentStageType;
  preferences: readonly PromptPreference[];
  drafts: PromptLocalDrafts;
  onChange: (stage: ContentStageType) => void;
}

/**
 * As etapas do material, com a situação de cada uma num ponto colorido:
 * laranja para texto ainda não salvo, azul para etapa personalizada.
 */
export const PromptStageTabs: React.FC<Props> = ({ stage, preferences, drafts, onChange }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
    <Tabs
      data-testid="admin-prompts-stage-tabs"
      value={stage}
      onChange={(_, next: ContentStageType) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="Etapas da lição"
      sx={{
        px: 0.5,
        "& .MuiTab-root": { minHeight: 48, textTransform: "none", fontWeight: 700 },
      }}
    >
      {Object.values(ContentStageType).map((item) => {
        const pending = Boolean(drafts[item]);
        const custom = Boolean(preferences.find((pref) => pref.stage === item)?.customPrompt);
        const state = pending ? PROMPT_TEXTS.pending : custom ? PROMPT_TEXTS.custom : "";
        return (
          <Tab
            key={item}
            data-testid={`admin-prompts-tab-${item.toLowerCase().replaceAll("_", "-")}`}
            data-state={pending ? "pending" : custom ? "custom" : "official"}
            value={item}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>
                  {PROMPT_STAGE_CONFIG[item].icon} {CONTENT_STAGE_TYPE_LABELS[item]}
                </span>
                {state && (
                  <Tooltip title={state}>
                    <Box
                      role="img"
                      aria-label={state}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: pending ? "warning.main" : "primary.main",
                      }}
                    />
                  </Tooltip>
                )}
              </Stack>
            }
          />
        );
      })}
    </Tabs>
  </Paper>
);
