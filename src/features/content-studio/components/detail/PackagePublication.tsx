import { useState } from "react";
import { CloudUpload, OpenInNew } from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";

import { usePackagePublication } from "../../hooks/usePackagePublication";
import { PUBLICATION_TESTAMENT_OPTIONS, PUBLICATION_TEXTS } from "../../publication.constants";
import { canPublishPackage, publicationPageUrl } from "../../publication.utils";
import { ContentPackageStatus, PublicationPhase, PublicationTestament } from "../../types";

interface PackagePublicationProps {
  packageId: string;
  status: ContentPackageStatus;
  disabled: boolean;
  onChanged: () => Promise<void> | void;
}

/** Botão "Publicar no site", diálogo de confirmação e resultado (link da página ou erro explicado). */
export function PackagePublication({ packageId, status, disabled, onChanged }: PackagePublicationProps) {
  const publicationEnabled = useIsFeatureEnabled(FeatureFlagKeys.CONTENT_STUDIO_PUBLICATION);
  const { state, publish } = usePackagePublication(packageId, status, onChanged);
  const [open, setOpen] = useState(false);
  const [testament, setTestament] = useState<PublicationTestament>(PublicationTestament.OLD_TESTAMENT);
  const publishing = state.phase === PublicationPhase.PUBLISHING;
  const pageUrl = publicationPageUrl(state.publication?.visitMaterialPagePath ?? null);
  const showButton = canPublishPackage(status, publicationEnabled);
  const showResult =
    publicationEnabled &&
    ((state.phase === PublicationPhase.PUBLISHED && !!pageUrl) ||
      (state.phase === PublicationPhase.FAILED && !!state.message));

  const confirm = async () => {
    setOpen(false);
    await publish(testament);
  };

  return (
    <>
      {showButton && (
        <Button
          data-testid="content-studio-publish-button"
          variant="contained"
          color="success"
          startIcon={publishing ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
          disabled={disabled || publishing}
          onClick={() => setOpen(true)}
          sx={{ minHeight: 44 }}
        >
          {publishing ? PUBLICATION_TEXTS.BUTTON_PUBLISHING : PUBLICATION_TEXTS.BUTTON}
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="content-studio-publish-title"
        data-testid="content-studio-publish-dialog"
      >
        <DialogTitle id="content-studio-publish-title">{PUBLICATION_TEXTS.DIALOG_TITLE}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>{PUBLICATION_TEXTS.DIALOG_WARNING}</DialogContentText>
            <FormControl>
              <FormLabel id="content-studio-publish-testament-label">{PUBLICATION_TEXTS.TESTAMENT_LABEL}</FormLabel>
              <RadioGroup
                aria-labelledby="content-studio-publish-testament-label"
                data-testid="content-studio-publish-testament"
                value={testament}
                onChange={(event) => setTestament(event.target.value as PublicationTestament)}
              >
                {PUBLICATION_TESTAMENT_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                    data-testid={`content-studio-publish-testament-${option.value}`}
                    sx={{ minHeight: 44 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ minHeight: 44 }} data-testid="content-studio-publish-cancel">
            {PUBLICATION_TEXTS.CANCEL}
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirm()}
            data-testid="content-studio-publish-confirm"
            sx={{ minHeight: 44 }}
          >
            {PUBLICATION_TEXTS.CONFIRM}
          </Button>
        </DialogActions>
      </Dialog>
      {showResult && (
        <Alert
          data-testid="content-studio-publication-result"
          severity={state.phase === PublicationPhase.PUBLISHED ? "success" : "error"}
          sx={{ width: "100%" }}
          action={
            pageUrl && state.phase === PublicationPhase.PUBLISHED ? (
              <Button
                color="inherit"
                size="small"
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNew />}
                data-testid="content-studio-publication-link"
                sx={{ minHeight: 44 }}
              >
                {PUBLICATION_TEXTS.OPEN_PAGE}
              </Button>
            ) : undefined
          }
        >
          {state.phase === PublicationPhase.PUBLISHED ? PUBLICATION_TEXTS.PUBLISHED_NOTICE : state.message}
        </Alert>
      )}
    </>
  );
}
