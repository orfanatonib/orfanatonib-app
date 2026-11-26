import React from 'react';
import { Avatar } from '@mui/material';
import {
    Cake as CakeIcon,
    Palette as PaletteIcon,
    Psychology as TemperamentIcon,
    Schedule as ScheduleIcon,
    Visibility,
} from '@mui/icons-material';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { CompleteProfileListItem } from '../types';
import {
    roleConfig,
    getGenderStyle,
    getBirthdayStatus,
    calculateAge,
    formatBirthDateShort,
} from '../utils';
import { MANAGER_TEXTS, PROFILES_TEST_ID_PREFIX } from '../manager/constants';

const P = PROFILES_TEST_ID_PREFIX;

interface ProfileCardProps {
    profile: CompleteProfileListItem;
    onClick: () => void;
}

/** Cartão da pessoa no padrão `AdminEntityCard`: avatar, papel, e-mail, chips (aniversário, preferências, cadastro) e a ação "Ver perfil". */
export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClick }) => {
    const id = String(profile.id);
    const roleStyle = roleConfig[profile.role?.toLowerCase()] || roleConfig.member;
    const genderStyle = getGenderStyle(profile.personalData?.gender);
    const birthDate = profile.personalData?.birthDate;
    const birthdayStatus = getBirthdayStatus(birthDate);
    const age = calculateAge(birthDate);

    const chips: AdminChipRowItem[] = [];
    if (birthdayStatus === 'today') {
        chips.push({ key: 'birthday-today', label: '🎂 Aniversário hoje', testId: `${P}-card-birthday-today-${id}`, color: 'error' });
    }
    if (birthDate) {
        chips.push({
            key: 'birth',
            label: `${formatBirthDateShort(birthDate)}${age !== null ? ` • ${age} ${MANAGER_TEXTS.years}` : ''}`,
            testId: `${P}-card-birth-${id}`,
            icon: <CakeIcon />,
            color: birthdayStatus ? 'warning' : 'default',
        });
    }
    if (profile.preferences?.temperaments) {
        chips.push({
            key: 'temperament',
            label: profile.preferences.temperaments.split(' ')[0],
            testId: `${P}-card-temperament-${id}`,
            icon: <TemperamentIcon />,
        });
    }
    if (profile.preferences?.favoriteColor) {
        chips.push({
            key: 'color',
            label: profile.preferences.favoriteColor.split(' ')[0],
            testId: `${P}-card-color-${id}`,
            icon: <PaletteIcon />,
        });
    }
    chips.push({
        key: 'created',
        label: `${MANAGER_TEXTS.registeredAt} ${formatCreatedDate(profile.createdAt)}`,
        testId: `${P}-card-created-${id}`,
        icon: <ScheduleIcon />,
    });

    return (
        <AdminEntityCard
            testId={`${P}-card-${id}`}
            title={profile.name}
            titleTestId={`${P}-card-title-${id}`}
            subtitle={roleStyle.label}
            subtitleTestId={`${P}-card-role-${id}`}
            description={profile.email}
            descriptionTestId={`${P}-card-email-${id}`}
            avatar={
                <Avatar
                    src={profile.image?.url}
                    sx={{ width: 48, height: 48, fontWeight: 700, background: genderStyle.gradient }}
                >
                    {profile.name?.charAt(0).toUpperCase()}
                </Avatar>
            }
            meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
            actions={[
                {
                    key: 'open',
                    label: 'Ver perfil',
                    ariaLabel: `Ver perfil de ${profile.name}`,
                    icon: <Visibility />,
                    onClick,
                    testId: `${P}-card-open-${id}`,
                },
            ]}
        />
    );
};
