import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Container,
  Paper,
  Grid,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from "@mui/material";
import {
  PlaceOutlined,
  LocationCityOutlined,
  MapOutlined,
  LocalPostOfficeOutlined,
  PersonOutline,
  SchoolOutlined,
  GroupOutlined,
  Image as ImageIcon,
  InfoOutlined,
  HomeOutlined,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import BackHeader from "@/components/common/header/BackHeader";
import { ShelterResponseDto } from "./types";
import { apiGetMyShelters } from "@/features/leaders/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { fmtDate } from "@/utils/dates";
import ChipsListWithExpand from "./components/ChipsListWithExpand";

type ShelterOption = {
  id: string;
  name: string;
};

export default function ShelterDetailsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [allShelters, setAllShelters] = useState<ShelterResponseDto[]>([]);
  const [shelterOptions, setShelterOptions] = useState<ShelterOption[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noSheltersLinked, setNoSheltersLinked] = useState(false);

  const shelter = useMemo(() => {
    if (!selectedShelterId || allShelters.length === 0) return null;
    return allShelters.find((s) => s.id === selectedShelterId) || null;
  }, [selectedShelterId, allShelters]);

  useEffect(() => {
    const loadShelters = async () => {
      try {
        setLoading(true);
        setError("");

        const shelters = await apiGetMyShelters();
        
        if (!shelters || shelters.length === 0) {
          setNoSheltersLinked(true);
          setLoading(false);
          return;
        }

        setAllShelters(shelters as ShelterResponseDto[]);

        const options = shelters.map((s: any) => ({
          id: s.id,
          name: s.name,
        }));
        setShelterOptions(options);

        const initialShelterId = shelters[0].id;
        setSelectedShelterId(initialShelterId);
      } catch (err: any) {
        console.error("Error loading shelters:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Erro ao carregar abrigos"
        );
      } finally {
        setLoading(false);
      }
    };

    loadShelters();
  }, []);

  const address = useMemo(() => shelter?.address, [shelter]);
  const teams = useMemo(() => shelter?.teams || [], [shelter]);
  
  const allLeaders = useMemo(() => {
    if (teams.length === 0) return [];
    const leadersMap = new Map<string, any>();
    teams.forEach((team) => {
      team.leaders?.forEach((leader) => {
        if (!leadersMap.has(leader.id)) {
          leadersMap.set(leader.id, leader);
        }
      });
    });
    return Array.from(leadersMap.values());
  }, [teams]);

  const allTeachers = useMemo(() => {
    if (teams.length === 0) return [];
    const teachersMap = new Map<string, any>();
    teams.forEach((team) => {
      team.teachers?.forEach((teacher) => {
        if (!teachersMap.has(teacher.id)) {
          teachersMap.set(teacher.id, teacher);
        }
      });
    });
    return Array.from(teachersMap.values());
  }, [teams]);

  const leaderTeams = useMemo(() => {
    if (teams.length === 0) return [];
    return teams.filter((team) => team.isLeaderInTeam === true);
  }, [teams]);

  const SkeletonLoader = () => (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 4 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Skeleton variant="rectangular" width={120} height={120} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={24} />
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" height={24} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (noSheltersLinked) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    bgcolor: "info.light",
                    mb: 2,
                  }}
                >
                  <HomeOutlined sx={{ fontSize: { xs: 40, md: 50 } }} />
                </Avatar>
              </Box>
              <Typography
                variant="h5"
                fontWeight={700}
                gutterBottom
                sx={{ mb: 2 }}
              >
                Nenhum abrigo vinculado
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 600, mx: "auto" }}
              >
                Você ainda não está vinculado a nenhum abrigo. Entre em contato com o administrador do sistema para ser associado a um abrigo.
              </Typography>
              <Alert
                severity="info"
                icon={<InfoOutlined />}
                sx={{
                  borderRadius: 2,
                  textAlign: "left",
                  maxWidth: 600,
                  mx: "auto",
                }}
              >
                <Typography variant="body2">
                  <strong>O que fazer?</strong>
                  <br />
                  Entre em contato com o administrador do sistema para solicitar a vinculação a um abrigo. Após a vinculação, você poderá visualizar e gerenciar as informações do abrigo aqui.
                </Typography>
              </Alert>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!shelter) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nenhum abrigo encontrado
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pb: 4,
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mb: 2 }}>
            <BackHeader title={shelter.name} />
            {shelterOptions.length > 1 && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ maxWidth: { xs: "100%", sm: 400 } }}>
                  <InputLabel>Selecionar Abrigo</InputLabel>
                  <Select
                    value={selectedShelterId || ""}
                    onChange={(e) => setSelectedShelterId(e.target.value)}
                    label="Selecionar Abrigo"
                    aria-label="Selecionar abrigo para visualizar"
                  >
                    {shelterOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, md: 4 },
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: { xs: 2, md: 3 },
                  flexDirection: { xs: "column", sm: "row" }
                }}>
                  {shelter.mediaItem?.url && (
                    <Avatar
                      src={shelter.mediaItem.url}
                      alt={shelter.name}
                      sx={{
                        width: { xs: 80, md: 120 },
                        height: { xs: 80, md: 120 },
                        borderRadius: 2,
                        alignSelf: { xs: "center", sm: "flex-start" }
                      }}
                    >
                      <ImageIcon />
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <Typography 
                      variant="h4" 
                      fontWeight={700} 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: "1.5rem", md: "2.125rem" },
                        textAlign: { xs: "center", sm: "left" }
                      }}
                    >
                      {shelter.name}
                    </Typography>
                    {shelter.description && (
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ 
                          mt: 1,
                          textAlign: { xs: "center", sm: "left" }
                        }}
                      >
                        {shelter.description}
                      </Typography>
                    )}
                    <Box sx={{ 
                      mt: 2, 
                      display: "flex", 
                      gap: 1, 
                      flexWrap: "wrap",
                      justifyContent: { xs: "center", sm: "flex-start" }
                    }}>
                      <Chip
                        icon={<GroupOutlined />}
                        label={`${shelter.teamsQuantity || 0} Equipe(s)`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<PersonOutline />}
                        label={`${allLeaders.length} Líder(es)`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<SchoolOutlined />}
                        label={`${allTeachers.length} Professor(es)`}
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Endereço
                </Typography>
                <Divider sx={{ my: 2 }} />
                {address ? (
                  <Stack spacing={1.5}>
                    {address.street && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <PlaceOutlined sx={{ color: "text.secondary", mt: 0.5 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Rua
                          </Typography>
                          <Typography variant="body2">
                            {address.street}
                            {address.number && `, ${address.number}`}
                            {address.complement && ` - ${address.complement}`}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {address.district && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <LocationCityOutlined
                          sx={{ color: "text.secondary", mt: 0.5 }}
                        />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Bairro
                          </Typography>
                          <Typography variant="body2">{address.district}</Typography>
                        </Box>
                      </Box>
                    )}
                    {address.city && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <MapOutlined sx={{ color: "text.secondary", mt: 0.5 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cidade / Estado
                          </Typography>
                          <Typography variant="body2">
                            {address.city} - {address.state}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {address.postalCode && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <LocalPostOfficeOutlined
                          sx={{ color: "text.secondary", mt: 0.5 }}
                        />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            CEP
                          </Typography>
                          <Typography variant="body2">{address.postalCode}</Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Endereço não disponível
                  </Typography>
                )}
              </Paper>
            </Grid>

            {leaderTeams.length > 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Minhas Equipes ({leaderTeams.length})
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {leaderTeams.map((team) => (
                      <Grid item xs={12} sm={6} md={4} key={team.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: "100%",
                            border: "2px solid",
                            borderColor: "primary.main",
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              gutterBottom
                              sx={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 1,
                                flexWrap: "wrap"
                              }}
                            >
                              Equipe {team.numberTeam}
                              <Chip
                                label="Minha Equipe"
                                size="small"
                                color="primary"
                              />
                            </Typography>
                            <Stack spacing={1.5} sx={{ mt: 2 }}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                >
                                  <PersonOutline fontSize="small" />
                                  Líderes ({team.leaders?.length || 0})
                                </Typography>
                                <ChipsListWithExpand
                                  items={team.leaders?.map((leader) => ({
                                    id: leader.id,
                                    label:
                                      leader.user?.name ||
                                      leader.user?.email ||
                                      "Sem nome",
                                    color: "primary" as const,
                                    variant: "outlined" as const,
                                  })) || []}
                                  maxVisible={3}
                                  emptyMessage="Nenhum líder"
                                />
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                >
                                  <SchoolOutlined fontSize="small" />
                                  Professores ({team.teachers?.length || 0})
                                </Typography>
                                <ChipsListWithExpand
                                  items={team.teachers?.map((teacher) => ({
                                    id: teacher.id,
                                    label:
                                      teacher.user?.name ||
                                      teacher.user?.email ||
                                      "Sem nome",
                                    color: "secondary" as const,
                                    variant: "outlined" as const,
                                  })) || []}
                                  maxVisible={3}
                                  emptyMessage="Nenhum professor"
                                />
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {teams.length > 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Todas as Equipes
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {teams.map((team) => (
                      <Grid item xs={12} sm={6} md={4} key={team.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: "100%",
                            border: team.isLeaderInTeam ? "2px solid" : "1px solid",
                            borderColor: team.isLeaderInTeam ? "primary.main" : "divider",
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              gutterBottom
                              sx={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 1,
                                flexWrap: "wrap"
                              }}
                            >
                              Equipe {team.numberTeam}
                              {team.isLeaderInTeam && (
                                <Chip
                                  label="Minha Equipe"
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </Typography>
                            <Stack spacing={1.5} sx={{ mt: 2 }}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                >
                                  <PersonOutline fontSize="small" />
                                  Líderes ({team.leaders?.length || 0})
                                </Typography>
                                <ChipsListWithExpand
                                  items={team.leaders?.map((leader) => ({
                                    id: leader.id,
                                    label:
                                      leader.user?.name ||
                                      leader.user?.email ||
                                      "Sem nome",
                                    color: "primary" as const,
                                    variant: "outlined" as const,
                                  })) || []}
                                  maxVisible={3}
                                  emptyMessage="Nenhum líder"
                                />
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                >
                                  <SchoolOutlined fontSize="small" />
                                  Professores ({team.teachers?.length || 0})
                                </Typography>
                                <ChipsListWithExpand
                                  items={team.teachers?.map((teacher) => ({
                                    id: teacher.id,
                                    label:
                                      teacher.user?.name ||
                                      teacher.user?.email ||
                                      "Sem nome",
                                    color: "secondary" as const,
                                    variant: "outlined" as const,
                                  })) || []}
                                  maxVisible={3}
                                  emptyMessage="Nenhum professor"
                                />
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {shelter.createdAt && (
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Informações
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {shelter.createdAt && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Criado em
                        </Typography>
                        <Typography variant="body2" component="time" dateTime={shelter.createdAt}>
                          {fmtDate(shelter.createdAt)}
                        </Typography>
                      </Grid>
                    )}
                    {shelter.updatedAt && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Atualizado em
                        </Typography>
                        <Typography variant="body2" component="time" dateTime={shelter.updatedAt}>
                          {fmtDate(shelter.updatedAt)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}

