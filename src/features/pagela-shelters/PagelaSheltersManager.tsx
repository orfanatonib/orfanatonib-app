import { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumbs,
  CircularProgress,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { Bookmarks, ChevronRight, ChildCare, Home } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import { apiGetMyShelters } from '@/features/leaders/api';
import { AdminEmptyState, AdminPageShell } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';

import PagelaLevelList from './components/PagelaLevelList';
import { PagelaRecordCard, ShelteredLevelCard, ShelterLevelCard } from './components/PagelaLevelCards';
import { fetchPagelasLevel, fetchShelteredLevel, fetchSheltersLevel } from './api';
import {
  GENDER_OPTIONS,
  PAGELAS_DEFAULT_SORT,
  PAGELAS_LABELS,
  PAGELAS_TEST_ID_PREFIX,
  PAGELAS_TITLE,
  PAGELA_FILTER_KEYS,
  PAGELA_SORT_OPTIONS,
  PRESENT_OPTIONS,
  SHELTERED_DEFAULT_SORT,
  SHELTERED_SORT_OPTIONS,
  SHELTERS_DEFAULT_SORT,
  SHELTER_SORT_OPTIONS,
  type PagelaLevel,
} from './constants';
import type { PagelaDto, ShelteredDto, ShelterDto } from './types';

const P = PAGELAS_TEST_ID_PREFIX;
const K = PAGELA_FILTER_KEYS;

const sortField = (options: ReadonlyArray<{ value: string; label: string }>): AdminFilterField => ({
  kind: 'select',
  key: K.SORT,
  label: PAGELAS_LABELS.FILTER_SORT,
  allLabel: null,
  options: options.map((option) => ({ value: option.value, label: option.label })),
});

const SHELTER_FIELDS: AdminFilterField[] = [
  { kind: 'text', key: K.CITY, label: PAGELAS_LABELS.FILTER_CITY },
  { kind: 'text', key: K.STATE, label: PAGELAS_LABELS.FILTER_STATE },
  { kind: 'date', key: K.CREATED_FROM, label: PAGELAS_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: PAGELAS_LABELS.FILTER_CREATED_TO },
  sortField(SHELTER_SORT_OPTIONS),
];

const SHELTERED_FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.GENDER,
    label: PAGELAS_LABELS.FILTER_GENDER,
    allLabel: PAGELAS_LABELS.FILTER_GENDER_ALL,
    options: GENDER_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  { kind: 'date', key: K.JOINED_FROM, label: PAGELAS_LABELS.FILTER_JOINED_FROM },
  { kind: 'date', key: K.JOINED_TO, label: PAGELAS_LABELS.FILTER_JOINED_TO },
  sortField(SHELTERED_SORT_OPTIONS),
];

const PAGELA_FIELDS: AdminFilterField[] = [
  { kind: 'text', key: K.YEAR, label: PAGELAS_LABELS.FILTER_YEAR },
  {
    kind: 'select',
    key: K.PRESENT,
    label: PAGELAS_LABELS.FILTER_PRESENT,
    allLabel: PAGELAS_LABELS.FILTER_PRESENT_ALL,
    options: PRESENT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  { kind: 'date', key: K.REFERENCE_FROM, label: PAGELAS_LABELS.FILTER_REFERENCE_FROM },
  { kind: 'date', key: K.REFERENCE_TO, label: PAGELAS_LABELS.FILTER_REFERENCE_TO },
  sortField(PAGELA_SORT_OPTIONS),
];

interface Pick {
  id: string;
  name: string;
}

/**
 * Pagelas: fluxo em três níveis (abrigos → acolhidos do abrigo → pagelas do acolhido), cada nível uma lista do servidor.
 * O líder começa no nível dos acolhidos, nos abrigos que lidera. O fluxo e a trilha (breadcrumbs) são só desta tela;
 * a casca em volta (título, largura 95%/98%, toolbar, conteúdo estável e paginação) é a mesma das demais telas.
 */
export default function PagelaSheltersManager() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLeader = user?.role === UserRole.LEADER && Boolean(user?.leaderProfile);

  const [leaderShelters, setLeaderShelters] = useState<Pick[]>([]);
  const [loadingShelters, setLoadingShelters] = useState(isLeader);
  const [shelter, setShelter] = useState<Pick | null>(null);
  const [sheltered, setSheltered] = useState<Pick | null>(null);

  useEffect(() => {
    if (!isLeader) return undefined;
    let canceled = false;
    (async () => {
      try {
        const mine = await apiGetMyShelters();
        if (canceled) return;
        const options = mine.map((item) => ({ id: item.id, name: item.name }));
        setLeaderShelters(options);
        setShelter(options[0] ?? null);
      } catch {
        if (!canceled) setLeaderShelters([]);
      } finally {
        if (!canceled) setLoadingShelters(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [isLeader]);

  const level: PagelaLevel = !shelter ? 'shelters' : !sheltered ? 'sheltered' : 'pagelas';

  const fetchSheltered = useMemo(() => (shelter ? fetchShelteredLevel(shelter.id) : null), [shelter]);
  const fetchPagelas = useMemo(() => (sheltered ? fetchPagelasLevel(sheltered.id) : null), [sheltered]);

  const handleBack = () => {
    if (level === 'pagelas') setSheltered(null);
    else if (level === 'sheltered' && !isLeader) setShelter(null);
    else window.history.back();
  };

  const goToShelters = () => {
    if (isLeader) return;
    setShelter(null);
    setSheltered(null);
  };

  const handleLeaderShelterChange = (id: string) => {
    setShelter(leaderShelters.find((item) => item.id === id) ?? null);
    setSheltered(null);
  };

  const crumbSx = (active: boolean) => ({
    color: active ? 'text.primary' : 'primary.main',
    fontWeight: active ? 400 : 600,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  });

  const breadcrumb = (
    <Paper
      data-testid={`${P}-breadcrumb`}
      elevation={2}
      sx={{ mb: { xs: 2, md: 3 }, borderRadius: 3, px: { xs: 2, md: 3 }, py: 1.5, minHeight: 56, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
    >
      <Breadcrumbs separator={<ChevronRight fontSize="small" />} sx={{ flex: 1, minWidth: 0 }}>
        {!isLeader && (
          <MuiLink data-testid={`${P}-crumb-shelters`} component="button" onClick={goToShelters} sx={crumbSx(level === 'shelters')}>
            {PAGELAS_LABELS.LEVEL_SHELTERS}
          </MuiLink>
        )}
        {shelter && (
          <MuiLink data-testid={`${P}-crumb-shelter`} component="button" onClick={() => setSheltered(null)} sx={crumbSx(level === 'sheltered')}>
            {shelter.name}
          </MuiLink>
        )}
        {sheltered && (
          <Typography data-testid={`${P}-crumb-sheltered`} color="text.primary" fontWeight={600}>
            {sheltered.name}
          </Typography>
        )}
      </Breadcrumbs>
      {isLeader && leaderShelters.length > 1 && (
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="pagelas-shelter-select-label">{PAGELAS_LABELS.SELECT_SHELTER}</InputLabel>
          <Select
            labelId="pagelas-shelter-select-label"
            data-testid={`${P}-shelter-select`}
            value={shelter?.id ?? ''}
            label={PAGELAS_LABELS.SELECT_SHELTER}
            onChange={(event) => handleLeaderShelterChange(event.target.value)}
          >
            {leaderShelters.map((item) => (
              <MenuItem key={item.id} value={item.id} data-testid={`${P}-shelter-option-${item.id}`}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Paper>
  );

  let body;
  if (isLeader && loadingShelters) {
    body = (
      <div data-testid={`${P}-loading-shelters`} style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <CircularProgress />
      </div>
    );
  } else if (isLeader && !shelter) {
    body = <AdminEmptyState testId={`${P}-empty`} message={PAGELAS_LABELS.NO_LEADER_SHELTERS} />;
  } else if (level === 'shelters') {
    body = (
      <PagelaLevelList<ShelterDto>
        key="shelters"
        level="shelters"
        fetcher={fetchSheltersLevel}
        defaultSort={SHELTERS_DEFAULT_SORT}
        fields={SHELTER_FIELDS}
        searchLabel={PAGELAS_LABELS.SEARCH_SHELTERS}
        searchPlaceholder={PAGELAS_LABELS.PLACEHOLDER_SHELTERS}
        emptyMessage={PAGELAS_LABELS.EMPTY_SHELTERS}
        errorMessage={PAGELAS_LABELS.LOAD_ERROR_SHELTERS}
        emptyIcon={<Home sx={{ fontSize: 64, color: 'text.secondary' }} />}
        rowKey={(item) => item.id}
        renderItem={(item) => <ShelterLevelCard shelter={item} onOpen={(next) => setShelter({ id: next.id, name: next.name })} />}
      />
    );
  } else if (level === 'sheltered' && fetchSheltered && shelter) {
    body = (
      <PagelaLevelList<ShelteredDto>
        key={`sheltered:${shelter.id}`}
        level="sheltered"
        fetcher={fetchSheltered}
        defaultSort={SHELTERED_DEFAULT_SORT}
        fields={SHELTERED_FIELDS}
        searchLabel={PAGELAS_LABELS.SEARCH_SHELTERED}
        searchPlaceholder={PAGELAS_LABELS.PLACEHOLDER_SHELTERED}
        emptyMessage={PAGELAS_LABELS.EMPTY_SHELTERED}
        errorMessage={PAGELAS_LABELS.LOAD_ERROR_SHELTERED}
        emptyIcon={<ChildCare sx={{ fontSize: 64, color: 'text.secondary' }} />}
        rowKey={(item) => item.id}
        renderItem={(item) => <ShelteredLevelCard sheltered={item} onOpen={(next) => setSheltered({ id: next.id, name: next.name })} />}
      />
    );
  } else if (fetchPagelas && sheltered) {
    body = (
      <PagelaLevelList<PagelaDto>
        key={`pagelas:${sheltered.id}`}
        level="pagelas"
        fetcher={fetchPagelas}
        defaultSort={PAGELAS_DEFAULT_SORT}
        fields={PAGELA_FIELDS}
        searchLabel={PAGELAS_LABELS.SEARCH_PAGELAS}
        searchPlaceholder={PAGELAS_LABELS.PLACEHOLDER_PAGELAS}
        emptyMessage={PAGELAS_LABELS.EMPTY_PAGELAS}
        errorMessage={PAGELAS_LABELS.LOAD_ERROR_PAGELAS}
        emptyIcon={<Bookmarks sx={{ fontSize: 64, color: 'text.secondary' }} />}
        rowKey={(item) => item.id}
        renderItem={(item) => <PagelaRecordCard pagela={item} />}
      />
    );
  }

  return (
    <AdminPageShell testId={`${P}-manager`} title={PAGELAS_TITLE} onBack={level === 'shelters' || (isLeader && level === 'sheltered') ? undefined : handleBack}>
      {breadcrumb}
      {body}
    </AdminPageShell>
  );
}
