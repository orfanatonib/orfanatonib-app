import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { AtendenteResponseDto, AtendentePdf } from "../types";
import { ATENDENTES_TEST_ID_PREFIX } from "../constants";

const P = ATENDENTES_TEST_ID_PREFIX;

interface AtendenteViewDialogProps {
  open: boolean;
  onClose: () => void;
  /** Um único antecedente com pdfEstadual e pdfFederal. */
  atendente: AtendenteResponseDto | null;
  onPreviewPdf?: (pdf: AtendentePdf, label: "estadual" | "federal") => void;
}

function PdfRow({
  label,
  pdf,
  onPreviewPdf,
}: {
  label: "estadual" | "federal";
  pdf: AtendentePdf | undefined;
  onPreviewPdf?: (pdf: AtendentePdf, label: "estadual" | "federal") => void;
}) {
  if (!pdf?.url) return null;
  return (
    <Box
      data-testid={`${P}-view-pdf-${label}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        mb: 0.5,
      }}
    >
      <Link
        data-testid={`${P}-view-pdf-${label}-link`}
        href={pdf.url}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
      >
        {label === "estadual" ? "Estadual.pdf" : "Federal.pdf"}
      </Link>
      {onPreviewPdf && (
        <Tooltip title="Visualizar PDF">
          <IconButton
            data-testid={`${P}-view-pdf-${label}-preview`}
            onClick={() => onPreviewPdf(pdf, label)}
            aria-label="Visualizar PDF"
            sx={{ width: 44, height: 44 }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default function AtendenteViewDialog({
  open,
  onClose,
  atendente,
  onPreviewPdf,
}: AtendenteViewDialogProps) {
  if (!atendente) return null;

  const linkLabel =
    atendente.attendableType === "integration"
      ? "Integração FM"
      : atendente.attendableType === "user"
        ? "Usuário"
        : null;

  return (
    <Dialog data-testid={`${P}-view-dialog`} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography fontWeight="bold">Antecedente Criminal</Typography>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {atendente.name && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Nome
            </Typography>
            <Typography data-testid={`${P}-view-name`}>{atendente.name}</Typography>
          </Box>
        )}
        {linkLabel && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Vínculo
            </Typography>
            <Typography data-testid={`${P}-view-link`}>
              {linkLabel}: {atendente.attendableDisplayName ?? atendente.attendableId}
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Documento(s) PDF
          </Typography>
          <PdfRow
            label="estadual"
            pdf={atendente.pdfEstadual}
            onPreviewPdf={onPreviewPdf}
          />
          <PdfRow
            label="federal"
            pdf={atendente.pdfFederal}
            onPreviewPdf={onPreviewPdf}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Atualizado em
          </Typography>
          <Typography variant="body2">
            {atendente.updatedAt
              ? new Date(atendente.updatedAt).toLocaleString("pt-BR")
              : "-"}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button data-testid={`${P}-view-close`} onClick={onClose} sx={{ minHeight: 44 }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
