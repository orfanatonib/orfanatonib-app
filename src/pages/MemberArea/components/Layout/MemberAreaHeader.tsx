import {
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  HomeOutlined,
  PersonOutline,
  VolunteerActivismOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { memberAreaColors as colors } from "@/theme/memberArea";
import { MEMBER_AREA_TITLE } from "../../constants/navigation";
import { MEMBER_ROLE_LABELS } from "../../constants/home";

const MemberAreaHeader = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const name = user?.name?.trim() || "Membro";
  const firstName = name.split(/\s+/)[0];
  const shelter =
    user?.memberProfile?.shelter ?? user?.memberProfile?.team?.shelter;

  return (
    <Paper
      component="header"
      data-testid="member-area-header"
      elevation={0}
      sx={{
        mb: { xs: 1.5, md: 2.5 },
        p: { xs: 2, md: 3 },
        borderRadius: 3.5,
        border: `1px solid ${colors.border}`,
        background: colors.header,
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", lg: "center" }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ minWidth: 0 }}
        >
          <Avatar
            src={user?.image?.url}
            alt={name}
            sx={{
              width: 60,
              height: 60,
              bgcolor: colors.blueSoft,
              color: colors.ink,
              border: "2px solid white",
              fontWeight: 800,
            }}
          >
            {firstName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mb: 0.75 }}
            >
              <Chip
                icon={<VolunteerActivismOutlined />}
                label={MEMBER_AREA_TITLE}
                size="small"
                sx={{
                  bgcolor: colors.blueSoft,
                  color: colors.blue,
                  fontWeight: 700,
                  "& .MuiChip-icon": { color: colors.blue },
                }}
              />
              {user && (
                <Chip
                  label={MEMBER_ROLE_LABELS[user.role]}
                  size="small"
                  variant="outlined"
                  sx={{ color: colors.blue, borderColor: colors.border }}
                />
              )}
            </Stack>
            <Typography
              data-testid="member-area-header-title"
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 800,
                color: colors.ink,
                fontSize: { xs: "1.15rem", md: "1.65rem" },
                overflowWrap: "anywhere",
              }}
            >
              Olá, {firstName}! Bom ter você aqui.
            </Typography>
            <Typography
              data-testid="member-area-header-subtitle"
              variant="body2"
              sx={{ mt: 0.5, color: colors.text }}
            >
              Seu espaço de preparação, materiais e acompanhamento das visitas
              aos abrigos.
            </Typography>
          </Box>
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          {shelter && (
            <Stack
              data-testid="member-area-header-shelter"
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                p: 1.25,
              }}
            >
              <HomeOutlined sx={{ color: colors.blue }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.muted }}>
                  Meu abrigo
                </Typography>
                <Typography variant="subtitle2" fontWeight={800}>
                  {shelter.name}
                </Typography>
              </Box>
            </Stack>
          )}
          <Button
            data-testid="member-area-header-profile"
            component={Link}
            to="/perfil"
            startIcon={<PersonOutline />}
            variant="outlined"
            sx={{
              minHeight: 44,
              flexShrink: 0,
              color: colors.blue,
              borderColor: colors.blue,
            }}
          >
            Meu Perfil
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
export default MemberAreaHeader;
