import { useState } from "react";
import { Alert, Box, Tab, Tabs } from "@mui/material";
import { StudioEditorMode, type ContentEditorProps } from "../workspace.types";
import { ContentFieldsEditor } from "./ContentFieldsEditor";
import { ContentDocumentPreview } from "./ContentDocumentPreview";
import { parseStageDraft } from "../workspace.utils";

export function ContentStageEditor({
  stage,
  value,
  disabled,
  onChange,
}: ContentEditorProps) {
  const [mode, setMode] = useState(StudioEditorMode.EDIT);
  const content = parseStageDraft(value);
  return (
    <Box data-testid="content-studio-stage-editor">
      <Tabs
        value={mode}
        onChange={(_, next: StudioEditorMode) => setMode(next)}
        sx={{ mb: 3 }}
        aria-label="Exibição do conteúdo"
      >
        <Tab
          value={StudioEditorMode.EDIT}
          label="Editar conteúdo"
          data-testid="content-studio-edit-tab"
        />
        <Tab
          value={StudioEditorMode.PREVIEW}
          label="Prévia do material"
          data-testid="content-studio-preview-tab"
        />
      </Tabs>
      {!content ? (
        <Alert severity="error">
          Não foi possível abrir o conteúdo desta versão.
        </Alert>
      ) : mode === StudioEditorMode.PREVIEW ? (
        <Box
          sx={{
            bgcolor: "background.paper",
            p: { xs: 2, md: 4 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <ContentDocumentPreview fieldKey="" value={content} />
        </Box>
      ) : (
        <Box data-testid={`content-studio-stage-content-${stage.id}`}>
          <ContentFieldsEditor
            fieldKey=""
            value={content}
            disabled={disabled}
            onChange={(next) => onChange(JSON.stringify(next, null, 2))}
          />
        </Box>
      )}
    </Box>
  );
}
