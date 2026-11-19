import { useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ExploreOutlined,
} from "@mui/icons-material";
import { memberAreaColors as colors } from "@/theme/memberArea";
import { SECTION_DATA } from "../../constants";
import { MEMBER_GUIDE_VISIBLE_CARDS } from "../../constants/home";

const MemberGuideCarousel = () => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("lg"));
  const tablet = useMediaQuery(theme.breakpoints.up("sm"));
  const perView = desktop
    ? MEMBER_GUIDE_VISIBLE_CARDS.desktop
    : tablet
      ? MEMBER_GUIDE_VISIBLE_CARDS.tablet
      : MEMBER_GUIDE_VISIBLE_CARDS.mobile;
  const [position, setPosition] = useState(0);
  const maxPosition = Math.max(0, SECTION_DATA.length - perView);
  const index = Math.min(position, maxPosition);
  return (
    <Paper
      data-testid="member-area-guide"
      component="section"
      aria-label="Guia do Membro"
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3.5,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <ExploreOutlined sx={{ color: colors.blue }} />
          <Box>
            <Typography
              component="h2"
              variant="h6"
              sx={{
                color: colors.ink,
                fontWeight: 800,
                fontSize: { xs: "1rem", md: "1.15rem" },
              }}
            >
              Guia do Membro
            </Typography>
            <Typography variant="caption" sx={{ color: colors.muted }}>
              Orientações e dicas práticas para servir no ministério
            </Typography>
          </Box>
        </Stack>
        {maxPosition > 0 && (
          <Stack direction="row">
            <IconButton
              aria-label="Orientação anterior"
              disabled={index === 0}
              onClick={() => setPosition(index - 1)}
              sx={{ width: 44, height: 44 }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              aria-label="Próxima orientação"
              disabled={index === maxPosition}
              onClick={() => setPosition(index + 1)}
              sx={{ width: 44, height: 44 }}
            >
              <ChevronRight />
            </IconButton>
          </Stack>
        )}
      </Stack>
      <Box
        aria-live="polite"
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))`,
          gap: 1.5,
        }}
      >
        {SECTION_DATA.slice(index, index + perView).map((section) => (
          <Box
            key={section.icon}
            data-testid={`member-area-guide-${section.icon.toLowerCase()}`}
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: colors.background,
              border: `1px solid ${colors.border}`,
              borderTop: `4px solid ${section.color}`,
            }}
          >
            <Typography
              component="h3"
              variant="subtitle2"
              fontWeight={800}
              sx={{ color: colors.ink, mb: 1 }}
            >
              {section.title}
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
              {section.items.map((item) => (
                <Typography
                  component="li"
                  key={item}
                  variant="body2"
                  sx={{ py: 0.5, lineHeight: 1.5, color: colors.text }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
export default MemberGuideCarousel;
