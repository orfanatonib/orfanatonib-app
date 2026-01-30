import React from 'react';
import {
    AdminPanelSettings as AdminIcon,
    School as MemberIcon,
    SupervisorAccount as LeaderIcon,
} from '@mui/icons-material';

export type BirthdayStatus = 'today' | 'this-week' | 'this-month' | null;

export const getBirthdayStatus = (birthDateStr?: string): BirthdayStatus => {
    if (!birthDateStr) return null;

    try {
        const today = new Date();
        const [, month, day] = birthDateStr.split('-').map(Number);

        const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);

        if (birthdayThisYear < today &&
            !(birthdayThisYear.getDate() === today.getDate() &&
                birthdayThisYear.getMonth() === today.getMonth())) {
            birthdayThisYear.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = birthdayThisYear.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (birthdayThisYear.getDate() === today.getDate() &&
            birthdayThisYear.getMonth() === today.getMonth()) {
            return 'today';
        }

        if (diffDays > 0 && diffDays <= 7) {
            return 'this-week';
        }

        if (birthdayThisYear.getMonth() === today.getMonth() &&
            birthdayThisYear.getFullYear() === today.getFullYear()) {
            return 'this-month';
        }

        return null;
    } catch (e) {
        console.debug('getBirthdayStatus: Date parsing error', e);
        return null;
    }
};

export const getDaysUntilBirthday = (birthDateStr?: string): number | null => {
    if (!birthDateStr) return null;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [, month, day] = birthDateStr.split('-').map(Number);

        const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
        birthdayThisYear.setHours(0, 0, 0, 0);

        if (birthdayThisYear < today) {
            birthdayThisYear.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = birthdayThisYear.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
        console.debug('getDaysUntilBirthday: Date parsing error', e);
        return null;
    }
};

export const formatBirthDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const [, month, day] = dateStr.split('-').map(Number);
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${day} de ${months[month - 1]}`;
    } catch (e) {
        console.debug('formatBirthDate: Date parsing error', e);
        return dateStr;
    }
};

export const formatBirthDateShort = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const [, month, day] = dateStr.split('-').map(Number);
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${day} ${months[month - 1]}`;
    } catch (e) {
        console.debug('formatBirthDateShort: Date parsing error', e);
        return dateStr;
    }
};

export const calculateAge = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    try {
        const birthDate = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        console.debug('calculateAge: Date parsing error', e);
        return null;
    }
};

export const roleConfig: Record<string, { gradient: string; color: string; label: string; icon: React.ReactElement; bgLight: string }> = {
    admin: {
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#764ba2',
        label: 'Admin',
        icon: <AdminIcon sx={{ fontSize: 14 }} />,
        bgLight: 'rgba(118, 75, 162, 0.08)',
    },
    leader: {
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#f5576c',
        label: 'Líder',
        icon: <LeaderIcon sx={{ fontSize: 14 }} />,
        bgLight: 'rgba(245, 87, 108, 0.08)',
    },
    member: {
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: '#4facfe',
        label: 'Membro',
        icon: <MemberIcon sx={{ fontSize: 14 }} />,
        bgLight: 'rgba(79, 172, 254, 0.08)',
    },
};

export const genderConfig: Record<string, { gradient: string; color: string; bgLight: string }> = {
    Masculino: {
        gradient: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: '#4facfe',
        bgLight: 'rgba(79, 172, 254, 0.06)',
    },
    Feminino: {
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#f5576c',
        bgLight: 'rgba(245, 87, 108, 0.06)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #a8a8a8 0%, #6b6b6b 100%)',
        color: '#888888',
        bgLight: 'rgba(136, 136, 136, 0.06)',
    },
};

export const getGenderStyle = (gender?: string) => {
    if (gender === 'Masculino') return genderConfig.Masculino;
    if (gender === 'Feminino') return genderConfig.Feminino;
    return genderConfig.neutral;
};
