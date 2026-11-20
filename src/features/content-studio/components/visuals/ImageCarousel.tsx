import { ChevronLeft, ChevronRight, Replay } from "@mui/icons-material";
import { Box, Button, Chip, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import type { StageImageItem } from "../../types";

interface ImageCarouselProps {
  items: StageImageItem[];
  /** CSS aspect-ratio da folha ("297 / 210" paisagem, "210 / 297" retrato). */
  ratio: string;
  drawing: boolean;
  disabled: boolean;
  /** Sem `onRedo` o carrossel é só de leitura (revisão): não mostra o botão de refazer. */
  onRedo?: (item: StageImageItem) => void;
}

/**
 * Carrossel das imagens dos visuais (uma por vez, como as páginas do PDF): arrasta com o dedo no celular
 * (rolagem com encaixe), setas e teclado no desktop, contador e bolinhas. Mobile first.
 */
export function ImageCarousel({ items, ratio, drawing, disabled, onRedo }: ImageCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = Math.max(0, items.length - 1);

  const goTo = useCallback((next: number) => {
    const element = track.current;
    if (!element) return;
    const target = Math.min(Math.max(next, 0), Math.max(0, element.children.length - 1));
    element.scrollTo({ left: target * element.clientWidth, behavior: "smooth" });
  }, []);

  // O índice acompanha a rolagem (arrastar com o dedo, setas, bolinhas).
  const onScroll = () => {
    const element = track.current;
    if (!element || element.clientWidth === 0) return;
    setIndex(Math.round(element.scrollLeft / element.clientWidth));
  };

  useEffect(() => {
    if (index > last) setIndex(last);
  }, [index, last]);

  if (items.length === 0) return null;
  const current = items[Math.min(index, last)];
  const single = items.length === 1;

  return (
    <Box data-testid="content-studio-carousel" aria-roledescription="carrossel" aria-label="Imagens da lição">
      <Box sx={{ position: "relative" }}>
        <Box
          ref={track}
          tabIndex={0}
          onScroll={onScroll}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") goTo(index + 1);
            if (event.key === "ArrowLeft") goTo(index - 1);
          }}
          sx={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#f3f4f6",
            outlineOffset: 2,
          }}
        >
          {items.map((item, position) => (
            <Box
              key={item.slot}
              data-testid={`content-studio-slide-${item.slot}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} de ${items.length}`}
              sx={{ flex: "0 0 100%", scrollSnapAlign: "center", display: "flex", justifyContent: "center", p: { xs: 0.5, sm: 2 } }}
            >
              <Box sx={{ aspectRatio: ratio, width: "100%", maxHeight: "72vh", bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: 1 }}>
                {item.url ? (
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.title || item.slot}
                    loading={position === 0 ? "eager" : "lazy"}
                    sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                ) : drawing ? (
                  <Skeleton variant="rectangular" sx={{ width: "100%", height: "100%" }} />
                ) : (
                  <Typography color="text.secondary" variant="body2" sx={{ p: 2, textAlign: "center" }}>
                    Imagem ainda não gerada
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        <IconButton
          aria-label="Imagem anterior"
          data-testid="content-studio-carousel-prev"
          disabled={index <= 0}
          onClick={() => goTo(index - 1)}
          sx={{ display: { xs: "none", sm: single ? "none" : "inline-flex" }, position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, bgcolor: "rgba(255,255,255,0.92)", boxShadow: 2, "&:hover": { bgcolor: "#fff" } }}
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          aria-label="Próxima imagem"
          data-testid="content-studio-carousel-next"
          disabled={index >= last}
          onClick={() => goTo(index + 1)}
          sx={{ display: { xs: "none", sm: single ? "none" : "inline-flex" }, position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, bgcolor: "rgba(255,255,255,0.92)", boxShadow: 2, "&:hover": { bgcolor: "#fff" } }}
        >
          <ChevronRight />
        </IconButton>
      </Box>

      <Stack alignItems="center" spacing={0.5} sx={{ mt: 1.5, display: single ? "none" : "flex" }}>
        {/* Celular: as setas ficam fora da imagem (não cobrem o cartão); o dedo também arrasta. */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ display: { xs: "flex", sm: "none" } }}>
          <IconButton aria-label="Imagem anterior" data-testid="content-studio-carousel-prev-mobile" disabled={index <= 0} onClick={() => goTo(index - 1)} sx={{ width: 48, height: 48, border: "1px solid", borderColor: "divider" }}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="body2" color="text.secondary" data-testid="content-studio-carousel-counter-mobile">
            {Math.min(index, last) + 1} / {items.length}
          </Typography>
          <IconButton aria-label="Próxima imagem" data-testid="content-studio-carousel-next-mobile" disabled={index >= last} onClick={() => goTo(index + 1)} sx={{ width: 48, height: 48, border: "1px solid", borderColor: "divider" }}>
            <ChevronRight />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" data-testid="content-studio-carousel-counter" sx={{ display: { xs: "none", sm: "block" } }}>
          {Math.min(index, last) + 1} / {items.length}
        </Typography>
        <Stack direction="row" justifyContent="center" flexWrap="wrap" sx={{ maxWidth: "100%" }}>
          {items.map((item, position) => (
            <IconButton
              key={item.slot}
              aria-label={`Ir para a imagem ${position + 1}`}
              aria-current={position === index}
              onClick={() => goTo(position)}
              sx={{ width: 32, height: 32 }}
            >
              <Box sx={{ width: position === index ? 14 : 10, height: 10, borderRadius: 5, bgcolor: position === index ? "primary.main" : item.assetId ? "grey.500" : "grey.300", transition: "width 120ms" }} />
            </IconButton>
          ))}
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mt: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} noWrap>
            {current.title || current.slot}
          </Typography>
          <Chip size="small" color={current.assetId ? "success" : "default"} label={current.assetId ? "Pronta" : "Pendente"} />
        </Stack>
        {onRedo && (
          <Button
            data-testid={`content-studio-image-redo-${current.slot}`}
            startIcon={<Replay />}
            variant="outlined"
            disabled={disabled || drawing}
            onClick={() => onRedo(current)}
            sx={{ minHeight: 48, fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
          >
            {current.assetId ? "Refazer esta imagem" : "Gerar esta imagem"}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
