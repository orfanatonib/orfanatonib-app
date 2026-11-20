import { AutoAwesome, EditNote } from "@mui/icons-material";
import { Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField } from "@mui/material";
import { useState, type ReactNode } from "react";

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
  /** Ações da etapa (salvar versão, concluir produção…), na mesma barra do "Gerar conteúdo". */
  actions?: ReactNode;
}

/** Barra de ações da etapa: gerar com IA, instruções extras (em modal) e as ações de salvar/concluir. */
export function StageGenerationPanel({ stage, workspace, busy, dirty, dependenciesReady, actions }: StageGenerationPanelProps) {
  const [open, setOpen] = useState(false);
  const instructions = workspace.instructions[stage.id] ?? "";
  const generating = stage.status === ContentStageStatus.GENERATING;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }} data-testid="content-studio-generation-panel">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(auto-fit, minmax(170px, max-content))" }, gap: 1 }}>
        <Button
          data-testid="content-studio-generate-stage"
          variant="contained"
          startIcon={<AutoAwesome />}
          disabled={busy || dirty || !dependenciesReady || !GENERATION_ALLOWED_STATUSES.includes(stage.status)}
          onClick={() => void workspace.handleRequestGeneration(stage)}
          sx={{ minHeight: 44 }}
        >
          {stage.currentVersion ? "Gerar novamente" : "Gerar conteúdo"}
        </Button>
        <Badge color="primary" variant="dot" invisible={!instructions.trim()} sx={{ display: "flex", "& > button": { flex: 1 } }}>
          <Button
            data-testid="content-studio-generation-instructions-open"
            variant="outlined"
            startIcon={<EditNote />}
            disabled={busy || generating}
            onClick={() => setOpen(true)}
            sx={{ minHeight: 44 }}
          >
            Mais instruções
          </Button>
        </Badge>
        {actions}
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Instruções para esta geração</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            placeholder="Ex.: use exemplos do cotidiano e linguagem adequada ao público."
            value={instructions}
            onChange={(event) => workspace.setInstructions((current) => ({ ...current, [stage.id]: event.target.value }))}
            multiline
            minRows={4}
            inputProps={{ maxLength: REVISION_INSTRUCTIONS_MAX_LENGTH, "data-testid": "content-studio-generation-instructions" }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => workspace.setInstructions((current) => ({ ...current, [stage.id]: "" }))}>
            Limpar
          </Button>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Concluir
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

/** Mesma moldura da barra de geração, só com as ações da etapa (etapas sem o botão "Gerar" da barra). */
export function StageActionsToolbar({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }} data-testid="content-studio-actions-toolbar">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(auto-fit, minmax(170px, max-content))" }, gap: 1 }}>{children}</Box>
    </Paper>
  );
}
