import { useState } from "react";
import { Box, Button, Chip, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../constants";
import type { StageNavigationProps } from "../workspace.types";

export function ContentStageNavigation({ track, selectedId, dirtyIds, onSelect }: StageNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Paper
      component="nav"
      aria-label="Etapas do material"
      variant="outlined"
      data-testid="content-studio-stage-navigation"
      sx={{
        p: 2,
        borderRadius: 3,
        width: { xs: "100%", lg: collapsed ? 80 : 260 },
        flexShrink: 0,
        position: { lg: "sticky" },
        top: 88,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {!collapsed && (
          <Typography component="h2" fontWeight={800}>
            Etapas do material
          </Typography>
        )}
        <Tooltip title={collapsed ? "Expandir etapas" : "Recolher etapas"}>
          <IconButton
            aria-label={collapsed ? "Expandir etapas" : "Recolher etapas"}
            aria-expanded={!collapsed}
            data-testid="content-studio-navigation-toggle"
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              minHeight: 44,
              minWidth: 44,
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack spacing={1} direction="column" sx={{ pb: 1 }}>
        {track.stages.map((stage) => (
          <Tooltip key={stage.id} title={collapsed ? CONTENT_STAGE_TYPE_LABELS[stage.stageType] : ""}>
            <Button
              data-testid={`content-studio-stage-tab-${stage.stageType}`}
              aria-current={selectedId === stage.id ? "step" : undefined}
              variant={selectedId === stage.id ? "contained" : "outlined"}
              color={selectedId === stage.id ? "primary" : "inherit"}
              onClick={() => onSelect(stage.id)}
              sx={{
                minHeight: 44,
                minWidth: collapsed ? 44 : 0,
                width: "100%",
                textAlign: "left",
                justifyContent: "flex-start",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: { xs: "nowrap", lg: "wrap" },
                  flexDirection: { xs: "row", lg: "column" },
                }}
              >
                <Typography component="span" fontWeight={700}>
                  {stage.position}
                  {!collapsed && `. ${CONTENT_STAGE_TYPE_LABELS[stage.stageType]}`}
                </Typography>
                {!collapsed && (
                  <Chip
                    size="small"
                    label={dirtyIds.includes(stage.id) ? "Não salvo" : CONTENT_STAGE_STATUS_LABELS[stage.status]}
                    sx={{
                      display: "flex",
                      mt: { xs: 0, lg: 0.5 },
                      width: "fit-content",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
            </Button>
          </Tooltip>
        ))}
      </Stack>
    </Paper>
  );
}
