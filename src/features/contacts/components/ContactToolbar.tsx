import React from "react";
import {
  Box,
  IconButton,
  TextField,
  Tooltip,
  Paper,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Refresh, Search, Clear } from "@mui/icons-material";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  loading?: boolean;
};

export default function ContactToolbar({ search, onSearchChange, onRefresh, loading }: Props) {
  const hasQuery = Boolean(search);

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 4,
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <TextField
          fullWidth
          label="Buscar contatos"
          placeholder="Buscar por nome, email, telefone ou mensagem..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && (
                  <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} />
                )}
                {hasQuery && (
                  <Tooltip title="Limpar busca">
                    <IconButton
                      size="small"
                      onClick={() => onSearchChange("")}
                      sx={{
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
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
        <Tooltip title="Recarregar contatos">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            sx={{
              borderRadius: 2,
              bgcolor: "action.hover",
              "&:hover": {
                bgcolor: "action.selected",
                transform: "rotate(180deg)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}
