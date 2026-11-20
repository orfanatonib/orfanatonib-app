import { useState } from "react";
import { AutoAwesome, ImageOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

import { regeneratePackageCover } from "../../api";
import type { ContentPackageResponse } from "../../types";
import { PACKAGE_COVER_TEXTS } from "../../cover.constants";

interface PackageCoverDialogProps {
  open: boolean;
  onClose: () => void;
  contentPackage: ContentPackageResponse;
  /** Recarrega o pacote (a capa nova aparece e o "gerando" é acompanhado pela consulta periódica). */
  onChanged: () => Promise<void> | void;
}

/**
 * Modal da imagem de apresentação do material: é o card em Materiais de Visita. Nasce junto com o material, NÃO passa
 * por revisão e pode ser refeita quantas vezes for preciso (inclusive depois de publicado).
 */
export function PackageCoverDialog({ open, onClose, contentPackage, onChanged }: PackageCoverDialogProps) {
  const [instructions, setInstructions] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [failed, setFailed] = useState(false);
  const generating = requesting || contentPackage.coverGenerating;
  const hasCover = Boolean(contentPackage.coverImageUrl);
  const T = PACKAGE_COVER_TEXTS;

  const regenerate = async () => {
    setRequesting(true);
    setFailed(false);
    try {
      await regeneratePackageCover(contentPackage.id, instructions);
      await onChanged();
      setInstructions("");
    } catch {
      setFailed(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" data-testid="content-studio-cover-dialog">
      <DialogTitle component="h2" sx={{ fontWeight: 800 }}>
        {T.title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">{T.description}</Typography>
          <Box
            data-testid="content-studio-cover-frame"
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 2",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasCover && (
              <Box
                component="img"
                data-testid="content-studio-cover-image"
                src={contentPackage.coverImageUrl ?? undefined}
                alt={T.imageAlt(contentPackage.theme)}
                sx={{ width: "100%", height: "100%", objectFit: "cover", opacity: generating ? 0.4 : 1 }}
              />
            )}
            {!hasCover && !generating && <ImageOutlined sx={{ fontSize: 48, color: "text.disabled" }} />}
            {generating && (
              <Stack
                data-testid="content-studio-cover-generating"
                alignItems="center"
                spacing={1}
                sx={{ position: "absolute", inset: 0, justifyContent: "center", textAlign: "center", px: 2 }}
              >
                <CircularProgress size={32} />
                <Typography variant="body2" fontWeight={600}>
                  {T.generating}
                </Typography>
              </Stack>
            )}
          </Box>
          <TextField
            size="small"
            multiline
            minRows={2}
            fullWidth
            label={T.instructionsLabel}
            placeholder={T.instructionsPlaceholder}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            disabled={generating}
            inputProps={{ maxLength: 500, "data-testid": "content-studio-cover-instructions" }}
          />
          {failed && (
            <Alert severity="error" data-testid="content-studio-cover-error">
              {T.error}
            </Alert>
          )}
          {!hasCover && !generating && !failed && (
            <Alert severity="info" data-testid="content-studio-cover-missing">
              {T.missing}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button data-testid="content-studio-cover-close" onClick={onClose} color="inherit" sx={{ minHeight: 44 }}>
          {T.close}
        </Button>
        <Button
          data-testid="content-studio-cover-regenerate"
          variant={hasCover ? "outlined" : "contained"}
          startIcon={<AutoAwesome />}
          onClick={() => void regenerate()}
          disabled={generating}
          sx={{ minHeight: 44 }}
        >
          {hasCover ? T.regenerate : T.generate}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
