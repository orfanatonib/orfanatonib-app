import Download from "@mui/icons-material/Download";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
import Description from "@mui/icons-material/Description";
import { Alert, Button, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar, Typography } from "@mui/material";
import { useState } from "react";

import { downloadExport, exportPath } from "../api";
import { ExportFormat, type ContentTrackResponse } from "../types";
import { exportFileName } from "../export.utils";

interface PackageExportMenuProps {
  packageId: string;
  theme: string;
  /** Faixa em edição (exportar só ela). */
  track: ContentTrackResponse | undefined;
  disabled?: boolean;
}

/** Menu "Exportar": faixa atual ou material completo, em PDF ou DOCX (sempre a última versão salva). */
export function PackageExportMenu({ packageId, theme, track, disabled }: PackageExportMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (path: string, name: string, format: ExportFormat) => {
    setAnchor(null);
    setError(null);
    try {
      await downloadExport(packageId, path, exportFileName([theme, name], format));
    } catch (failure: unknown) {
      const status = (failure as { response?: { status?: number } })?.response?.status;
      setError(
        status === 422 ? "Ainda não há conteúdo salvo para exportar. Gere ou escreva ao menos uma etapa." : "Não foi possível exportar agora. Tente novamente.",
      );
    }
  };

  return (
    <>
      <Button
        startIcon={<Download />}
        onClick={(event) => setAnchor(event.currentTarget)}
        disabled={disabled}
        sx={{ minHeight: 44 }}
        data-testid="content-studio-export-menu"
      >
        Exportar
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {track && (
          <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
            {track.audienceName}
          </Typography>
        )}
        {track && [
          <MenuItem
            key="tp"
            onClick={() => void run(exportPath.track(track.audience, ExportFormat.PDF), track.audienceName, ExportFormat.PDF)}
            data-testid="content-studio-export-track-pdf"
          >
            <ListItemIcon>
              <PictureAsPdf fontSize="small" />
            </ListItemIcon>
            <ListItemText>PDF da faixa</ListItemText>
          </MenuItem>,
          <MenuItem
            key="td"
            onClick={() => void run(exportPath.track(track.audience, ExportFormat.DOCX), track.audienceName, ExportFormat.DOCX)}
            data-testid="content-studio-export-track-docx"
          >
            <ListItemIcon>
              <Description fontSize="small" />
            </ListItemIcon>
            <ListItemText>DOCX da faixa</ListItemText>
          </MenuItem>,
          <Divider key="div" />,
        ]}
        <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
          Material completo
        </Typography>
        <MenuItem onClick={() => void run(exportPath.all(ExportFormat.PDF), "completo", ExportFormat.PDF)} data-testid="content-studio-export-all-pdf">
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>PDF com todas as faixas</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => void run(exportPath.all(ExportFormat.DOCX), "completo", ExportFormat.DOCX)} data-testid="content-studio-export-all-docx">
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText>DOCX com todas as faixas</ListItemText>
        </MenuItem>
      </Menu>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
