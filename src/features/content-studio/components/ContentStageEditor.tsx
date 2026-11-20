import { useState } from "react";
import { Alert, Box, Tab, Tabs } from "@mui/material";
import { StudioEditorMode, type ContentEditorProps } from "../workspace.types";
import { ContentFieldsEditor } from "./ContentFieldsEditor";
import { StageDocumentTab } from "./StageDocumentTab";
import { StagePdfTab } from "./StagePdfTab";
import { parseStageDraft } from "../workspace.utils";

/**
 * Editor de uma etapa: só o documento (editável) e o PDF real. Os campos estruturados e a prévia rápida saíram da tela;
 * o documento é montado a partir dos campos gerados. `packageId` ausente (ex.: testes) deixa só o editor de campos.
 */
const TAB_SX = {
  minWidth: 0,
  px: { xs: 0.5, sm: 2 },
  fontSize: { xs: "0.8rem", sm: "0.875rem" },
} as const;

export function ContentStageEditor({
  stage,
  value,
  disabled,
  onChange,
  packageId,
  fileBaseName,
  audienceName,
  pdfVersionSuffix,
  documentFooter,
  onSaveDocument,
  onResetDocument,
  onDocumentDirtyChange,
  fieldsDirty,
}: ContentEditorProps) {
  const rich = Boolean(packageId && onSaveDocument && onResetDocument);
  const [mode, setMode] = useState(StudioEditorMode.DOCUMENT);
  const [documentDirty, setDocumentDirty] = useState(false);
  const content = parseStageDraft(value);

  const handleDirty = (dirty: boolean) => {
    setDocumentDirty(dirty);
    onDocumentDirtyChange?.(dirty);
  };

  // Sem `packageId` (ex.: testes) não há documento nem PDF: sobra o editor de campos, sem abas.
  if (!rich) {
    return (
      <Box
        data-testid="content-studio-stage-editor"
        sx={{ minWidth: 0, maxWidth: "100%" }}
      >
        {content ? (
          <Box data-testid={`content-studio-stage-content-${stage.id}`}>
            <ContentFieldsEditor
              fieldKey=""
              value={content}
              disabled={disabled}
              onChange={(next) => onChange(JSON.stringify(next, null, 2))}
            />
          </Box>
        ) : (
          <Alert severity="error">
            Não foi possível abrir o conteúdo desta versão.
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box
      data-testid="content-studio-stage-editor"
      sx={{ minWidth: 0, maxWidth: "100%" }}
    >
      <Tabs
        value={mode}
        onChange={(_, next: StudioEditorMode) => setMode(next)}
        sx={{ mb: 3 }}
        aria-label="Exibição do conteúdo"
        variant="fullWidth"
      >
        <Tab
          sx={TAB_SX}
          value={StudioEditorMode.DOCUMENT}
          label="Documento"
          data-testid="content-studio-document-tab"
        />
        <Tab
          sx={TAB_SX}
          value={StudioEditorMode.PDF}
          label="PDF"
          data-testid="content-studio-pdf-tab-button"
        />
      </Tabs>

      <Box
        hidden={mode !== StudioEditorMode.DOCUMENT}
        sx={{ display: mode === StudioEditorMode.DOCUMENT ? "block" : "none" }}
      >
        <StageDocumentTab
          packageId={packageId!}
          stage={stage}
          audienceName={audienceName}
          disabled={disabled}
          onSave={onSaveDocument!}
          onReset={onResetDocument!}
          onDirtyChange={handleDirty}
        />
        {documentFooter}
      </Box>

      {mode === StudioEditorMode.PDF && (
        <StagePdfTab
          packageId={packageId!}
          stageId={stage.id}
          versionKey={
            stage.currentVersionId
              ? `${stage.currentVersionId}${pdfVersionSuffix ?? ""}`
              : null
          }
          hasUnsavedChanges={documentDirty || Boolean(fieldsDirty)}
          active
          fileBaseName={fileBaseName ?? "material-para-visita"}
        />
      )}
    </Box>
  );
}
