import React, { useState, useEffect, useCallback } from "react";
import {
  Box, 
  Stack, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Skeleton, 
  Alert,
  Card, 
  CardActionArea, 
  Avatar, 
  Typography, 
  Chip,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import type { ShelteredDto } from "../types";
import { EmptyState } from "./common/EmptyState";
import { fmtDate, formatPhone, useDebounced } from "../utils";

function initialsFromName(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return (first + last).toUpperCase();
}

interface ShelteredPanelProps {
  sheltered: ShelteredDto[];
  loading: boolean;
  error: string | null;
  onShelteredSelect: (sheltered: ShelteredDto) => void;
  selectedSheltered: ShelteredDto | null;
  shelterName: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearchChange?: (searchString: string) => void;
}

export function ShelteredPanel({
  sheltered,
  loading,
  error,
  onShelteredSelect,
  selectedSheltered,
  shelterName,
  currentPage,
  totalPages,
  onPageChange,
  onSearchChange,
}: ShelteredPanelProps) {
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
          Abrigados
        </Typography>
        {shelterName && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Abrigo: {shelterName}
          </Typography>
        )}
        
      <TextField
          fullWidth
        size="small"
          label="Buscar abrigados"
          placeholder="Buscar abrigados..."
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
        ) : sheltered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title="Nenhum abrigado encontrado"
            description={search ? "Tente ajustar os filtros de busca" : "Não há abrigados cadastrados neste abrigo"}
          />
        ) : (
          <Stack spacing={{ xs: 1.5, sm: 1.5 }}>
            {sheltered.map((sheltered) => (
              <Card
                key={sheltered.id}
                sx={{
                  border: selectedSheltered?.id === sheltered.id 
                    ? "2px solid" 
                    : "1px solid",
                  borderColor: selectedSheltered?.id === sheltered.id 
                    ? "primary.main" 
                    : "divider",
                  bgcolor: selectedSheltered?.id === sheltered.id 
                    ? "rgba(25, 118, 210, 0.08)" 
                    : "background.paper",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: { xs: "none", sm: "translateY(-4px)" },
                    boxShadow: { xs: 2, sm: 4 },
                  },
                }}
              >
                <CardActionArea onClick={() => onShelteredSelect(sheltered)}>
                  <Box sx={{ p: { xs: 2, sm: 2 }, minHeight: { xs: 100, sm: 90 } }}>
                    <Stack spacing={1}>
                      {/* Primeira linha: Iniciais (esquerda) + Nome do abrigo (direita) */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                            width: { xs: 32, sm: 36 },
                            height: { xs: 32, sm: 36 },
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            color="white" 
                            fontWeight="bold"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                          {initialsFromName(sheltered.name)}
                        </Typography>
                      </Avatar>
                      
                        <Typography
                          variant="caption"
                          color="primary.main"
                          fontWeight="600"
                          sx={{
                            fontSize: { xs: '0.625rem', sm: '0.75rem' },
                            textAlign: 'right',
                            maxWidth: '60%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sheltered.shelter.name}
                        </Typography>
                      </Stack>

                      {/* Segunda linha: Nome do abrigado */}
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {sheltered.name}
                        </Typography>
                        
                      {/* Terceira linha: Responsável */}
                      {sheltered.guardianName && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sheltered.guardianName}
                        </Typography>
                      )}
                        
                      {/* Quarta linha: Número do responsável */}
                      {sheltered.guardianPhone && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.625rem', sm: '0.75rem' },
                            lineHeight: 1.3,
                            wordBreak: 'break-all'
                          }}
                        >
                            {formatPhone(sheltered.guardianPhone)}
                          </Typography>
                        )}
                    </Stack>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
                    </Stack>
                )}
            </Box>
            
            {/* Paginação no rodapé */}
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