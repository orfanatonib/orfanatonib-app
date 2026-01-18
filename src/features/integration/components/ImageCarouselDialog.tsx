import React from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  MobileStepper,
  Paper,
} from "@mui/material";
import { Close as CloseIcon, NavigateBefore, NavigateNext } from "@mui/icons-material";
import type { IntegrationResponseDto } from "../types";

interface ImageCarouselDialogProps {
  open: boolean;
  onClose: () => void;
  integration: IntegrationResponseDto | null;
  startIndex?: number;
}

export default function ImageCarouselDialog({
  open,
  onClose,
  integration,
  startIndex = 0,
}: ImageCarouselDialogProps) {
  const [activeStep, setActiveStep] = React.useState(startIndex);

  React.useEffect(() => {
    if (open && integration?.images) {
      setActiveStep(startIndex);
    }
  }, [open, integration, startIndex]);

  if (!integration || !integration.images || integration.images.length === 0) {
    return null;
  }

  const images = integration.images;
  const maxSteps = images.length;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + maxSteps) % maxSteps);
  };

  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "black",
          color: "white",
          maxHeight: "90vh",
          maxWidth: "90vw",
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: "relative", bgcolor: "black" }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "white",
            bgcolor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10,
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            position: "relative",
          }}
        >
          {maxSteps > 1 && (
            <IconButton
              onClick={handleBack}
              sx={{
                position: "absolute",
                left: 16,
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                },
                zIndex: 5,
              }}
            >
              <NavigateBefore fontSize="large" />
            </IconButton>
          )}

          <Box
            component="img"
            src={images[activeStep].url}
            alt={images[activeStep].title || `Foto ${activeStep + 1} de ${integration.name}`}
            sx={{
              maxWidth: "100%",
              maxHeight: "60vh",
              objectFit: "contain",
              borderRadius: 1,
            }}
            onError={(e) => {
              e.currentTarget.src = import.meta.env.VITE_SHELTER_FALLBACK_IMAGE_URL || "";
            }}
          />

          {maxSteps > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: 16,
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                },
                zIndex: 5,
              }}
            >
              <NavigateNext fontSize="large" />
            </IconButton>
          )}
        </Box>

        <Paper
          square
          elevation={0}
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {integration.name || "Integração"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {images[activeStep].title || `Foto ${activeStep + 1}`}
            </Typography>
          </Box>

          {maxSteps > 1 && (
            <MobileStepper
              steps={maxSteps}
              position="static"
              activeStep={activeStep}
              sx={{
                bgcolor: "transparent",
                "& .MuiMobileStepper-dot": {
                  bgcolor: "rgba(255, 255, 255, 0.5)",
                },
                "& .MuiMobileStepper-dotActive": {
                  bgcolor: "white",
                },
              }}
              nextButton={null}
              backButton={null}
            />
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
}
