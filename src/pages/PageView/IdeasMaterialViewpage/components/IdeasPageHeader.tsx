import React from "react";
import { Box, Typography, Container, IconButton, Chip, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

interface IdeasPageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function IdeasPageHeader({
  title,
  subtitle,
  description,
  isAdmin,
  onBack,
  onEdit,
  onDelete,
}: IdeasPageHeaderProps) {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.light, 0.08)} 50%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.warning.main, 0.2),
          py: { xs: 3, sm: 4, md: 5 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.15)} 0%, transparent 70%)`,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, mb: { xs: 3, sm: 4 } }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={onBack}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  "&:hover": {
                    bgcolor: "background.paper",
                    boxShadow: 5,
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </motion.div>
            {isAdmin && (
              <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <IconButton
                    onClick={onEdit}
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.15),
                      color: "warning.dark",
                      boxShadow: 2,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.warning.main, 0.25),
                        boxShadow: 4,
                      },
                      transition: "all 0.2s ease",
                    }}
                    aria-label="Editar página"
                  >
                    <EditIcon />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <IconButton
                    onClick={onDelete}
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.15),
                      color: "error.main",
                      boxShadow: 2,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.error.main, 0.25),
                        boxShadow: 4,
                      },
                      transition: "all 0.2s ease",
                    }}
                    aria-label="Excluir página"
                  >
                    <DeleteIcon />
                  </IconButton>
                </motion.div>
              </Box>
            )}
          </Box>

          <Box textAlign="center">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              style={{ display: "inline-block", marginBottom: 16 }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: { xs: 60, sm: 80 },
                  height: { xs: 60, sm: 80 },
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.warning.main, 0.4)}`,
                }}
              >
                <LightbulbIcon sx={{ fontSize: { xs: 32, sm: 44 }, color: "white" }} />
              </Box>
            </motion.div>

            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                mb: { xs: 1.5, sm: 2 },
                lineHeight: 1.2,
                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.warning.dark} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                  label={subtitle}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                    color: "warning.dark",
                    fontWeight: 600,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    height: { xs: 32, sm: 36 },
                    px: 1,
                    mb: { xs: 2, sm: 2.5 },
                    "& .MuiChip-icon": {
                      color: theme.palette.warning.main,
                    },
                  }}
                />
              </motion.div>
            )}

            {description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Typography
                  variant="body1"
                  maxWidth={{ xs: "100%", md: "700px" }}
                  mx="auto"
                  sx={{
                    fontSize: { xs: "0.925rem", sm: "1.1rem" },
                    lineHeight: 1.7,
                    color: "text.secondary",
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                    p: { xs: 2, sm: 2.5 },
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.5),
                  }}
                >
                  {description}
                </Typography>
              </motion.div>
            )}
          </Box>
        </Container>
      </Box>
    </motion.div>
  );
}
