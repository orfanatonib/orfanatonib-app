import React from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  MobileStepper,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Close as CloseIcon, NavigateBefore, NavigateNext, RotateRight as RotateRightIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from "@mui/icons-material";

export interface CarouselImage {
  url: string;
  title?: string;
}

interface ImageCarouselDialogProps {
  open: boolean;
  onClose: () => void;
  images: CarouselImage[];
  title?: string;
  startIndex?: number;
}

export default function ImageCarouselDialog({
  open,
  onClose,
  images = [],
  title,
  startIndex = 0,
}: ImageCarouselDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = React.useState(startIndex);
  const [rotation, setRotation] = React.useState(0);
  const [scale, setScale] = React.useState(1);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handleBack();
    }
  };

  React.useEffect(() => {
    if (open) {
      setActiveStep(startIndex);
      setRotation(0);
      setScale(1);
    }
  }, [open, startIndex]);

  const maxSteps = images.length;

  if (!open || maxSteps === 0) {
    return null;
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
    setRotation(0);
    setScale(1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + maxSteps) % maxSteps);
    setRotation(0);
    setScale(1);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setScale(1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 1));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: "black",
          color: "white",
          maxHeight: isMobile ? "100vh" : "90vh",
          maxWidth: isMobile ? "100vw" : "90vw",
          m: isMobile ? 0 : 2,
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: "relative", bgcolor: "black", overflow: scale > 1 ? "auto" : "hidden" }}>
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

        <Box sx={{ position: "absolute", right: 72, top: 16, display: "flex", gap: 1, zIndex: 10 }}>
          <IconButton
            onClick={handleZoomOut}
            disabled={scale <= 1}
            sx={{
              color: "white",
              bgcolor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.7)",
              },
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.3)",
                bgcolor: "rgba(0, 0, 0, 0.3)",
              }
            }}
          >
            <ZoomOutIcon />
          </IconButton>

          <IconButton
            onClick={handleZoomIn}
            disabled={scale >= 3}
            sx={{
              color: "white",
              bgcolor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.7)",
              },
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.3)",
                bgcolor: "rgba(0, 0, 0, 0.3)",
              }
            }}
          >
            <ZoomInIcon />
          </IconButton>

          <IconButton
            onClick={handleRotate}
            sx={{
              color: "white",
              bgcolor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <RotateRightIcon />
          </IconButton>
        </Box>


        <Box
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: isMobile ? "100vh" : "60vh",
            height: isMobile ? "100%" : "auto",
            position: "relative",
            width: '100%',
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
            alt={images[activeStep].title || `Foto ${activeStep + 1}`}
            sx={{
              maxWidth: "100%",
              maxHeight: isMobile ? "100vh" : "60vh",
              width: isMobile ? "100%" : "auto",
              height: isMobile ? "100%" : "auto",
              objectFit: "contain",
              borderRadius: isMobile ? 0 : 1,
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: "transform 0.3s ease",
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


        {!isMobile && (
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
              {title && (
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {title}
                </Typography>
              )}
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {images[activeStep].title || `Foto ${activeStep + 1} de ${maxSteps}`}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
