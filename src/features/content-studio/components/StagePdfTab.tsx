import Download from "@mui/icons-material/Download";
import Refresh from "@mui/icons-material/Refresh";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { Alert, Box, Button, CircularProgress, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

import { downloadExport, exportPath } from "../api";
import { canEmbedPdf } from "../export.utils";
import { useExportPreview } from "../hooks/useExportPreview";
import { ExportFormat } from "../types";

interface StagePdfTabProps {
  packageId: string;
  stageId: string;
  /** Muda a cada versão salva: a prévia é refeita. */
  versionKey: string | null;
  /** Tem alteração (campos ou documento) ainda não salva: a prévia mostra a versão salva. */
  hasUnsavedChanges: boolean;
  active: boolean;
  fileBaseName: string;
  /** Revisão: só ler o documento (PDF). Sem baixar o DOCX (formato editável) e com o texto de "Documento". */
  readOnly?: boolean;
}

/** Aba "PDF": prévia do PDF real (LibreOffice) da versão salva da etapa, com download de PDF e DOCX. */
export function StagePdfTab({
  packageId,
  stageId,
  versionKey,
  hasUnsavedChanges,
  active,
  fileBaseName,
  readOnly = false,
}: StagePdfTabProps) {
  const path = exportPath.stage(stageId, ExportFormat.PDF);
  const { url, loading, error, reload } = useExportPreview(packageId, path, versionKey, active);
  const [downloadError, setDownloadError] = useState(false);
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const embed = canEmbedPdf(typeof navigator === "undefined" ? undefined : navigator.pdfViewerEnabled, compact);

  const download = async (format: ExportFormat) => {
    setDownloadError(false);
    try {
      await downloadExport(packageId, exportPath.stage(stageId, format), `${fileBaseName}.${format}`);
    } catch {
      setDownloadError(true);
    }
  };

  return (
    <Stack spacing={2} data-testid="content-studio-pdf-tab">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
          {readOnly ? "Documento desta versão, somente para leitura." : "Prévia do PDF da versão salva desta etapa."}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={reload}
            disabled={loading}
            sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
          >
            Atualizar
          </Button>
          {!readOnly && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download />}
              onClick={() => void download(ExportFormat.DOCX)}
              data-testid="content-studio-download-docx"
              sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
            >
              Baixar DOCX
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            startIcon={<Download />}
            onClick={() => void download(ExportFormat.PDF)}
            data-testid="content-studio-download-pdf"
            sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
          >
            Baixar PDF
          </Button>
        </Stack>
      </Stack>
      {hasUnsavedChanges && (
        <Alert severity="warning">Há alterações não salvas: a prévia mostra a versão já salva. Salve para vê-las aqui.</Alert>
      )}
      {downloadError && <Alert severity="error">Não foi possível baixar o arquivo agora.</Alert>}
      {error && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" onClick={reload}>
              Tentar de novo
            </Button>
          }
          data-testid="content-studio-pdf-error"
        >
          {error}
        </Alert>
      )}
      {loading && (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }} data-testid="content-studio-pdf-loading">
          <CircularProgress />
          <Typography color="text.secondary">Gerando o PDF… a primeira vez pode levar alguns segundos.</Typography>
        </Stack>
      )}
      {url && !loading && !embed && (
        <Stack
          spacing={1.5}
          alignItems="stretch"
          data-testid="content-studio-pdf-open-card"
          sx={readOnly ? { py: 1 } : { p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "grey.50" }}
        >
          <Typography variant="body2" color="text.secondary">
            O PDF está pronto. No celular ele abre no visualizador do aparelho, em tela cheia.
          </Typography>
          <Button
            variant="contained"
            startIcon={<OpenInNew />}
            onClick={() => window.open(url, "_blank", "noopener")}
            data-testid="content-studio-pdf-open"
            sx={{ minHeight: 48 }}
          >
            Abrir PDF
          </Button>
        </Stack>
      )}
      {url && !loading && embed && (
        <Box
          component="iframe"
          title="Prévia do PDF"
          src={url}
          data-testid="content-studio-pdf-frame"
          sx={{
            width: "100%",
            height: { xs: 520, md: 760 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "grey.100",
          }}
        />
      )}
    </Stack>
  );
}
