import React from "react";
import {
  Box,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, Clear } from "@mui/icons-material";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  status: "all" | "published" | "unpublished";
  setStatus: (s: "all" | "published" | "unpublished") => void;
  isFiltering: boolean;
};

export default function CommentsToolbar({ search, onSearchChange, status, setStatus, isFiltering }: Props) {
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
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          fullWidth
          label="Buscar comentários"
          placeholder="Buscar por nome, abrigo ou bairro..."
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
                {isFiltering && (
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
        <FormControl
          sx={{
            minWidth: { xs: "100%", sm: 180 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          size="small"
        >
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="published">Publicado</MenuItem>
            <MenuItem value="unpublished">Não Publicado</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
