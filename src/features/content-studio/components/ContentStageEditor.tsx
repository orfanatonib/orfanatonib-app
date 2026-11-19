import { useState } from "react";
import { Alert, Box, Tab, Tabs } from "@mui/material";
import { StudioEditorMode, type ContentEditorProps } from "../workspace.types";
import { ContentFieldsEditor } from "./ContentFieldsEditor";
import { ContentDocumentPreview } from "./ContentDocumentPreview";
import { StageDocumentTab } from "./StageDocumentTab";
import { StagePdfTab } from "./StagePdfTab";
import { parseStageDraft } from "../workspace.utils";

/**
 * Editor de uma etapa: documento rico (principal), campos estruturados, prévia rápida e PDF real.
 * `packageId` ausente (ex.: testes) deixa só as abas de campos e prévia.
 */
export function ContentStageEditor({
  stage,
  value,
  disabled,
  onChange,
  packageId,
  fileBaseName,
  onSaveDocument,
  onResetDocument,
  onDocumentDirtyChange,
  fieldsDirty,
}: ContentEditorProps) {
  const rich = Boolean(packageId && onSaveDocument && onResetDocument);
  const [mode, setMode] = useState(rich ? StudioEditorMode.DOCUMENT : StudioEditorMode.EDIT);
  const [documentDirty, setDocumentDirty] = useState(false);
  const content = parseStageDraft(value);

  const handleDirty = (dirty: boolean) => {
    setDocumentDirty(dirty);
    onDocumentDirtyChange?.(dirty);
  };

  return (
    <Box data-testid="content-studio-stage-editor" sx={{ minWidth: 0, maxWidth: "100%" }}>
      <Tabs
        value={mode}
        onChange={(_, next: StudioEditorMode) => setMode(next)}
        sx={{ mb: 3 }}
        aria-label="Exibição do conteúdo"
        variant="scrollable"
        scrollButtons="auto"
      >
        {rich && <Tab value={StudioEditorMode.DOCUMENT} label="Documento" data-testid="content-studio-document-tab" />}
        <Tab value={StudioEditorMode.EDIT} label="Campos" data-testid="content-studio-edit-tab" />
        <Tab value={StudioEditorMode.PREVIEW} label="Prévia rápida" data-testid="content-studio-preview-tab" />
        {rich && <Tab value={StudioEditorMode.PDF} label="PDF" data-testid="content-studio-pdf-tab-button" />}
      </Tabs>

      {rich && (
        <Box hidden={mode !== StudioEditorMode.DOCUMENT} sx={{ display: mode === StudioEditorMode.DOCUMENT ? "block" : "none" }}>
          <StageDocumentTab
            packageId={packageId!}
            stage={stage}
            disabled={disabled}
            onSave={onSaveDocument!}
            onReset={onResetDocument!}
            onDirtyChange={handleDirty}
          />
        </Box>
      )}

      {rich && mode === StudioEditorMode.PDF && (
        <StagePdfTab
          packageId={packageId!}
          stageId={stage.id}
          versionKey={stage.currentVersionId}
          hasUnsavedChanges={documentDirty || Boolean(fieldsDirty)}
          active
          fileBaseName={fileBaseName ?? "material-para-visita"}
        />
      )}

      {mode === StudioEditorMode.EDIT || mode === StudioEditorMode.PREVIEW ? (
        !content ? (
          <Alert severity="error">Não foi possível abrir o conteúdo desta versão.</Alert>
        ) : mode === StudioEditorMode.PREVIEW ? (
          <Box sx={{ bgcolor: "background.paper", p: { xs: 2, md: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <ContentDocumentPreview fieldKey="" value={content} />
          </Box>
        ) : (
          <Box data-testid={`content-studio-stage-content-${stage.id}`}>
            {rich && stage.currentVersion?.contentDocument && (
              <Alert severity="warning" sx={{ mb: 2 }} data-testid="content-studio-fields-warning">
                Esta etapa tem um documento editado à mão. Salvar pelos campos descarta essas edições e volta a montar o documento dos
                campos.
              </Alert>
            )}
            <ContentFieldsEditor
              fieldKey=""
              value={content}
              disabled={disabled}
              onChange={(next) => onChange(JSON.stringify(next, null, 2))}
            />
          </Box>
        )
      ) : null}
    </Box>
  );
}
