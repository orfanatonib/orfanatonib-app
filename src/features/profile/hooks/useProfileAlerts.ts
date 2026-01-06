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

import { useSelector } from 'react-redux';

export function useProfileAlerts({ profile, completeProfile }: UseProfileAlertsParams) {
    const emailVerificationAlert = useSelector((state: any) => state.auth.emailVerificationAlert);
    return useMemo(() => {
        const alerts: ProfileAlert[] = [];

        if (emailVerificationAlert && emailVerificationAlert.verificationEmailSent) {
            alerts.push({
                id: 'email-verification',
                message: 'Um email de verificação foi enviado para o seu endereço.',
                to: '/verificar-email',
            });
        }

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
    }, [profile, completeProfile, emailVerificationAlert]);
}
