import { AutoAwesome, ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, TextField, Typography } from "@mui/material";

import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { ContentStageStatus, type ContentStageResponse } from "../../types";
import { GENERATION_ALLOWED_STATUSES, REVISION_INSTRUCTIONS_MAX_LENGTH } from "../../workspace.constants";

interface StageGenerationPanelProps {
  stage: ContentStageResponse;
  workspace: StudioWorkspace;
  busy: boolean;
  /** Há alterações de campos sem salvar: gerar de novo as descartaria. */
  dirty: boolean;
  dependenciesReady: boolean;
}

/** "Gerar com IA": recolhível; abre sozinho quando a etapa ainda não tem conteúdo. */
export function StageGenerationPanel({ stage, workspace, busy, dirty, dependenciesReady }: StageGenerationPanelProps) {
  return (
    <Accordion
      key={`gen-${stage.id}`}
      defaultExpanded={!stage.currentVersion}
      disableGutters
      variant="outlined"
      sx={{ borderRadius: 2, "&:before": { display: "none" } }}
      data-testid="content-studio-generation-panel"
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesome color="primary" fontSize="small" />
          <Typography fontWeight={700}>Gerar com IA</Typography>
          <Typography variant="body2" color="text.secondary">
            {stage.currentVersion ? "refazer o conteúdo desta etapa" : "criar o primeiro conteúdo desta etapa"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          <TextField
            label="Instruções para esta geração"
            placeholder="Ex.: use exemplos do cotidiano e linguagem adequada ao público."
            value={workspace.instructions[stage.id] ?? ""}
            disabled={busy || stage.status === ContentStageStatus.GENERATING}
            onChange={(event) => workspace.setInstructions((current) => ({ ...current, [stage.id]: event.target.value }))}
            multiline
            minRows={2}
            inputProps={{ maxLength: REVISION_INSTRUCTIONS_MAX_LENGTH, "data-testid": "content-studio-generation-instructions" }}
          />
          <Button
            data-testid="content-studio-generate-stage"
            variant="contained"
            startIcon={<AutoAwesome />}
            disabled={busy || dirty || !dependenciesReady || !GENERATION_ALLOWED_STATUSES.includes(stage.status)}
            onClick={() => void workspace.handleRequestGeneration(stage)}
            sx={{ alignSelf: "flex-start", minHeight: 44 }}
          >
            {stage.currentVersion ? "Gerar novamente" : "Gerar conteúdo"}
          </Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
