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

import type { ShelterDto } from "../types";
import { EmptyState } from "./common/EmptyState";
import { useDebounced } from "../utils";

interface SheltersPanelProps {
    shelters: ShelterDto[];
    loading: boolean;
    error: string | null;
    onShelterSelect: (shelter: ShelterDto) => void;
    selectedShelter: ShelterDto | null;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSearchChange?: (searchString: string) => void;
}

export function SheltersPanel({
    shelters,
    loading,
    error,
    onShelterSelect,
    selectedShelter,
    currentPage,
    totalPages,
    onPageChange,
    onSearchChange,
}: SheltersPanelProps) {
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
                        mb: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        display: { xs: 'none', sm: 'block' } // Esconde no mobile
                    }}
                >
                    Abrigos
                </Typography>
                
            <TextField
                    fullWidth
                size="small"
                    label="Buscar abrigos"
                    placeholder="Buscar abrigos..."
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
                ) : shelters.length === 0 ? (
                    <EmptyState
                        icon={<SearchIcon />}
                        title="Nenhum abrigo encontrado"
                        description={search ? "Tente ajustar os filtros de busca" : "Não há abrigos cadastrados"}
                    />
                ) : (
                    <Stack spacing={{ xs: 1, sm: 1.5 }}>
                        {shelters.map((shelter) => (
                                <Card
                                key={shelter.id}
                                    sx={{
                                    border: selectedShelter?.id === shelter.id 
                                        ? "2px solid" 
                                        : "1px solid",
                                    borderColor: selectedShelter?.id === shelter.id 
                                        ? "primary.main" 
                                        : "divider",
                                    bgcolor: selectedShelter?.id === shelter.id 
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
                                <CardActionArea onClick={() => onShelterSelect(shelter)}>
                                    <Box sx={{ p: { xs: 2, sm: 2 }, minHeight: { xs: 120, sm: 110 } }}>
                                        <Stack spacing={1}>
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
                                                    {shelter.name.charAt(0).toUpperCase()}
                                                    </Typography>
                                            </Avatar>
                                            
                                                <Typography
                                                    variant="caption"
                                                    color="primary.main"
                                                    fontWeight="600"
                                                    sx={{
                                                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                                        textAlign: 'right'
                                                    }}
                                                >
                                                    {shelter.members.length} membros
                                                </Typography>
                                            </Stack>

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
                                                {shelter.name}
                                                </Typography>

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
                                                    {shelter.address.city}, {shelter.address.state}
                                                </Typography>
                                                
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {shelter.address.district}
                                            </Typography>

                                            {shelter.leaders && shelter.leaders.length > 0 && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                                        lineHeight: 1.3,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    Líderes: {shelter.leaders.map(leader => leader.user.name).join(', ')}
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