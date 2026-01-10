import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Chip,
  Box,
  Typography,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  IconButton,
  Link,
  useMediaQuery,
  useTheme,
  Avatar,
} from "@mui/material";
import {
  CalendarToday,
  NumbersOutlined,
  PersonOutline,
  SchoolOutlined,
  PlaceOutlined,
  Update as UpdateIcon,
  LocationCityOutlined,
  MapOutlined,
  LocalPostOfficeOutlined,
  ContentCopy,
  Phone as PhoneIcon,
  WhatsApp,
  Image as ImageIcon,
  DescriptionOutlined,
  Edit as EditIcon,
  GroupOutlined,
} from "@mui/icons-material";
import { ShelterResponseDto } from "./types";
import { fmtDate } from "@/utils/dates";
import { CopyButton, initials } from "@/utils/components";
import TeamManagementDialog from "./components/TeamManagementDialog";
import { useIsFeatureEnabled } from "@/features/feature-flags";

type Props = {
  open: boolean;
  loading: boolean;
  shelter: ShelterResponseDto | null;
  onClose: () => void;
};


function LineCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
      <Stack spacing={0.5}>
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


export default function ShelterViewDialog({ open, loading, shelter, onClose }: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [teamManagementOpen, setTeamManagementOpen] = React.useState(false);
  const isAddressEnabled = useIsFeatureEnabled('shelter-address');

  console.log('[ShelterViewDialog] shelter-address flag:', isAddressEnabled);
  console.log('[ShelterViewDialog] shelter?.address:', shelter?.address);

  const address = shelter?.address;
  const teachers = shelter?.teachers ?? [];
  const leaders = shelter?.leaders ?? [];
  const teams = shelter?.teams ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          width: isXs ? "98%" : "44rem",
          m: 0,
          borderRadius: { xs: 2, sm: 3 },
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          pb: { xs: 1.25, sm: 1.5 },
          background:
            "linear-gradient(135deg, rgba(76,175,80,.08) 0%, rgba(2,136,209,.08) 100%)",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {!shelter ? (
          <Typography variant="h6">Detalhes do Abrigo</Typography>
        ) : (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "success.main",
                  color: "success.contrastText",
                  fontWeight: 700,
                }}
                aria-label="avatar do abrigo"
              >
                {initials(`Abrigo ${shelter.name}`)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  flexWrap="wrap"
                >
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    noWrap={!isXs}
                    title={`Abrigo ${shelter.name}`}
                  >
                    Abrigo {shelter.name}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        )}
      </Box>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {loading && !shelter && (
          <Box textAlign="center" my={2}>
            <Skeleton height={28} width="60%" sx={{ mx: "auto", mb: 2 }} />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={120} sx={{ mt: 2 }} />
          </Box>
        )}

        {!shelter ? (
          <Typography variant="body1" color="text.secondary">
            Nenhum abrigo selecionado.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {shelter.mediaItem && (
              <Box
                sx={{
                  width: "100%",
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "grey.100",
                  position: "relative",
                }}
              >
                <Box
                  component="img"
                  src={shelter.mediaItem.url}
                  alt={shelter.mediaItem.title || "Imagem do abrigo"}
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 400,
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ImageIcon fontSize="small" />
                  <Typography variant="caption">
                    {shelter.mediaItem.title}
                  </Typography>
                </Box>
              </Box>
            )}

            {shelter.description && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
                  <DescriptionOutlined fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Descrição
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {shelter.description}
                </Typography>
              </Paper>
            )}

            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <LineCard icon={<NumbersOutlined fontSize="small" />} title="Nome">
                  <Typography variant="body1" fontWeight={600}>
                    {shelter.name}
                  </Typography>
                </LineCard>
              </Grid>
              {shelter.teamsQuantity !== undefined && (
                <Grid item xs={12} sm={6}>
                  <LineCard icon={<GroupOutlined fontSize="small" />} title="Quantidade de Equipes">
                    <Typography variant="body1" fontWeight={600}>
                      {shelter.teamsQuantity}
                    </Typography>
                  </LineCard>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <LineCard icon={<UpdateIcon fontSize="small" />} title="Atualizado em">
                  <Typography variant="body1">
                    {fmtDate(shelter.updatedAt)}
                  </Typography>
                </LineCard>
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                  <Chip
                    size="small"
                    label={`Equipes: ${teams.length}`}
                    color={teams.length > 0 ? "primary" : "default"}
                    variant={teams.length > 0 ? "filled" : "outlined"}
                  />
                  <Chip
                    size="small"
                    label={`Membros: ${teachers.length}`}
                    color={teachers.length > 0 ? "info" : "default"}
                    variant={teachers.length > 0 ? "filled" : "outlined"}
                  />
                  <Chip
                    size="small"
                    label={`Líderes: ${leaders.length}`}
                    color={leaders.length > 0 ? "success" : "default"}
                    variant={leaders.length > 0 ? "filled" : "outlined"}
                  />
                </Stack>
                <Tooltip title="Gerenciar Equipes">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setTeamManagementOpen(true)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>

            {isAddressEnabled && address && (
              <Grid container spacing={1.25}>
                <Grid item xs={12}>
                  <LineCard icon={<PlaceOutlined fontSize="small" />} title="Endereço">
                    <Stack spacing={0.5}>
                      <Typography variant="body1" fontWeight={600}>
                        {address.street}
                        {address.number && `, ${address.number}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {address.district} • {address.city} - {address.state}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        CEP: {address.postalCode}
                      </Typography>
                    </Stack>
                  </LineCard>
                </Grid>
              </Grid>
            )}

            <Grid container spacing={1.25}>
              <Grid item xs={12}>
                <LineCard
                  icon={<PersonOutline fontSize="small" />}
                  title={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption">Líderes</Typography>
                      <Tooltip title="Gerenciar Equipes">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setTeamManagementOpen(true)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  {leaders.length > 0 ? (
                    <Stack spacing={1}>
                      {leaders.map((leader) => (
                        <Box key={leader.id}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body1" fontWeight={600}>
                              {leader.user?.name || leader.user?.email || leader.id}
                            </Typography>
                            {leader.user?.phone && (
                              <>
                                <Link href={`tel:${leader.user.phone}`} underline="hover">
                                  {leader.user.phone}
                                </Link>
                                <CopyButton value={leader.user.phone} title="Copiar telefone" />
                              </>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum líder vinculado
                    </Typography>
                  )}
                </LineCard>
              </Grid>
            </Grid>

            <Grid container spacing={1.25}>
              <Grid item xs={12}>
                <LineCard
                  icon={<SchoolOutlined fontSize="small" />}
                  title={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption">Membros</Typography>
                      <Tooltip title="Gerenciar Equipes">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setTeamManagementOpen(true)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  {teachers.length > 0 ? (
                    <Stack spacing={1}>
                      {teachers.map((teacher) => (
                        <Box key={teacher.id}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body1" fontWeight={600}>
                              {teacher.user?.name || teacher.user?.email || teacher.id}
                            </Typography>
                            {teacher.user?.phone && (
                              <>
                                <Link href={`tel:${teacher.user.phone}`} underline="hover">
                                  {teacher.user.phone}
                                </Link>
                                <CopyButton value={teacher.user.phone} title="Copiar telefone" />
                              </>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum membro vinculado
                    </Typography>
                  )}
                </LineCard>
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
        <Button fullWidth={isXs} onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>

      <TeamManagementDialog
        open={teamManagementOpen}
        shelter={shelter}
        onClose={() => setTeamManagementOpen(false)}
        onSuccess={async () => {
          // No action needed on success
        }}
      />
    </Dialog>
  );
}
