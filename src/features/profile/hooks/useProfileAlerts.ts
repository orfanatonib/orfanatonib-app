import { useMemo } from 'react';

export interface ProfileAlert {
    id: string;
    message: string;
    to?: string;
}

interface UseProfileAlertsParams {
    profile?: any;
    completeProfile?: any;
}

export function useProfileAlerts({ profile, completeProfile }: UseProfileAlertsParams) {
    return useMemo(() => {
        const alerts: ProfileAlert[] = [];

        if (profile && (!profile.image || !profile.image.url)) {
            alerts.push({
                id: 'missing-photo',
                message: 'Adicione uma foto ao seu perfil.',
                to: '/perfil#foto',
            });
        }

        if (completeProfile) {
            const pd = completeProfile.personalData;
            const pref = completeProfile.preferences;
            const requiredPD = ['birthDate', 'gender', 'gaLeaderName', 'gaLeaderContact'];
            const requiredPref = ['loveLanguages', 'temperaments', 'favoriteColor', 'favoriteFood', 'favoriteMusic', 'whatMakesYouSmile', 'skillsAndTalents'];
            const pdMissing = !pd || requiredPD.some((k) => !pd[k]);
            const prefMissing = !pref || requiredPref.some((k) => !pref[k]);
            if (pdMissing) {
                alerts.push({
                    id: 'missing-personaldata',
                    message: 'Complete seus dados pessoais.',
                    to: '/perfil#pessoais',
                });
            }
            if (prefMissing) {
                alerts.push({
                    id: 'missing-preferences',
                    message: 'Complete suas preferências.',
                    to: '/perfil#preferencias',
                });
            }
        }

        return alerts;
    }, [profile, completeProfile]);
}
