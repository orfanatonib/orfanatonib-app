import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
} from '@mui/material';
import { Clear, Refresh, Search } from '@mui/icons-material';
import { ADMIN_LABELS, ADMIN_TOUCH_TARGET_PX } from './constants';
import type { AdminSearchBarProps } from './types';

const TARGET_SX = { width: ADMIN_TOUCH_TARGET_PX, height: ADMIN_TOUCH_TARGET_PX } as const;

/** Busca padrão das listagens, com botão de recarregar opcional. */
export default function AdminSearchBar({
  value,
  onChange,
  testId,
  clearTestId,
  refreshTestId,
  rootTestId,
  label = ADMIN_LABELS.SEARCH_DEFAULT_LABEL,
  placeholder = ADMIN_LABELS.SEARCH_DEFAULT_PLACEHOLDER,
  ariaLabel,
  onRefresh,
  loading = false,
}: AdminSearchBarProps) {
  const hasQuery = Boolean(value);

  return (
    <Paper
      data-testid={rootTestId}
      elevation={2}
      sx={{ p: { xs: 1.5, md: 3 }, mb: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputProps={{ 'data-testid': testId, 'aria-label': ariaLabel ?? label }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} /> : null}
                {hasQuery ? (
                  <Tooltip title={ADMIN_LABELS.CLEAR_SEARCH}>
                    <IconButton
                      aria-label={ADMIN_LABELS.CLEAR_SEARCH}
                      data-testid={clearTestId}
                      onClick={() => onChange('')}
                      sx={TARGET_SX}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
            },
          }}
        />
        {onRefresh ? (
          <Tooltip title={ADMIN_LABELS.REFRESH}>
            <IconButton
              aria-label={ADMIN_LABELS.REFRESH}
              data-testid={refreshTestId}
              onClick={onRefresh}
              sx={{ ...TARGET_SX, flexShrink: 0 }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    </Paper>
  );
}
