import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Clear, FilterList, FilterListOff, Refresh, Search } from '@mui/icons-material';
import {
  ADMIN_FILTER_MIN_PX,
  ADMIN_LABELS,
  ADMIN_SEARCH_DEBOUNCE_MS,
  ADMIN_SORT_FILTER_KEY,
  ADMIN_TOOLBAR_LABELS,
  ADMIN_TOUCH_TARGET_PX,
} from './constants';
import AdminDateField from './AdminDateField';
import type { AdminFilterField, AdminListToolbarProps } from './types';

const TARGET_SX = { width: ADMIN_TOUCH_TARGET_PX, height: ADMIN_TOUCH_TARGET_PX } as const;
const FIELD_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } } as const;

/** Texto livre do filtro: digita local e só propaga ao servidor depois do debounce. */
function TextFilterControl({
  field,
  value,
  testId,
  onChange,
}: {
  field: Extract<AdminFilterField, { kind: 'text' }>;
  value: string;
  testId: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onChange(draft), ADMIN_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `onChange` muda de identidade a cada render do pai; o debounce só reage ao rascunho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value]);

  return (
    <TextField
      fullWidth
      size="small"
      label={field.label}
      placeholder={field.placeholder}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      InputLabelProps={{ shrink: true }}
      inputProps={{ 'data-testid': testId, 'aria-label': field.label }}
      sx={FIELD_SX}
    />
  );
}

function FilterControl({
  field,
  value,
  testId,
  onChange,
  minDate,
  maxDate,
}: {
  field: AdminFilterField;
  value: string;
  testId: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  if (field.kind === 'text') {
    return <TextFilterControl field={field} value={value} testId={testId} onChange={onChange} />;
  }

  if (field.kind === 'date') {
    return (
      <AdminDateField
        label={field.label}
        value={value}
        onChange={onChange}
        testId={testId}
        minDate={minDate}
        maxDate={maxDate}
      />
    );
  }

  const showAll = field.allLabel !== null;
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={field.label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      SelectProps={{ displayEmpty: false, MenuProps: { disableScrollLock: true } }}
      inputProps={{ 'data-testid': testId, 'aria-label': field.label }}
      InputLabelProps={{ shrink: true }}
      sx={FIELD_SX}
    >
      {showAll ? (
        <MenuItem value="" data-testid={`${testId}-option-all`}>
          {field.allLabel ?? 'Todos'}
        </MenuItem>
      ) : null}
      {field.options.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          data-testid={`${testId}-option-${option.value}`}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** "Até" nunca antes de "a partir de": cada ponta limita a outra (chaves `*From`/`*To`). */
function dateBounds(key: string, filters: Record<string, string>): { minDate?: string; maxDate?: string } {
  if (key.endsWith('From')) return { maxDate: filters[`${key.slice(0, -4)}To`] || undefined };
  if (key.endsWith('To')) return { minDate: filters[`${key.slice(0, -2)}From`] || undefined };
  return {};
}

/**
 * Toolbar única das listagens administrativas: busca + atualizar + ação principal na primeira
 * linha, filtros do servidor na segunda. Nenhum controle some ou aparece (só fica desabilitado),
 * então a altura da toolbar nunca muda. No celular os filtros ficam atrás do botão "Filtros".
 */
export default function AdminListToolbar({
  testIdPrefix,
  searchLabel,
  searchPlaceholder = ADMIN_LABELS.SEARCH_DEFAULT_PLACEHOLDER,
  search,
  onSearchChange,
  fields,
  filters,
  onFilterChange,
  onClearAll,
  onRefresh,
  fetching,
  activeFilterCount,
  primaryAction,
}: AdminListToolbarProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  /** Muda a cada "Limpar filtros": remonta os campos de texto e descarta rascunho ainda em debounce. */
  const [clearVersion, setClearVersion] = useState(0);
  const root = `${testIdPrefix}-toolbar`;
  const hasQuery = Boolean(search);
  const filterCount = fields.filter((field) => field.key !== ADMIN_SORT_FILTER_KEY).length;
  const showFields = !isXs || open;

  return (
    <Paper
      data-testid={root}
      elevation={2}
      sx={{ p: { xs: 1.5, md: 2.5 }, mb: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <TextField
          fullWidth
          size="small"
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          inputProps={{ 'data-testid': `${root}-search`, 'aria-label': searchLabel }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ width: 20, height: 20, mr: 0.5, display: 'flex' }}>
                  {fetching ? <CircularProgress size={20} /> : null}
                </Box>
                <Tooltip title={ADMIN_LABELS.CLEAR_SEARCH}>
                  <span>
                    <IconButton
                      aria-label={ADMIN_LABELS.CLEAR_SEARCH}
                      data-testid={`${root}-clear`}
                      disabled={!hasQuery}
                      onClick={() => onSearchChange('')}
                      size="small"
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={FIELD_SX}
        />
        <Tooltip title={ADMIN_LABELS.REFRESH}>
          <IconButton
            aria-label={ADMIN_LABELS.REFRESH}
            data-testid={`${root}-refresh`}
            onClick={onRefresh}
            sx={{ ...TARGET_SX, flexShrink: 0 }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
        {primaryAction ? <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>{primaryAction}</Box> : null}
      </Box>

      {fields.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          {isXs && filterCount > 0 ? (
            <Button
              data-testid={`${root}-toggle-filters`}
              onClick={() => setOpen((current) => !current)}
              startIcon={
                <Badge color="primary" badgeContent={activeFilterCount} invisible={activeFilterCount === 0}>
                  <FilterList />
                </Badge>
              }
              sx={{ minHeight: ADMIN_TOUCH_TARGET_PX, textTransform: 'none', mb: open ? 1 : 0 }}
              fullWidth
              variant="outlined"
            >
              {ADMIN_TOOLBAR_LABELS.FILTERS}
            </Button>
          ) : null}
          <Collapse in={showFields} unmountOnExit={false}>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                alignItems: 'center',
                // Pela largura do conteúdo (o menu lateral come espaço): os filtros quebram de linha sozinhos.
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: `repeat(auto-fit, minmax(min(100%, ${ADMIN_FILTER_MIN_PX}px), 1fr))`,
                },
              }}
            >
              {fields.map((field) => (
                <FilterControl
                  key={`${field.key}-${clearVersion}`}
                  field={field}
                  value={filters[field.key] ?? ''}
                  testId={`${testIdPrefix}-filter-${field.key}`}
                  onChange={(value) => onFilterChange(field.key, value)}
                  {...dateBounds(field.key, filters)}
                />
              ))}
              <Button
                data-testid={`${root}-clear-filters`}
                onClick={() => {
                  setClearVersion((version) => version + 1);
                  onClearAll();
                }}
                disabled={activeFilterCount === 0}
                startIcon={<FilterListOff />}
                sx={{ minHeight: ADMIN_TOUCH_TARGET_PX, textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                {ADMIN_TOOLBAR_LABELS.CLEAR_FILTERS}
              </Button>
            </Box>
          </Collapse>
        </Box>
      ) : null}
    </Paper>
  );
}
