import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import type {
  AtendenteResponseDto,
  CreateAtendenteDto,
  UpdateAtendenteDto,
  AttendableType,
  AtendenteFiles,
} from "../types";
import { apiListIntegrationsSimple } from "@/features/integration/api";
import { apiListUsersSimple } from "@/features/users/api";
import type { IntegrationResponseDto } from "@/features/integration/types";
import type { UserSimpleDto } from "@/features/users/api";
import MediaDocumentPreviewModal from "@/utils/MediaDocumentPreviewModal";
import type { MediaItem } from "@/store/slices/types";
import { MediaType, MediaUploadType } from "@/store/slices/types";

const ATTENDABLE_NONE = "none" as const;
type AttendableTypeOption = typeof ATTENDABLE_NONE | AttendableType;

type FormData = {
  name: string;
  attendableType: AttendableTypeOption;
  attendableId: string;
};

interface AtendenteFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Uma única requisição com os 2 PDFs (estadual e/ou federal). updateId = atualizar esse registro. */
  onSubmit: (
    data: CreateAtendenteDto | UpdateAtendenteDto,
    files: AtendenteFiles,
    options?: { updateId?: string }
  ) => Promise<void>;
  editing?: AtendenteResponseDto | null;
  loading?: boolean;
  error?: string;
}

export default function AtendenteFormDialog({
  open,
  onClose,
  onSubmit,
  editing,
  loading = false,
  error,
}: AtendenteFormDialogProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    attendableType: ATTENDABLE_NONE,
    attendableId: "",
  });
  const [pdfEstadual, setPdfEstadual] = React.useState<File | null>(null);
  const [pdfFederal, setPdfFederal] = React.useState<File | null>(null);
  const [removedEstadual, setRemovedEstadual] = React.useState(false);
  const [removedFederal, setRemovedFederal] = React.useState(false);
  const [integrations, setIntegrations] = React.useState<IntegrationResponseDto[]>([]);
  const [users, setUsers] = React.useState<UserSimpleDto[]>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [nameError, setNameError] = React.useState("");
  const [hoveredScope, setHoveredScope] = React.useState<"estadual" | "federal" | null>(null);
  const fileInputEstadualRef = React.useRef<HTMLInputElement>(null);
  const fileInputFederalRef = React.useRef<HTMLInputElement>(null);
  const openingFileRef = React.useRef(false);
  const wasOpenRef = React.useRef(false);
  const previewObjectUrlRef = React.useRef<string | null>(null);

  const [previewMedia, setPreviewMedia] = React.useState<MediaItem | null>(null);
  const [previewTitle, setPreviewTitle] = React.useState<string>("");

  const closePreview = React.useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewMedia(null);
    setPreviewTitle("");
  }, []);

  React.useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      openingFileRef.current = false;
      closePreview();
      return;
    }
    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    setFormData({
      name: editing?.name ?? "",
      attendableType:
        editing?.attendableType == null ? ATTENDABLE_NONE : editing.attendableType,
      attendableId: editing?.attendableId ?? "",
    });
    if (justOpened) {
      setPdfEstadual(null);
      setPdfFederal(null);
      setRemovedEstadual(false);
      setRemovedFederal(false);
      setNameError("");
    }
  }, [open, editing, closePreview]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingOptions(true);
    Promise.all([apiListIntegrationsSimple(), apiListUsersSimple()])
      .then(([intData, userData]) => {
        if (!cancelled) {
          setIntegrations(intData ?? []);
          setUsers(userData ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const openPreview = React.useCallback(
    (scope: "estadual" | "federal") => {
      closePreview();
      const file = scope === "estadual" ? pdfEstadual : pdfFederal;
      const existing = scope === "estadual" ? editing?.pdfEstadual : editing?.pdfFederal;
      const label = scope === "estadual" ? "Estadual.pdf" : "Federal.pdf";

      if (file) {
        const objectUrl = URL.createObjectURL(file);
        previewObjectUrlRef.current = objectUrl;
        setPreviewMedia({
          title: label,
          description: "",
          url: objectUrl,
          mediaType: MediaType.DOCUMENT,
          uploadType: MediaUploadType.UPLOAD,
          isLocalFile: true,
          originalName: file.name,
        });
        setPreviewTitle(label);
      } else if (existing?.url) {
        setPreviewMedia({
          id: existing.id,
          title: existing.title || label,
          description: existing.description ?? "",
          url: existing.url,
          mediaType: (existing.mediaType as MediaType) || MediaType.DOCUMENT,
          uploadType: (existing.uploadType as MediaUploadType) || MediaUploadType.UPLOAD,
          isLocalFile: existing.isLocalFile ?? true,
          originalName: existing.originalName || label,
        });
        setPreviewTitle(existing.originalName || label);
      }
    },
    [closePreview, pdfEstadual, pdfFederal, editing?.pdfEstadual, editing?.pdfFederal]
  );

  const handleScopeClick = (scope: "estadual" | "federal") => {
    if (openingFileRef.current) return;
    const inputRef = scope === "estadual" ? fileInputEstadualRef : fileInputFederalRef;
    openingFileRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          inputRef.current?.click();
        } finally {
          openingFileRef.current = false;
        }
      }, 80);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const attendableType =
      formData.attendableType === ATTENDABLE_NONE ? null : (formData.attendableType as AttendableType);
    const attendableId = formData.attendableId.trim() || null;
    const hasNoLink = !attendableType && !attendableId;
    const hasEstadual = !!pdfEstadual || (!!editing?.pdfEstadual && !removedEstadual);
    const hasFederal = !!pdfFederal || (!!editing?.pdfFederal && !removedFederal);
    const atLeastOne = hasEstadual || hasFederal;

    if (!atLeastOne) {
      setNameError("É obrigatório manter pelo menos um PDF (Estadual ou Federal).");
      return;
    }
    if (!editing && hasNoLink && !formData.name.trim()) {
      setNameError("Informe o nome quando não houver vínculo.");
      return;
    }
    setNameError("");

    const baseData = {
      name: formData.name.trim() || undefined,
      attendableType,
      attendableId,
    };
    const pdfMeta = {
      description: "",
      uploadType: "upload",
      mediaType: "document",
      isLocalFile: true,
    };

    const files: AtendenteFiles = {};
    if (pdfEstadual) files.estadual = pdfEstadual;
    if (pdfFederal) files.federal = pdfFederal;

    const payload: CreateAtendenteDto | UpdateAtendenteDto = editing
      ? {
          ...baseData,
          pdfEstadual: pdfEstadual ? { ...pdfMeta, title: pdfEstadual.name } : undefined,
          pdfFederal: pdfFederal ? { ...pdfMeta, title: pdfFederal.name } : undefined,
          removePdfEstadual: removedEstadual && !pdfEstadual ? true : undefined,
          removePdfFederal: removedFederal && !pdfFederal ? true : undefined,
        }
      : {
          ...baseData,
          pdfEstadual: pdfEstadual ? { ...pdfMeta, title: pdfEstadual.name } : undefined,
          pdfFederal: pdfFederal ? { ...pdfMeta, title: pdfFederal.name } : undefined,
        };

    await onSubmit(payload, files, editing ? { updateId: editing.id } : undefined);
    onClose();
  };

  const hasNoLink = formData.attendableType === ATTENDABLE_NONE && !formData.attendableId.trim();
  const estadualCounts = !!pdfEstadual || (!!editing?.pdfEstadual && !removedEstadual);
  const federalCounts = !!pdfFederal || (!!editing?.pdfFederal && !removedFederal);
  const hasAtLeastOnePdf = estadualCounts || federalCounts;
  const canSubmit = editing
    ? hasAtLeastOnePdf
    : hasAtLeastOnePdf && (!hasNoLink || formData.name.trim() !== "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.common.black, 0.12)}`,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            pt: 2.5,
            pb: 2,
            px: 3,
            borderBottom: 1,
            borderColor: "divider",
            fontWeight: 700,
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
          }}
        >
          {editing ? "Editar Antecedente Criminal" : "Novo Antecedente Criminal"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, px: 3, pt: 6, pb: 3 }}>
          {(error || nameError) && (
            <Alert severity="error" onClose={() => setNameError("")}>
              {error || nameError}
            </Alert>
          )}

          <FormControl fullWidth size="small">
            <InputLabel>Vínculo</InputLabel>
            <Select
              value={formData.attendableType}
              label="Vínculo"
              renderValue={(v) =>
                v === ATTENDABLE_NONE
                  ? "Nenhum"
                  : v === "integration"
                    ? "Integração FM"
                    : "Usuário"
              }
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  attendableType: e.target.value as AttendableTypeOption,
                  attendableId: "",
                }));
              }}
            >
              <MenuItem value={ATTENDABLE_NONE}>Nenhum</MenuItem>
              <MenuItem value="integration">Integração FM</MenuItem>
              <MenuItem value="user">Usuário</MenuItem>
            </Select>
          </FormControl>

          {formData.attendableType === "integration" && (
            <Autocomplete
              size="small"
              options={integrations}
              getOptionLabel={(o) => o.name || o.id || ""}
              value={integrations.find((i) => i.id === formData.attendableId) ?? null}
              onChange={(_, v) => {
                setFormData((prev) => ({
                  ...prev,
                  attendableId: v?.id ?? "",
                  name: v?.name ?? prev.name,
                }));
              }}
              loading={loadingOptions}
              renderInput={(p) => <TextField {...p} label="Integração" />}
              noOptionsText="Nenhuma integração"
            />
          )}

          {formData.attendableType === "user" && (
            <Autocomplete
              size="small"
              options={users}
              getOptionLabel={(o) => `${o.name} (${o.email})`}
              value={users.find((u) => u.id === formData.attendableId) ?? null}
              onChange={(_, v) => {
                setFormData((prev) => ({
                  ...prev,
                  attendableId: v?.id ?? "",
                  name: v?.name ?? prev.name,
                }));
              }}
              loading={loadingOptions}
              renderInput={(p) => <TextField {...p} label="Usuário" />}
              noOptionsText="Nenhum usuário"
            />
          )}

          <TextField
            label={hasNoLink ? "Nome *" : "Nome"}
            value={formData.name}
            onChange={(e) => {
              setNameError("");
              setFormData((prev) => ({ ...prev, name: e.target.value }));
            }}
            fullWidth
            size="small"
            required={hasNoLink}
            error={hasNoLink && !formData.name.trim() && !!nameError}
            helperText={hasNoLink && !formData.name.trim() ? nameError : undefined}
            placeholder="Nome da pessoa"
          />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: "0.02em" }}>
              Documentos PDF
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
              Pode enviar só Estadual, só Federal ou os dois. Pelo menos um é obrigatório.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <input
              ref={fileInputEstadualRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              tabIndex={-1}
              style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
              onChange={(e) => {
                openingFileRef.current = false;
                setPdfEstadual(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <input
              ref={fileInputFederalRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              tabIndex={-1}
              style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
              onChange={(e) => {
                openingFileRef.current = false;
                setPdfFederal(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            {(["estadual", "federal"] as const).map((scope) => {
              const file = scope === "estadual" ? pdfEstadual : pdfFederal;
              const setFile = scope === "estadual" ? setPdfEstadual : setPdfFederal;
              const inputRef = scope === "estadual" ? fileInputEstadualRef : fileInputFederalRef;
              const removed = scope === "estadual" ? removedEstadual : removedFederal;
              const setRemoved = scope === "estadual" ? setRemovedEstadual : setRemovedFederal;
              const existing = scope === "estadual"
                ? (removedEstadual ? undefined : editing?.pdfEstadual)
                : (removedFederal ? undefined : editing?.pdfFederal);
              const hasFile = !!file || !!existing;
              const isHovered = hoveredScope === scope;
              const label = scope === "estadual" ? "Estadual" : "Federal";

              return (
                <Box
                  key={scope}
                  sx={{ position: "relative" }}
                  onMouseEnter={() => setHoveredScope(scope)}
                  onMouseLeave={() => setHoveredScope(null)}
                >
                  <Button
                    type="button"
                    onClick={() => handleScopeClick(scope)}
                    disableRipple={hasFile}
                    sx={{
                      width: 140,
                      height: 140,
                      minWidth: 140,
                      minHeight: 140,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      p: 2,
                      borderRadius: 3,
                      textTransform: "none",
                      border: "2px solid",
                      borderColor: hasFile ? "primary.main" : "divider",
                      bgcolor: hasFile
                        ? (theme) => alpha(theme.palette.primary.main, 0.08)
                        : isHovered
                          ? (theme) => alpha(theme.palette.primary.main, 0.04)
                          : "transparent",
                      color: hasFile ? "primary.main" : "text.secondary",
                      boxShadow: hasFile
                        ? (theme) => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                        : "none",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: (theme) => alpha(theme.palette.primary.main, hasFile ? 0.12 : 0.08),
                        boxShadow: (theme) => `0 6px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    }}
                  >
                    {hasFile ? (
                      <PictureAsPdfIcon sx={{ fontSize: 36, color: "primary.main", opacity: 0.9 }} />
                    ) : (
                      <AddPhotoAlternateIcon sx={{ fontSize: 32, opacity: 0.6 }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {hasFile ? `${label}.pdf` : label}
                    </Typography>
                    {!hasFile && (
                      <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                        Clique para adicionar
                      </Typography>
                    )}
                  </Button>
                  {hasFile && (
                    <Box
                      role="group"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        display: "flex",
                        gap: 0.5,
                        bgcolor: (theme) => alpha(theme.palette.common.white, 0.95),
                        borderRadius: 2,
                        boxShadow: 1,
                        p: 0.25,
                        "& .MuiIconButton-root": {
                          color: "grey.700",
                          p: 0.5,
                          transition: "color 0.2s",
                          "&:hover": {
                            color: "primary.main",
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          },
                        },
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="Visualizar PDF">
                        <IconButton
                          size="small"
                          aria-label="Visualizar PDF"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPreview(scope);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover e escolher outro">
                        <IconButton
                          size="small"
                          aria-label="Remover PDF"
                          onClick={() => {
                            if (file) {
                              setFile(null);
                              if (inputRef.current) inputRef.current.value = "";
                            } else {
                              setRemoved(true);
                            }
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: 1,
            borderColor: "divider",
            gap: 1,
          }}
        >
          <Button type="button" onClick={onClose} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 600, px: 2.5, boxShadow: 1 }}
          >
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </form>

      <MediaDocumentPreviewModal
        open={!!previewMedia}
        onClose={closePreview}
        media={previewMedia}
        title={previewTitle}
      />
    </Dialog>
  );
}
