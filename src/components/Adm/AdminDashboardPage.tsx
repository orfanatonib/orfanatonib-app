import type { ReactElement } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Fab,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  NoteAdd,
  EventNote,
  PhotoLibrary,
  Collections,
  VideoLibrary,
  Description,
  Comment,
  Campaign,
  ContactPhone,
  Lightbulb,
  RateReview,
  Group,
  School,
  SupervisorAccount,
  Groups,
  MenuBook,
  ArrowUpward,
  ChevronRight,
  CalendarMonth,
  Favorite,
} from "@mui/icons-material";

import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

type SectionId = "all" | "pessoas" | "abrigos" | "conteudo" | "midias" | "materiais" | "interacoes";

interface CardData {
  title: string;
  description: string;
  icon: ReactElement;
  path: string;
  section: Exclude<SectionId, "all">;
}

const cardData: CardData[] = [
  // 👥 PESSOAS - Gestão de Pessoas
  { title: "Usuários", description: "Gerencie contas de acesso ao sistema.", icon: <Group fontSize="large" color="primary" />, path: "/adm/usuarios", section: "pessoas" },
  { title: "Perfis", description: "Conheça melhor as pessoas do ministério.", icon: <Favorite fontSize="large" color="primary" />, path: "/adm/perfis", section: "pessoas" },
  { title: "Membros", description: "Gerencie membros voluntários do ministério.", icon: <School fontSize="large" color="primary" />, path: "/adm/membros", section: "pessoas" },
  { title: "Líderes", description: "Gerencie líderes responsáveis pelos abrigos.", icon: <SupervisorAccount fontSize="large" color="primary" />, path: "/adm/lideres", section: "pessoas" },
  { title: "Abrigados", description: "Gerencie crianças e jovens dos abrigos.", icon: <Group fontSize="large" color="primary" />, path: "/adm/abrigados", section: "pessoas" },

  // 🏠 ABRIGOS - Gestão de Abrigos
  { title: "Abrigos", description: "Cadastre e gerencie os abrigos parceiros.", icon: <Groups fontSize="large" color="primary" />, path: "/adm/abrigos", section: "abrigos" },
  { title: "Pagelas", description: "Gerencie pagelas de presença e atividades.", icon: <Description fontSize="large" color="primary" />, path: "/adm/pagelas", section: "abrigos" },
  { title: "Agendamentos", description: "Agende reuniões e visitas aos abrigos.", icon: <CalendarMonth fontSize="large" color="primary" />, path: "/adm/agendamentos", section: "abrigos" },

  // 📝 CONTEÚDO - Criação de Conteúdo
  { title: "Criar Página", description: "Crie novas páginas de conteúdo para o site.", icon: <NoteAdd fontSize="large" color="primary" />, path: "/adm/criar-pagina", section: "conteudo" },
  { title: "Meditações", description: "Crie e edite meditações semanais.", icon: <MenuBook fontSize="large" color="primary" />, path: "/adm/meditacoes", section: "conteudo" },
  { title: "Documentos", description: "Disponibilize documentos para download.", icon: <Description fontSize="large" color="primary" />, path: "/adm/documentos", section: "conteudo" },
  { title: "Informativos", description: "Gerencie banners e avisos do site.", icon: <Campaign fontSize="large" color="primary" />, path: "/adm/informativos", section: "conteudo" },

  // 📸 MÍDIAS - Fotos e Vídeos
  { title: "Galerias de Fotos", description: "Organize galerias de imagens do ministério.", icon: <PhotoLibrary fontSize="large" color="primary" />, path: "/adm/paginas-fotos", section: "midias" },
  { title: "Fotos dos Abrigos", description: "Gerencie fotos específicas de cada abrigo.", icon: <Collections fontSize="large" color="primary" />, path: "/adm/fotos-abrigos", section: "midias" },
  { title: "Vídeos", description: "Adicione vídeos e links do YouTube.", icon: <VideoLibrary fontSize="large" color="primary" />, path: "/adm/paginas-videos", section: "midias" },

  // 💡 MATERIAIS - Materiais e Ideias
  { title: "Materiais de Visita", description: "Gerencie materiais para as visitas.", icon: <EventNote fontSize="large" color="primary" />, path: "/adm/paginas-materiais-visita", section: "materiais" },
  { title: "Páginas de Ideias", description: "Organize páginas com sugestões de atividades.", icon: <Lightbulb fontSize="large" color="primary" />, path: "/adm/paginas-ideias", section: "materiais" },
  { title: "Ideias Compartilhadas", description: "Veja ideias enviadas pelos abrigos.", icon: <Lightbulb fontSize="large" color="primary" />, path: "/adm/ideias-compartilhadas", section: "materiais" },

  // 💬 INTERAÇÕES - Comunicação com Usuários
  { title: "Comentários", description: "Modere comentários dos usuários.", icon: <Comment fontSize="large" color="primary" />, path: "/adm/comentarios", section: "interacoes" },
  { title: "Contatos", description: "Visualize mensagens de contato recebidas.", icon: <ContactPhone fontSize="large" color="primary" />, path: "/adm/contatos", section: "interacoes" },
  { title: "Feedbacks", description: "Analise feedbacks enviados pelos usuários.", icon: <RateReview fontSize="large" color="primary" />, path: "/adm/feedbacks", section: "interacoes" },
];

const sectionLabels: Record<SectionId, string> = {
  all: "Tudo",
  pessoas: "Pessoas",
  abrigos: "Abrigos",
  conteudo: "Conteúdo",
  midias: "Mídias",
  materiais: "Materiais",
  interacoes: "Interações",
};

const order: Exclude<SectionId, "all">[] = ["pessoas", "abrigos", "conteudo", "midias", "materiais", "interacoes"];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const role = user?.role;
  const isAdmin = !!isAuthenticated && role === UserRole.ADMIN;
  const isLeader = !!isAuthenticated && role === UserRole.LEADER;
  const isSimpleMode = isLeader && !isAdmin;

  const [query, setQuery] = React.useState("");
  const [section, setSection] = React.useState<SectionId>("all");
  const [showTop, setShowTop] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => setShowTop(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const normalizedQuery = query.trim().toLowerCase();
  const leaderAllowed = new Set<string>([
    "/adm/abrigados",
    "/adm/membros",
    "/adm/perfis",
    "/adm/abrigos",
    "/adm/pagelas",
    "/adm/agendamentos",
  ]);

  const canSeeCard = (card: CardData): boolean => {
    if (isAdmin) return true;
    if (isLeader) return leaderAllowed.has(card.path);
    return false;
  };

  const visibleCards = React.useMemo(
    () => cardData.filter(canSeeCard),
    [isAdmin, isLeader]
  );

  const grouped = React.useMemo(() => {
    const g: Record<Exclude<SectionId, "all">, CardData[]> = {
      pessoas: [],
      abrigos: [],
      conteudo: [],
      midias: [],
      materiais: [],
      interacoes: [],
    };
    for (const c of visibleCards) {
      const inSection = section === "all" ? true : c.section === section;
      if (!inSection) continue;
      if (normalizedQuery) {
        const hay = `${c.title} ${c.description}`.toLowerCase();
        if (!hay.includes(normalizedQuery)) continue;
      }
      g[c.section].push(c);
    }
    return g;
  }, [section, normalizedQuery, visibleCards]);

  const hasResults =
    grouped.pessoas.length + grouped.abrigos.length + grouped.conteudo.length + 
    grouped.midias.length + grouped.materiais.length + grouped.interacoes.length > 0;

  const MobileList: React.FC = () => {
    const allFiltered = order.flatMap((sec) => grouped[sec]);

    return (
      <Box sx={{ width: "100%", px: 2, pb: 8, mt: 0, pt: 0 }}>
        {!isSimpleMode && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              bgcolor: "background.paper",
              pt: 0,

              pb: 1.25,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <TextField
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar… (ex.: fotos, usuários, vídeos)"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
                gap: 0.5,
              }}
            >
              {(["all", "pessoas", "abrigos", "conteudo", "midias", "materiais", "interacoes"] as SectionId[]).map((key) => (
                <Button
                  key={key}
                  size="small"
                  variant={section === key ? "contained" : "outlined"}
                  onClick={() => setSection(key)}
                  sx={{
                    textTransform: "none",
                    justifyContent: "center",
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: 12,
                    lineHeight: 1.2,
                    minWidth: 0,
                  }}
                >
                  {sectionLabels[key]}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {!isSimpleMode &&
          order.map((sec) =>
            grouped[sec].length ? (
              <Box key={sec} sx={{ mt: 2 }}>
                {section === "all" && (
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ pl: 0.5, letterSpacing: 0.4 }}
                  >
                    {sectionLabels[sec]}
                  </Typography>
                )}
                <List dense sx={{ mt: section === "all" ? 0.5 : 1 }}>
                  {grouped[sec].map((card) => (
                    <Paper
                      key={card.path}
                      variant="outlined"
                      sx={{ mb: 1, borderRadius: 2, overflow: "hidden" }}
                    >
                      <ListItemButton onClick={() => navigate(card.path)}>
                        <ListItemIcon sx={{ minWidth: 40 }}>{card.icon}</ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={700}>
                              {card.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {card.description}
                            </Typography>
                          }
                        />
                        <ChevronRight />
                      </ListItemButton>
                    </Paper>
                  ))}
                </List>
              </Box>
            ) : null
          )}

        {isSimpleMode && (
          <>
            <List dense sx={{ mt: 2 }}>
              {allFiltered.map((card) => (
                <Paper
                  key={card.path}
                  variant="outlined"
                  sx={{ mb: 1, borderRadius: 2, overflow: "hidden" }}
                >
                  <ListItemButton onClick={() => navigate(card.path)}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{card.icon}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={700}>
                          {card.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      }
                    />
                    <ChevronRight />
                  </ListItemButton>
                </Paper>
              ))}
            </List>

            {allFiltered.length === 0 && (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Nada disponível para seu perfil.
                </Typography>
              </Box>
            )}
          </>
        )}

        {!hasResults && !isSimpleMode && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Nada encontrado para “{query}”.
            </Typography>
          </Box>
        )}

        {showTop && (
          <Fab
            color="primary"
            size="small"
            aria-label="Voltar ao topo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            sx={{ position: "fixed", bottom: 88, right: 16 }}
          >
            <ArrowUpward />
          </Fab>
        )}
      </Box>
    );
  };

  const DesktopGrid: React.FC = () => {
    const allFiltered = order.flatMap((sec) => grouped[sec]);
    const greetName =
      (user?.name && user.name.split(" ")[0]) || (isAdmin ? "Admin" : isLeader ? "Líder(a)" : "Usuário");
    return (
      <Box sx={{ width: "100%", px: { xs: 2, md: 6 }, pt: { xs: 4, md: 0 } }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign={{ xs: "center", md: "left" }}
          mb={3}
          sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, color: "primary.main" }}
        >
          Bem-vindo(a), {greetName} 👋
        </Typography>

        {!isSimpleMode && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center", mb: 3 }}>
            <TextField
              placeholder="Buscar…"
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 360, mr: 1 }}
            />
            {(["all", "pessoas", "abrigos", "conteudo", "midias", "materiais", "interacoes"] as SectionId[]).map((key) => (
              <Button
                key={key}
                variant={section === key ? "contained" : "outlined"}
                onClick={() => setSection(key)}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                {sectionLabels[key]}
              </Button>
            ))}
          </Box>
        )}

        {!isSimpleMode && <Divider sx={{ mb: 3 }} />}

        <Grid container spacing={3}>
          {allFiltered.map((card) => (
            <Grid item key={card.path} xs={12} sm={6} md={4} lg={3}>
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 3,
                  backgroundColor: "#ffffff",
                  transition: "transform .12s ease, box-shadow .12s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ mb: 1.5 }}>{card.icon}</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(card.path)}
                  aria-label={`Acessar ${card.title}`}
                >
                  Acessar
                </Button>
              </Paper>
            </Grid>
          ))}

          {allFiltered.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Nada disponível para seu perfil.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  return isMobile ? <MobileList /> : <DesktopGrid />;
}
