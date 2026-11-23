import React, { useState } from 'react';
import { Stack } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/slices';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import NoTeamLinked from '@/components/common/NoTeamLinked';
import { useAuthRole } from '../../utils/useAuthRole';
import { fetchProfilesPage } from './api';
import BirthdaySection from './components/BirthdaySection';
import { ProfileCard } from './components/ProfileCard';
import ProfileDetailModal from './components/ProfileDetailModal';
import {
  BIRTH_MONTH_LABELS,
  MANAGER_TEXTS,
  PROFILE_FILTER_KEYS,
  PROFILE_GENDER_OPTIONS,
  PROFILE_ROLE_OPTIONS,
  PROFILE_SORT_OPTIONS,
  PROFILES_DEFAULT_SORT,
  PROFILES_TEST_ID_PREFIX,
} from './manager/constants';
import { useBirthdays } from './manager/useBirthdays';
import { hasBirthdays } from './manager/utils';
import type { CompleteProfileListItem } from './types';
import { roleConfig } from './utils';

const P = PROFILES_TEST_ID_PREFIX;
const K = PROFILE_FILTER_KEYS;
const DEFAULT_FILTERS = { [K.SORT]: PROFILES_DEFAULT_SORT };

const ROLE_FIELD: AdminFilterField = {
  kind: 'select',
  key: K.ROLE,
  label: MANAGER_TEXTS.filterRole,
  allLabel: MANAGER_TEXTS.filterRoleAll,
  options: PROFILE_ROLE_OPTIONS.map((role) => ({ value: role, label: roleConfig[role].label })),
};

const COMMON_FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.GENDER,
    label: MANAGER_TEXTS.filterGender,
    allLabel: MANAGER_TEXTS.filterGenderAll,
    options: PROFILE_GENDER_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  {
    kind: 'select',
    key: K.BIRTH_MONTH,
    label: MANAGER_TEXTS.filterBirthMonth,
    allLabel: MANAGER_TEXTS.filterBirthMonthAll,
    options: BIRTH_MONTH_LABELS.map((label, index) => ({ value: String(index + 1), label })),
  },
  { kind: 'text', key: K.TEMPERAMENTS, label: MANAGER_TEXTS.filterTemperaments, placeholder: MANAGER_TEXTS.filterTemperamentsPlaceholder },
  { kind: 'text', key: K.LOVE_LANGUAGES, label: MANAGER_TEXTS.filterLoveLanguages, placeholder: MANAGER_TEXTS.filterLoveLanguagesPlaceholder },
  { kind: 'text', key: K.FAVORITE_COLOR, label: MANAGER_TEXTS.filterFavoriteColor, placeholder: MANAGER_TEXTS.filterFavoriteColorPlaceholder },
  { kind: 'date', key: K.CREATED_FROM, label: MANAGER_TEXTS.filterCreatedFrom },
  { kind: 'date', key: K.CREATED_TO, label: MANAGER_TEXTS.filterCreatedTo },
  {
    kind: 'select',
    key: K.SORT,
    label: MANAGER_TEXTS.filterSort,
    allLabel: null,
    options: PROFILE_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const ADMIN_FIELDS: AdminFilterField[] = [ROLE_FIELD, ...COMMON_FIELDS];

/** Lista de perfis. O líder só enxerga as pessoas das próprias equipes (a API escopa), por isso não filtra por papel. */
function ProfilesScreen({ isLeader }: { isLeader: boolean }) {
  const list = useAdminList<CompleteProfileListItem>({
    fetcher: fetchProfilesPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: MANAGER_TEXTS.loadError,
  });
  const { groups, loading: loadingBirthdays } = useBirthdays();
  const [selectedProfile, setSelectedProfile] = useState<CompleteProfileListItem | null>(null);

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={MANAGER_TEXTS.title}
      searchLabel={MANAGER_TEXTS.searchLabel}
      searchPlaceholder={MANAGER_TEXTS.searchPlaceholder}
      fields={isLeader ? COMMON_FIELDS : ADMIN_FIELDS}
      list={list}
      emptyMessage={MANAGER_TEXTS.empty}
      emptyIcon={<PersonIcon sx={{ fontSize: 64, color: 'text.disabled' }} />}
      skeletonWithCover={false}
      belowToolbar={
        !loadingBirthdays && hasBirthdays(groups) ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} data-testid="profiles-birthdays">
            <BirthdaySection title="Aniversário Hoje! 🎉" emoji="🎂" profiles={groups.today} variant="today" onProfileClick={setSelectedProfile} />
            <BirthdaySection title="Esta Semana" emoji="🎈" profiles={groups.week} variant="week" onProfileClick={setSelectedProfile} />
            <BirthdaySection title="Este Mês" emoji="🎁" profiles={groups.month} variant="month" onProfileClick={setSelectedProfile} />
          </Stack>
        ) : null
      }
      overlays={<ProfileDetailModal profile={selectedProfile} open={!!selectedProfile} onClose={() => setSelectedProfile(null)} />}
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} onClick={() => setSelectedProfile(profile)} />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}

const ProfilesManager: React.FC = () => {
  const { isLeader } = useAuthRole();
  const user = useSelector((state: RootState) => state.auth.user);

  // Líder sem equipe vinculada: mostra o aviso em vez do conteúdo.
  if (isLeader && (!user?.leaderProfile?.teams || user.leaderProfile.teams.length === 0)) {
    return <NoTeamLinked showBackButton={false} />;
  }
  return <ProfilesScreen isLeader={isLeader} />;
};

export default ProfilesManager;
