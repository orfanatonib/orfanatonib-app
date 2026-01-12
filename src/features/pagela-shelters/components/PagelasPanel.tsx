import React, { useState, useEffect, useCallback } from "react";
import {
  Box, 
  Stack, 
  Typography, 
  Chip, 
  Skeleton, 
  Alert, 
  Card, 
  CardContent, 
  Avatar,
  Divider,
  Pagination,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import type { PagelaDto } from "../types";
import { EmptyState } from "./common/EmptyState";
import { fmtDate, useDebounced } from "../utils";

interface PagelasPanelProps {
  pagelas: PagelaDto[];
  loading: boolean;
  error: string | null;
  shelteredName: string;
  shelterName: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearchChange?: (searchString: string) => void;
}

export function PagelasPanel({
  pagelas,
  loading,
  error,
  shelteredName,
  shelterName,
  currentPage,
  totalPages,
  onPageChange,
  onSearchChange,
}: PagelasPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [search, setSearch] = useState("");
  const dq = useDebounced(search);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(dq);
    }
  }, [dq]);

  const handleSearchClear = useCallback(() => {
    setSearch("");
  }, []);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderRadius: { xs: 3, sm: 4 },
        boxShadow: { xs: 1, sm: "0 4px 20px rgba(0, 0, 0, 0.1)" },
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          color="text.primary" 
          sx={{ 
            mb: { xs: 1, sm: 1.5 },
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            display: { xs: 'none', sm: 'block' } // Esconde no mobile
          }}
        >
          Pagelas
        </Typography>
        {shelteredName && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Abrigado: {shelteredName}
          </Typography>
        )}
        {shelterName && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Abrigo: {shelterName}
          </Typography>
        )}
        
        <TextField
          fullWidth
          size="small"
          label="Buscar pagelas"
          placeholder="Buscar pagelas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearchClear}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              "&:hover": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              },
              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 2,
                },
              },
            },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: { xs: 1.5, sm: 2 } }}>
        {loading ? (
          <Stack spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : pagelas.length === 0 ? (
          <EmptyState
            icon={<BookmarksIcon />}
            title="Nenhuma pagela encontrada"
            description={search ? "Tente ajustar os filtros de busca" : "Não há registros de pagelas para este abrigado"}
          />
        ) : (
        <Stack spacing={{ xs: 1, sm: 1.5 }}>
            {pagelas.map((pagela) => (
            <Card
                key={pagela.id}
              sx={{
                  border: "1px solid",
                  borderColor: pagela.present 
                    ? "rgba(76, 175, 80, 0.3)" 
                    : "rgba(211, 47, 47, 0.3)",
                  bgcolor: pagela.present 
                    ? "rgba(76, 175, 80, 0.08)" 
                    : "rgba(211, 47, 47, 0.08)",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    borderColor: pagela.present 
                      ? "rgba(76, 175, 80, 0.5)" 
                      : "rgba(211, 47, 47, 0.5)",
                    transform: { xs: "none", sm: "translateY(-4px)" },
                    boxShadow: { xs: 2, sm: 4 },
                  },
                  "@media (hover: none)": {
                    "&:hover": {
                      bgcolor: pagela.present 
                        ? "rgba(76, 175, 80, 0.08)" 
                        : "rgba(211, 47, 47, 0.08)",
                    },
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: pagela.present ? "success.main" : "error.main",
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                      }}
                    >
                      {pagela.present ? (
                        <CheckCircleIcon sx={{ color: "white", fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      ) : (
                        <CancelIcon sx={{ color: "white", fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      )}
                      </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="text.primary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Ano {pagela.year} - Visita {pagela.visit}
                      </Typography>
                      <Chip
                          label={pagela.present ? "Presente" : "Ausente"}
                        size="small"
                          color={pagela.present ? "success" : "error"}
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: '0.625rem', sm: '0.75rem' },
                            height: { xs: 20, sm: 24 }
                          }}
                      />
                    </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ 
                          mb: 0.5,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Data: {fmtDate(pagela.referenceDate)}
                        </Typography>
                      
                      {pagela.notes && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: { xs: '0.625rem', sm: '0.75rem' }
                          }}
                        >
                          {pagela.notes}
                        </Typography>
                      )}
                      {pagela.member?.user?.name && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.625rem', sm: '0.75rem' },
                            fontStyle: 'italic'
                          }}
                        >
                          Membro: {pagela.member.user.name}
                        </Typography>
                      )}
                      </Box>
                  </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
                )}
      </Box>

            {totalPages > 1 && (
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderTop: "1px solid", borderColor: "divider" }}>
        <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(_, page) => onPageChange(page)}
                        color="primary"
          size="small"
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                        }}
                    />
                </Box>
            )}
        </Card>
  );
}