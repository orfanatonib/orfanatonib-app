import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Grid,
  Container,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import { apiGetMyShelters } from "@/features/leaders/api";

import { SectionHeader } from "./components/SectionHeader";
import { SheltersPanel } from "./components/SheltersPanel";
import { PagelasPanel } from "./components/PagelasPanel";
import { ShelteredPanel } from "./components/ShelteredPanel";
import { usePagelaSheltersManager, usePagelaSheltersManagerForLeader } from "./hooks";

import type { ShelterDto } from "./types";
import BackHeader from "@/components/common/header/BackHeader";

type MobileStep = "shelters" | "sheltered" | "pagelas";

export default function PagelaSheltersManager() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLeader = user?.role === UserRole.LEADER && user?.leaderProfile;
  
  if (isLeader) {
    return <PagelaSheltersManagerForLeader />;
  }

  return <PagelaSheltersManagerForAdmin />;
}

function PagelaSheltersManagerForLeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [mobileStep, setMobileStep] = useState<MobileStep>("sheltered");
  const [leaderShelters, setLeaderShelters] = useState<ShelterDto[]>([]);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLeaderShelters = async () => {
      try {
        setLoadingShelters(true);
        const sheltersData = await apiGetMyShelters();
        setLeaderShelters(sheltersData.map(s => ({
          ...s,
          address: s.address ?? {
            id: '',
            street: '',
            number: '',
            district: '',
            city: '',
            state: '',
            postalCode: '',
            createdAt: '',
            updatedAt: '',
          },
          leaders: s.teams?.flatMap(t => t.leaders || []).map(l => ({
            id: l.id,
            active: true,
            user: { id: l.id, name: l.name, email: l.email, phone: '', active: true, completed: true, commonUser: false },
          })) || [],
          members: s.teams?.flatMap(t => t.members || []).map(m => ({
            id: m.id,
            active: m.active ?? true,
            user: { id: m.user?.id || m.id, name: m.user?.name || '', email: m.user?.email || '', phone: '', active: true, completed: true, commonUser: false },
          })) || [],
        } as ShelterDto)));
        
        if (sheltersData.length > 0) {
          setSelectedShelterId(sheltersData[0].id);
        }
      } catch {
      } finally {
        setLoadingShelters(false);
      }
    };
    
    fetchLeaderShelters();
  }, []);

  const selectedShelter = useMemo(() => {
    return leaderShelters.find(s => s.id === selectedShelterId) || null;
  }, [leaderShelters, selectedShelterId]);

  const {
    selectedSheltered,
    sheltered,
    pagelas,
    handleShelteredSelect,
    handleShelteredSearchChange,
    handlePagelasSearchChange,
  } = usePagelaSheltersManagerForLeader(selectedShelterId);

  useEffect(() => {
    if (!isMobile) return;
    if (!selectedShelter) return;
    if (!selectedSheltered) {
      setMobileStep("sheltered");
    } else {
      setMobileStep("pagelas");
    }
  }, [isMobile, selectedShelter, selectedSheltered]);

  const handleMobileBack = () => {
    if (!isMobile) return;
    if (mobileStep === "pagelas") {
      handleShelteredSelect(null as any);
      setMobileStep("sheltered");
    }
  };

  const renderMobileContent = () => {
    if (!selectedShelter) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          {loadingShelters ? (
            <CircularProgress />
          ) : (
            <Typography color="text.secondary">Nenhum abrigo encontrado</Typography>
          )}
        </Box>
      );
    }

    switch (mobileStep) {
      case "sheltered":
        return (
          <ShelteredPanel
            sheltered={sheltered.data?.data || []}
            loading={sheltered.loading}
            error={sheltered.error}
            onShelteredSelect={handleShelteredSelect}
            selectedSheltered={selectedSheltered}
            shelterName={selectedShelter?.name || ""}
            currentPage={sheltered.currentPage}
            totalPages={sheltered.totalPages}
            onPageChange={sheltered.handlePageChange}
            onSearchChange={handleShelteredSearchChange}
          />
        );
      case "pagelas":
        return (
          <PagelasPanel
            pagelas={pagelas.data?.items || []}
            loading={pagelas.loading}
            error={pagelas.error}
            shelteredName={selectedSheltered?.name || ""}
            shelterName={selectedShelter?.name || ""}
            currentPage={pagelas.currentPage}
            totalPages={pagelas.totalPages}
            onPageChange={pagelas.handlePageChange}
            onSearchChange={handlePagelasSearchChange}
          />
        );
      default:
        return null;
    }
  };

  const renderDesktopContent = () => {
    if (!selectedShelter) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {loadingShelters ? (
            <CircularProgress />
          ) : (
            <Typography color="text.secondary">Nenhum abrigo encontrado</Typography>
          )}
        </Box>
      );
    }

    return (
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ShelteredPanel
              sheltered={sheltered.data?.data || []}
              loading={sheltered.loading}
              error={sheltered.error}
              onShelteredSelect={handleShelteredSelect}
              selectedSheltered={selectedSheltered}
              shelterName={selectedShelter?.name || ""}
              currentPage={sheltered.currentPage}
              totalPages={sheltered.totalPages}
              onPageChange={sheltered.handlePageChange}
              onSearchChange={handleShelteredSearchChange}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <PagelasPanel
              pagelas={pagelas.data?.items || []}
              loading={pagelas.loading}
              error={pagelas.error}
              shelteredName={selectedSheltered?.name || ""}
              shelterName={selectedShelter?.name || ""}
              currentPage={pagelas.currentPage}
              totalPages={pagelas.totalPages}
              onPageChange={pagelas.handlePageChange}
              onSearchChange={handlePagelasSearchChange}
            />
          </motion.div>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: 4,
        bgcolor: "background.default",
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📋 Gerenciar Pagelas" />
        </motion.div>

        {leaderShelters.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper
              elevation={2}
              sx={{
                mb: { xs: 2, md: 3 },
                borderRadius: 3,
                bgcolor: "background.paper",
              }}
            >
              <CardContent sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 2, md: 3 } }}>
                <FormControl fullWidth>
                  <InputLabel id="shelter-select-label">Selecione o Abrigo</InputLabel>
                  <Select
                    labelId="shelter-select-label"
                    value={selectedShelterId || ""}
                    label="Selecione o Abrigo"
                    onChange={(e) => setSelectedShelterId(e.target.value)}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                    }}
                  >
                    {leaderShelters.map((shelter) => (
                      <MenuItem key={shelter.id} value={shelter.id}>
                        {shelter.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Paper>
          </motion.div>
        )}

        <Box sx={{ mt: { xs: 2, md: 3 } }}>
        {isMobile ? (
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper
                elevation={2}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {mobileStep === "pagelas" && (
                      <IconButton
                        onClick={handleMobileBack}
                        size="small"
                        sx={{
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    )}
                    {mobileStep === "sheltered" && <Box sx={{ width: 40 }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {mobileStep === "sheltered" && "Abrigados"}
                        {mobileStep === "pagelas" && "Pagelas"}
                      </Typography>
                      {selectedShelter && leaderShelters.length === 1 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                            mt: 0.25,
                          }}
                        >
                          {selectedShelter.name}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Paper>
            </motion.div>

            {renderMobileContent()}
          </Box>
        ) : (
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper
                elevation={2}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />}>
                    {selectedShelter && (
                      <MuiLink
                        component="button"
                        onClick={() => handleShelteredSelect(null as any)}
                        sx={{
                          color: selectedSheltered ? "primary.main" : "text.primary",
                          fontWeight: selectedSheltered ? 600 : 400,
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {selectedShelter.name}
                      </MuiLink>
                    )}
                    {selectedSheltered && (
                      <Typography color="text.primary" fontWeight={600}>
                        {selectedSheltered.name}
                      </Typography>
                    )}
                  </Breadcrumbs>
                </CardContent>
              </Paper>
            </motion.div>

            {renderDesktopContent()}
          </Box>
        )}
      </Box>
      </Container>
    </Box>
  );
}

function PagelaSheltersManagerForAdmin() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [mobileStep, setMobileStep] = useState<MobileStep>("shelters");

  const {
    selectedShelter,
    selectedSheltered,
    shelters,
    sheltered,
    pagelas,
    handleShelterSelect,
    handleShelteredSelect,
    handleBack,
    handleSheltersSearchChange,
    handleShelteredSearchChange,
    handlePagelasSearchChange,
  } = usePagelaSheltersManager();

  useEffect(() => {
    if (!isMobile) return;
    if (!selectedShelter) setMobileStep("shelters");
    else if (!selectedSheltered) setMobileStep("sheltered");
    else setMobileStep("pagelas");
  }, [isMobile, selectedShelter, selectedSheltered]);

  const handleMobileBack = () => {
    if (!isMobile) return;
    if (mobileStep === "pagelas") {
      handleShelteredSelect(null as any);
      setMobileStep("sheltered");
    } else if (mobileStep === "sheltered") {
      handleShelterSelect(null as any);
      setMobileStep("shelters");
    }
  };

  const renderMobileContent = () => {
    switch (mobileStep) {
      case "shelters":
        return (
          <SheltersPanel
            shelters={shelters.data?.items || []}
            loading={shelters.loading}
            error={shelters.error}
            onShelterSelect={handleShelterSelect}
            selectedShelter={selectedShelter}
            currentPage={shelters.currentPage}
            totalPages={shelters.totalPages}
            onPageChange={shelters.handlePageChange}
            onSearchChange={handleSheltersSearchChange}
          />
        );
      case "sheltered":
        return (
          <ShelteredPanel
            sheltered={sheltered.data?.data || []}
            loading={sheltered.loading}
            error={sheltered.error}
            onShelteredSelect={handleShelteredSelect}
            selectedSheltered={selectedSheltered}
            shelterName={selectedShelter?.name || ""}
            currentPage={sheltered.currentPage}
            totalPages={sheltered.totalPages}
            onPageChange={sheltered.handlePageChange}
            onSearchChange={handleShelteredSearchChange}
          />
        );
      case "pagelas":
        return (
          <PagelasPanel
            pagelas={pagelas.data?.items || []}
            loading={pagelas.loading}
            error={pagelas.error}
            shelteredName={selectedSheltered?.name || ""}
            shelterName={selectedShelter?.name || ""}
            currentPage={pagelas.currentPage}
            totalPages={pagelas.totalPages}
            onPageChange={pagelas.handlePageChange}
            onSearchChange={handlePagelasSearchChange}
          />
        );
      default:
        return null;
    }
  };

  const renderDesktopContent = () => (
    <Grid container spacing={2} alignItems="stretch">
      <Grid item xs={12} md={4}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SheltersPanel
            shelters={shelters.data?.items || []}
            loading={shelters.loading}
            error={shelters.error}
            onShelterSelect={handleShelterSelect}
            selectedShelter={selectedShelter}
            currentPage={shelters.currentPage}
            totalPages={shelters.totalPages}
            onPageChange={shelters.handlePageChange}
            onSearchChange={handleSheltersSearchChange}
          />
        </motion.div>
      </Grid>
      <Grid item xs={12} md={4}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ShelteredPanel
            sheltered={sheltered.data?.data || []}
            loading={sheltered.loading}
            error={sheltered.error}
            onShelteredSelect={handleShelteredSelect}
            selectedSheltered={selectedSheltered}
            shelterName={selectedShelter?.name || ""}
            currentPage={sheltered.currentPage}
            totalPages={sheltered.totalPages}
            onPageChange={sheltered.handlePageChange}
            onSearchChange={handleShelteredSearchChange}
          />
        </motion.div>
      </Grid>
      <Grid item xs={12} md={4}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PagelasPanel
            pagelas={pagelas.data?.items || []}
            loading={pagelas.loading}
            error={pagelas.error}
            shelteredName={selectedSheltered?.name || ""}
            shelterName={selectedShelter?.name || ""}
            currentPage={pagelas.currentPage}
            totalPages={pagelas.totalPages}
            onPageChange={pagelas.handlePageChange}
            onSearchChange={handlePagelasSearchChange}
          />
        </motion.div>
      </Grid>
    </Grid>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: 4,
        bgcolor: "background.default",
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📋 Gerenciar Pagelas" />
        </motion.div>

        <Box sx={{ mt: { xs: 2, md: 3 } }}>
        {isMobile ? (
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper
                elevation={2}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {mobileStep !== "shelters" && (
                      <IconButton
                        onClick={handleMobileBack}
                        size="small"
                        sx={{
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    )}
                    {mobileStep === "shelters" && <Box sx={{ width: 40 }} />}
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {mobileStep === "shelters" && "Abrigos"}
                      {mobileStep === "sheltered" && "Abrigados"}
                      {mobileStep === "pagelas" && "Pagelas"}
                    </Typography>
                  </Stack>
                </CardContent>
              </Paper>
            </motion.div>

            {renderMobileContent()}
          </Box>
        ) : (
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper
                elevation={2}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />}>
                    <MuiLink
                      component="button"
                      onClick={() => {
                        handleShelterSelect(null as any);
                        handleShelteredSelect(null as any);
                      }}
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Abrigos
                    </MuiLink>
                    {selectedShelter && (
                      <MuiLink
                        component="button"
                        onClick={() => handleShelteredSelect(null as any)}
                        sx={{
                          color: selectedSheltered ? "primary.main" : "text.primary",
                          fontWeight: selectedSheltered ? 600 : 400,
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {selectedShelter.name}
                      </MuiLink>
                    )}
                    {selectedSheltered && (
                      <Typography color="text.primary" fontWeight={600}>
                        {selectedSheltered.name}
                      </Typography>
                    )}
                  </Breadcrumbs>
                </CardContent>
              </Paper>
            </motion.div>

            {renderDesktopContent()}
          </Box>
        )}
      </Box>
      </Container>
    </Box>
  );
}