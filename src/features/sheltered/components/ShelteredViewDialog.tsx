import React, { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Cake,
  Group,
  Home,
  Map,
  MenuBook,
  PhoneIphone,
  Update,
  WhatsApp,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { CopyButton, initials } from "@/utils/components";
import { ageFrom, formatDate, gLabel } from "@/utils/dateUtils";
import {
  MIN_TOUCH_TARGET_PX,
  SHELTERED_MESSAGES,
  SHELTERED_TESTID,
} from "../constants";
import { buildMapsUrl, isFemale } from "../utils";
import type { ShelteredResponseDto } from "../types";

type Props = {
  open: boolean;
  loading: boolean;
  sheltered: ShelteredResponseDto | null;
  onClose: () => void;
  onEdit?: (sheltered: ShelteredResponseDto) => void;
};

function InfoCard({
  icon,
  title,
  testId,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      data-testid={testId}
      sx={{ p: 1.25, borderRadius: 2, height: "100%" }}
    >
      <Stack spacing={0.5} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          {icon}
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

export default function ShelteredViewDialog({
  open,
  loading,
  sheltered,
  onClose,
  onEdit,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const user = useSelector((state: RootState) => state.auth.user);

  const age = useMemo(() => ageFrom(sheltered?.birthDate), [sheltered?.birthDate]);

  const whatsappLink = useMemo(
    () =>
      sheltered
        ? buildWhatsappLink(
            sheltered.name,
            user?.name,
            sheltered.guardianPhone ?? undefined,
          )
        : null,
    [sheltered, user?.name],
  );

  const mapsUrl = buildMapsUrl(sheltered?.address);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      data-testid={SHELTERED_TESTID.VIEW_DIALOG}
      aria-labelledby="sheltered-view-dialog-title"
      slotProps={{
        paper: {
          sx: {
            width: { xs: "98%", sm: "44rem" },
            m: 0,
            borderRadius: { xs: 2, sm: 3 },
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          pb: { xs: 1.25, sm: 1.5 },
          bgcolor: "action.hover",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {!sheltered ? (
          <Typography variant="h6" id="sheltered-view-dialog-title">
            Detalhes do Acolhido
          </Typography>
        ) : (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar
              aria-hidden
              sx={{
                width: 48,
                height: 48,
                bgcolor: isFemale(sheltered) ? "secondary.main" : "primary.main",
                color: "common.white",
                fontWeight: 700,
              }}
            >
              {initials(sheltered.name)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography
                  variant="h6"
                  fontWeight={800}
                  noWrap={!isXs}
                  title={sheltered.name}
                  id="sheltered-view-dialog-title"
                  data-testid="sheltered-view-name"
                >
                  {sheltered.name}
                </Typography>
                <Chip size="small" label={gLabel(sheltered.gender)} />
                {typeof age === "number" && <Chip size="small" label={`${age} anos`} />}
                <Chip
                  size="small"
                  variant="outlined"
                  color={sheltered.shelter ? "primary" : "default"}
                  label={
                    sheltered.shelter
                      ? `Abrigo ${sheltered.shelter.name}`
                      : SHELTERED_MESSAGES.NO_SHELTER
                  }
                  data-testid="sheltered-view-shelter"
                />
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Skeleton height={200} data-testid="sheltered-view-loading" />
        ) : !sheltered ? (
          <Alert severity="info" data-testid="sheltered-view-empty">
            Nenhum acolhido selecionado.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <InfoCard
                  icon={<PhoneIphone fontSize="small" aria-hidden />}
                  title="Telefone do Responsável"
                  testId="sheltered-view-guardian-phone"
                >
                  {sheltered.guardianPhone ? (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      {whatsappLink ? (
                        <Link
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ fontSize: ".95rem" }}
                        >
                          {sheltered.guardianPhone}
                        </Link>
                      ) : (
                        <Typography sx={{ fontSize: ".95rem" }}>
                          {sheltered.guardianPhone}
                        </Typography>
                      )}
                      {whatsappLink && (
                        <Tooltip title="Abrir WhatsApp">
                          <IconButton
                            size="small"
                            color="success"
                            component="a"
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Abrir WhatsApp do responsável"
                            data-testid="sheltered-view-whatsapp"
                            sx={{
                              minWidth: MIN_TOUCH_TARGET_PX,
                              minHeight: MIN_TOUCH_TARGET_PX,
                            }}
                          >
                            <WhatsApp fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <CopyButton
                        value={sheltered.guardianPhone}
                        title="Copiar telefone"
                      />
                    </Stack>
                  ) : (
                    <Typography variant="body2">—</Typography>
                  )}
                </InfoCard>
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoCard
                  icon={<Group fontSize="small" aria-hidden />}
                  title="Responsável"
                  testId="sheltered-view-guardian-name"
                >
                  <Typography>
                    {sheltered.guardianName || SHELTERED_MESSAGES.NO_GUARDIAN}
                  </Typography>
                </InfoCard>
              </Grid>
            </Grid>

            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <InfoCard
                  icon={<Cake fontSize="small" aria-hidden />}
                  title="Nascimento"
                  testId="sheltered-view-birth-date"
                >
                  <Typography>
                    {formatDate(sheltered.birthDate)}
                    {typeof age === "number" ? ` (${age} anos)` : ""}
                  </Typography>
                </InfoCard>
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoCard
                  icon={<Home fontSize="small" aria-hidden />}
                  title="No abrigo desde"
                  testId="sheltered-view-joined-at"
                >
                  <Typography>{formatDate(sheltered.joinedAt)}</Typography>
                </InfoCard>
              </Grid>
            </Grid>

            <Paper
              variant="outlined"
              sx={{ p: 1.25, borderRadius: 2 }}
              data-testid="sheltered-view-address"
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Home fontSize="small" aria-hidden />
                <Typography variant="caption" color="text.secondary">
                  Endereço
                </Typography>
              </Stack>
              {sheltered.address ? (
                <Grid container spacing={1.25}>
                  {(sheltered.address.street || sheltered.address.number) && (
                    <Grid item xs={12} sm={8}>
                      <Typography>
                        {sheltered.address.street ?? ""} {sheltered.address.number ?? ""}
                      </Typography>
                    </Grid>
                  )}
                  {sheltered.address.district && (
                    <Grid item xs={12} sm={4}>
                      <Typography>{sheltered.address.district}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      {sheltered.address.city}/{sheltered.address.state}
                    </Typography>
                  </Grid>
                  {sheltered.address.postalCode && (
                    <Grid item xs={12} sm={6}>
                      <Typography>{sheltered.address.postalCode}</Typography>
                    </Grid>
                  )}
                  {sheltered.address.complement && (
                    <Grid item xs={12}>
                      <Typography>{sheltered.address.complement}</Typography>
                    </Grid>
                  )}
                  {mapsUrl && (
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          component="a"
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<Map fontSize="small" />}
                          data-testid="sheltered-view-maps"
                          sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        >
                          Abrir no Maps
                        </Button>
                        <CopyButton value={mapsUrl} title="Copiar endereço" />
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography variant="body2">{SHELTERED_MESSAGES.NO_ADDRESS}</Typography>
              )}
            </Paper>

            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <InfoCard
                  icon={<MenuBook fontSize="small" aria-hidden />}
                  title="Criado em"
                  testId="sheltered-view-created-at"
                >
                  <Typography>{formatDate(sheltered.createdAt, true)}</Typography>
                </InfoCard>
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoCard
                  icon={<Update fontSize="small" aria-hidden />}
                  title="Atualizado em"
                  testId="sheltered-view-updated-at"
                >
                  <Typography>{formatDate(sheltered.updatedAt, true)}</Typography>
                </InfoCard>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {sheltered && onEdit && (
          <Button
            fullWidth={isXs}
            onClick={() => onEdit(sheltered)}
            variant="outlined"
            color="primary"
            data-testid="sheltered-view-edit"
            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
          >
            Editar
          </Button>
        )}
        <Button
          fullWidth={isXs}
          onClick={onClose}
          variant="contained"
          data-testid="sheltered-view-close"
          sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
