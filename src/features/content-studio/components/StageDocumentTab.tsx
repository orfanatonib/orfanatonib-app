import RestartAlt from "@mui/icons-material/RestartAlt";
import Save from "@mui/icons-material/Save";
import Undo from "@mui/icons-material/Undo";
import { Alert, Box, Button, Chip, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { StudioDocEditor } from "../editor/StudioDocEditor";
import { useStageDocument } from "../hooks/useStageDocument";
import type { ContentStageResponse, TiptapDocument } from "../types";

interface StageDocumentTabProps {
  packageId: string;
  stage: ContentStageResponse;
  disabled: boolean;
  /** Salva o documento como nova versão; devolve `true` se salvou. */
  onSave: (stage: ContentStageResponse, document: TiptapDocument) => Promise<boolean>;
  /** Descarta as edições do documento (volta a montar dos campos); devolve `true` se salvou. */
  onReset: (stage: ContentStageResponse) => Promise<boolean>;
  /** Avisa a página se há edição não salva (para o aviso ao sair). */
  onDirtyChange?: (dirty: boolean) => void;
}

/** Aba "Documento": editor rico (TipTap) da etapa, com salvar (Ctrl+S), descartar e voltar ao gerado dos campos. */
export function StageDocumentTab({ packageId, stage, disabled, onSave, onReset, onDirtyChange }: StageDocumentTabProps) {
  const { data, loading, error, reload } = useStageDocument(packageId, stage.id, stage.currentVersionId);
  const [draft, setDraft] = useState<TiptapDocument | null>(null);
  const [saving, setSaving] = useState(false);

  const baseline = useMemo(() => (data ? JSON.stringify(data.document) : ""), [data]);
  const dirty = !!draft && JSON.stringify(draft) !== baseline;

  // Documento novo do servidor (versão mudou, ou primeira carga) substitui o rascunho.
  useEffect(() => {
    setDraft(data ? data.document : null);
  }, [data]);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  // Fechar a aba com edição pendente pede confirmação do navegador.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = async () => {
    if (!draft || !dirty || saving || disabled) return;
    setSaving(true);
    try {
      await onSave(stage, draft);
    } finally {
      setSaving(false);
    }
  };

  // Ctrl/Cmd+S salva o documento.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (loading && !data) {
    return (
      <Stack spacing={1} data-testid="content-studio-doc-loading">
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  if (error || !draft) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={reload}>
            Tentar novamente
          </Button>
        }
      >
        Não foi possível abrir o documento desta etapa.
      </Alert>
    );
  }

  const empty = draft.content.length === 0;

  return (
    <Stack spacing={2} data-testid="content-studio-doc-tab">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Chip
            size="small"
            color={data?.edited ? "primary" : "default"}
            variant={data?.edited ? "filled" : "outlined"}
            label={data?.edited ? "Documento editado à mão" : "Montado a partir dos campos"}
            data-testid="content-studio-doc-origin"
          />
          {dirty && <Chip size="small" color="warning" label="Alterações não salvas" data-testid="content-studio-doc-dirty" />}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          {data?.edited && !disabled && (
            <Button
              size="small"
              startIcon={<RestartAlt />}
              disabled={saving}
              onClick={() => {
                if (window.confirm("Descartar as edições do documento e voltar a montá-lo a partir dos campos?")) void onReset(stage);
              }}
              data-testid="content-studio-doc-reset"
              sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
            >
              Voltar aos campos
            </Button>
          )}
          <Button
            size="small"
            startIcon={<Undo />}
            disabled={!dirty || saving}
            onClick={() => setDraft(data?.document ?? null)}
            data-testid="content-studio-doc-discard"
            sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
          >
            Descartar alterações
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <Save />}
            disabled={!dirty || saving || disabled}
            onClick={() => void save()}
            data-testid="content-studio-doc-save"
            sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
          >
            Salvar documento
          </Button>
        </Stack>
      </Stack>

      {empty && <Alert severity="info">Esta etapa ainda não tem conteúdo. Gere com a IA ou escreva aqui; ao salvar, o documento vira a versão da etapa.</Alert>}
      {disabled && <Alert severity="info">Esta etapa não pode ser editada agora (em revisão, aprovada ou publicada).</Alert>}

      <Box data-testid="content-studio-doc-editor-wrapper" sx={{ minWidth: 0, maxWidth: "100%", overflowX: "auto" }}>
        <StudioDocEditor initialJson={draft} editable={!disabled && !saving} onChange={setDraft} />
      </Box>
      <Typography variant="caption" color="text.secondary">
        Dica: Ctrl+S salva. O PDF e o DOCX usam a última versão SALVA.
      </Typography>
    </Stack>
  );
}
