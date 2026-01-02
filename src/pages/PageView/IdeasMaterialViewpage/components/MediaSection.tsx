import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Modal,
  Backdrop,
  Container,
  Tooltip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

import IdeasDocumentViewer from "./IdeasDocumentViewer";
import IdeasImageGalleryView from "./IdeasImageGalleryView";
import IdeasVideoPlayerView from "./IdeasVideoPlayerView";
import UserInfoModal from "./UserInfoModal";
import { MediaType, getMediaColor, getMediaEmoji, getMediaLabel } from "../utils";

// Cores mais suaves e harmoniosas para cada seção (tons mais escuros)
const sectionColors = [
  { primary: "#4F46E5", secondary: "#7C3AED", gradient: "135deg, #4F46E5 0%, #7C3AED 100%" }, // Indigo/Violet escuro
  { primary: "#0284C7", secondary: "#0891B2", gradient: "135deg, #0284C7 0%, #0891B2 100%" }, // Sky/Cyan escuro
  { primary: "#059669", secondary: "#10B981", gradient: "135deg, #059669 0%, #10B981 100%" }, // Emerald escuro
  { primary: "#D97706", secondary: "#F59E0B", gradient: "135deg, #D97706 0%, #F59E0B 100%" }, // Amber escuro
  { primary: "#DB2777", secondary: "#EC4899", gradient: "135deg, #DB2777 0%, #EC4899 100%" }, // Pink escuro
  { primary: "#7C3AED", secondary: "#8B5CF6", gradient: "135deg, #7C3AED 0%, #8B5CF6 100%" }, // Violet escuro
];

interface MediaTypeCardProps {
  type: MediaType;
  icon: React.ReactNode;
  items: any[];
  color: string;
  emoji: string;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
  sectionTitle: string;
}

function MediaTypeCard({
  type,
  icon,
  items,
  color,
  emoji,
  isExpanded,
  onToggle,
  accentColor,
  sectionTitle,
}: MediaTypeCardProps) {
  const theme = useTheme();
  
  if (items.length === 0) return null;

  return (
    <>
      {/* Card compacto */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: 1,
            border: "1px solid",
            borderColor: "divider",
            transition: "all 0.3s ease",
            overflow: "hidden",
            cursor: "pointer",
            "&:hover": {
              boxShadow: 4,
              borderColor: alpha(color, 0.5),
              transform: "translateX(4px)",
              bgcolor: alpha(color, 0.03),
            },
          }}
          onClick={onToggle}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, flex: 1 }}>
                {/* Ícone com fundo colorido */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: { xs: 36, sm: 42 },
                    height: { xs: 36, sm: 42 },
                    borderRadius: 2,
                    bgcolor: alpha(color, 0.15),
                    color: color,
                    transition: "all 0.3s ease",
                  }}
                >
                  {icon}
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "0.9rem", sm: "1.05rem" },
                      color: "text.primary",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {emoji} {getMediaLabel(type)}
                  </Typography>
                </Box>
                <Chip
                  label={`${items.length} ${items.length === 1 ? 'item' : 'itens'}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(color, 0.15),
                    color: color,
                    fontWeight: 600,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    height: { xs: 24, sm: 26 },
                    borderRadius: 2,
                  }}
                />
              </Box>
              <IconButton
                size="small"
                sx={{
                  bgcolor: alpha(color, 0.1),
                  color: color,
                  "&:hover": {
                    bgcolor: alpha(color, 0.2),
                  },
                }}
              >
                <FullscreenIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Fullscreen Overlay */}
      <Modal
        open={isExpanded}
        onClose={onToggle}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: {
              bgcolor: alpha(theme.palette.background.default, 0.95),
              backdropFilter: "blur(10px)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "auto",
            outline: "none",
          }}
        >
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ minHeight: "100%" }}
              >
                {/* Header fixo */}
                <Box
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.85)} 100%)`,
                    py: { xs: 2, sm: 3 },
                    px: { xs: 2, sm: 4 },
                    boxShadow: `0 4px 20px ${alpha(color, 0.3)}`,
                  }}
                >
                  <Container maxWidth="xl">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: { xs: 44, sm: 52 },
                            height: { xs: 44, sm: 52 },
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.2)",
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          {icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                              color: "white",
                              fontSize: { xs: "1.1rem", sm: "1.4rem" },
                              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            {emoji} {getMediaLabel(type)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255,255,255,0.85)",
                              fontSize: { xs: "0.8rem", sm: "0.9rem" },
                            }}
                          >
                            {sectionTitle} • {items.length} {items.length === 1 ? 'item' : 'itens'}
                          </Typography>
                        </Box>
                      </Box>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <IconButton
                          onClick={onToggle}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.2)",
                            color: "white",
                            backdropFilter: "blur(10px)",
                            "&:hover": {
                              bgcolor: "rgba(255,255,255,0.3)",
                            },
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </motion.div>
                    </Box>
                  </Container>
                </Box>

                {/* Conteúdo */}
                <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 4 } }}>
                  <Grid container spacing={3}>
                    {items.map((item, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={item.id || index}>
                        <motion.div
                          initial={{ opacity: 0, y: 30, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          whileHover={{ y: -8, scale: 1.02 }}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              borderRadius: 4,
                              overflow: "hidden",
                              boxShadow: 4,
                              border: "2px solid",
                              borderColor: alpha(color, 0.3),
                              transition: "all 0.3s ease",
                              bgcolor: "background.paper",
                              "&:hover": {
                                boxShadow: `0 12px 40px ${alpha(color, 0.3)}`,
                                borderColor: color,
                              },
                            }}
                          >
                            {type === "videos" && <IdeasVideoPlayerView video={item} />}
                            {type === "documents" && <IdeasDocumentViewer document={item} />}
                            {type === "images" && <IdeasImageGalleryView image={item} />}
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </Container>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Modal>
    </>
  );
}

interface SectionUser {
  name: string;
  email: string;
  phone?: string;
}

interface MediaSectionProps {
  sectionId: string;
  sectionIndex: number;
  title: string;
  description: string;
  videos: any[];
  documents: any[];
  images: any[];
  expandedMediaTypes: { [key: string]: boolean };
  onToggleMediaType: (sectionId: string, mediaType: string) => void;
  user?: SectionUser;
  isExpanded: boolean;
  onToggleSection: (sectionId: string) => void;
}

export default function MediaSection({
  sectionId,
  sectionIndex,
  title,
  description,
  videos,
  documents,
  images,
  expandedMediaTypes,
  onToggleMediaType,
  user,
  isExpanded,
  onToggleSection,
}: MediaSectionProps) {
  const theme = useTheme();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [expandDirection, setExpandDirection] = useState<"down" | "up">("down");
  const cardRef = useRef<HTMLDivElement>(null);

  // Cor da seção baseada no índice
  const sectionColor = sectionColors[sectionIndex % sectionColors.length];

  // Calcular direção de expansão quando expandir
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      const expandedHeight = 400; // altura estimada do conteúdo expandido
      
      // Se não tem espaço suficiente abaixo mas tem acima, expande para cima
      if (spaceBelow < expandedHeight && spaceAbove > spaceBelow) {
        setExpandDirection("up");
      } else {
        setExpandDirection("down");
      }
    }
  }, [isExpanded]);

  // Pegar primeiro e último nome
  const getDisplayName = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  // Iniciais do usuário
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  // Total de itens
  const totalItems = videos.length + documents.length + images.length;

  return (
    <Box sx={{ position: "relative", zIndex: isExpanded ? 1000 : 1 }}>
      {/* Card da seção */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
      >
        <Card
          ref={cardRef}
          sx={{
            borderRadius: isExpanded 
              ? expandDirection === "down" 
                ? { xs: "12px 12px 0 0", sm: "16px 16px 0 0" }
                : { xs: "0 0 12px 12px", sm: "0 0 16px 16px" }
              : { xs: 3, sm: 4 },
            boxShadow: isExpanded ? 8 : 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: isExpanded ? sectionColor.primary : alpha(sectionColor.primary, 0.2),
            transition: "all 0.3s ease",
            cursor: "pointer",
            "&:hover": {
              boxShadow: `0 12px 40px ${alpha(sectionColor.primary, 0.2)}`,
              borderColor: alpha(sectionColor.primary, 0.5),
            },
          }}
          onClick={() => onToggleSection(sectionId)}
        >
          {/* Header colorido da seção */}
          <Box
            sx={{
              background: `linear-gradient(${sectionColor.gradient})`,
              p: { xs: 2, sm: 2.5 },
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, width: { xs: "100%", sm: "auto" } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: { xs: 40, sm: 52 },
                      height: { xs: 40, sm: 52 },
                      borderRadius: { xs: 2, sm: 3 },
                      bgcolor: "rgba(255,255,255,0.25)",
                      backdropFilter: "blur(10px)",
                      flexShrink: 0,
                    }}
                  >
                    <FolderSpecialIcon sx={{ fontSize: { xs: 22, sm: 28 }, color: "white" }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.2rem" },
                        color: "white",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {title}
                    </Typography>
                    {description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.85)",
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        {description}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: { xs: 0.75, sm: 1 },
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "space-between", sm: "flex-end" },
                  }}
                >
                  {/* Indicador de quem compartilhou - clicável para ver mais info */}
                  {user && (
                    <Tooltip title="Saiba mais" arrow placement="top">
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserModalOpen(true);
                        }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          bgcolor: "rgba(0,0,0,0.2)",
                          borderRadius: 2,
                          px: { xs: 1, sm: 1.5 },
                          py: 0.5,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: "rgba(0,0,0,0.35)",
                            transform: "scale(1.02)",
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.95)",
                            fontSize: { xs: "0.6rem", sm: "0.7rem" },
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Compartilhado por {getDisplayName(user.name)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                  <Chip
                    label={`${totalItems}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.25)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "0.75rem", sm: "0.8rem" },
                      minWidth: { xs: 28, sm: 32 },
                      height: { xs: 26, sm: 28 },
                    }}
                  />
                  <Tooltip title={isExpanded ? "Fechar" : "Expandir"} arrow placement="top">
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: isExpanded ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)",
                        color: "white",
                        p: { xs: 0.5, sm: 0.75 },
                        transition: "all 0.3s ease",
                        "&:hover": { 
                          bgcolor: "rgba(255,255,255,0.4)",
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 0 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {isExpanded ? (
                          <CloseIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                        ) : (
                          <ExpandMoreIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                        )}
                      </motion.div>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      </motion.div>

      {/* Conteúdo expandido - expande para cima ou para baixo */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: expandDirection === "down" ? -10 : 10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: expandDirection === "down" ? -10 : 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              zIndex: 9999,
              ...(expandDirection === "down" ? { top: "100%" } : { bottom: "100%" }),
            }}
          >
            <Card
              sx={{
                borderRadius: expandDirection === "down" 
                  ? { xs: "0 0 12px 12px", sm: "0 0 16px 16px" }
                  : { xs: "12px 12px 0 0", sm: "16px 16px 0 0" },
                boxShadow: `0 ${expandDirection === "down" ? "12px" : "-12px"} 40px ${alpha(sectionColor.primary, 0.25)}`,
                border: "1px solid",
                borderColor: sectionColor.primary,
                ...(expandDirection === "down" 
                  ? { borderTop: "none" } 
                  : { borderBottom: "none" }),
                bgcolor: "background.paper",
                maxHeight: { xs: "60vh", sm: "55vh", md: "50vh" },
                overflow: "auto",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header com botão fechar */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                  <Tooltip title="Fechar" arrow placement="left">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSection(sectionId);
                      }}
                      size="small"
                      sx={{
                        bgcolor: alpha(sectionColor.primary, 0.1),
                        color: sectionColor.primary,
                        "&:hover": {
                          bgcolor: alpha(sectionColor.primary, 0.2),
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <MediaTypeCard
                  type="videos"
                  icon={<VideoLibraryIcon sx={{ color: "white" }} />}
                  items={videos}
                  color={getMediaColor("videos", theme)}
                  emoji={getMediaEmoji("videos")}
                  isExpanded={!!expandedMediaTypes[`${sectionId}-videos`]}
                  onToggle={() => onToggleMediaType(sectionId, "videos")}
                  accentColor={sectionColor.primary}
                  sectionTitle={title}
                />
                <MediaTypeCard
                  type="documents"
                  icon={<PictureAsPdfIcon sx={{ color: "white" }} />}
                  items={documents}
                  color={getMediaColor("documents", theme)}
                  emoji={getMediaEmoji("documents")}
                  isExpanded={!!expandedMediaTypes[`${sectionId}-documents`]}
                  onToggle={() => onToggleMediaType(sectionId, "documents")}
                  accentColor={sectionColor.primary}
                  sectionTitle={title}
                />
                <MediaTypeCard
                  type="images"
                  icon={<ImageIcon sx={{ color: "white" }} />}
                  items={images}
                  color={getMediaColor("images", theme)}
                  emoji={getMediaEmoji("images")}
                  isExpanded={!!expandedMediaTypes[`${sectionId}-images`]}
                  onToggle={() => onToggleMediaType(sectionId, "images")}
                  accentColor={sectionColor.primary}
                  sectionTitle={title}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop quando expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onToggleSection(sectionId)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              backdropFilter: "blur(4px)",
              zIndex: 999,
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal de informações do usuário */}
      {user && (
        <UserInfoModal
          open={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          user={user}
        />
      )}
    </Box>
  );
}
