import AutoAwesome from "@mui/icons-material/AutoAwesome";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface ContentStudioPageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly backTo?: string;
  readonly backLabel?: string;
  readonly eyebrow?: string;
}

export function ContentStudioPageHeader({
  title,
  description,
  backTo,
  backLabel = "Voltar ao estúdio",
  eyebrow = "Estúdio Orfanato",
}: ContentStudioPageHeaderProps) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2.5, sm: 3.5, md: 4 },
        border: "1px solid",
        borderColor: "rgba(30, 58, 95, 0.12)",
        borderRadius: 4,
        background:
          "radial-gradient(ellipse at 95% 0%, rgba(99, 139, 181, 0.16), transparent 36%), linear-gradient(125deg, #ffffff 0%, #f4f7fb 100%)",
        boxShadow: "0 12px 32px rgba(29, 51, 78, 0.07)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 auto 0 0",
          width: 4,
          bgcolor: "primary.main",
        },
      }}
    >
      <Stack spacing={1.5}>
        {backTo && (
          <Button
            component={RouterLink}
            to={backTo}
            startIcon={<ArrowBack />}
            sx={{
              alignSelf: "flex-start",
              minHeight: 40,
              ml: -1,
              color: "text.secondary",
            }}
          >
            {backLabel}
          </Button>
        )}
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} alignItems="center">
          <Box
            aria-hidden="true"
            sx={{
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              width: { xs: 48, sm: 60 },
              height: { xs: 48, sm: 60 },
              borderRadius: 3,
              color: "common.white",
              background: "linear-gradient(145deg, #244d79, #477aa8)",
              boxShadow: "0 8px 18px rgba(36, 77, 121, 0.22)",
            }}
          >
            <AutoAwesome sx={{ fontSize: { xs: 25, sm: 30 } }} />
          </Box>
          <Stack spacing={0.5}>
            <Chip
              label={eyebrow}
              size="small"
              sx={{
                alignSelf: "flex-start",
                height: 24,
                color: "primary.dark",
                bgcolor: "rgba(48, 94, 143, 0.09)",
                fontWeight: 700,
                letterSpacing: 0.35,
              }}
            />
            <Typography
              component="h1"
              variant="h4"
              fontWeight={750}
              sx={{
                color: "#172b43",
                fontSize: { xs: "1.65rem", sm: "2.125rem" },
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 780 }}>
              {description}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
