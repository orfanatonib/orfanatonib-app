import { useEffect, useMemo, useState } from 'react';
import { apiGetAllProfiles } from '../api';
import type { CompleteProfileListItem } from '../types';
import { logger } from '@/utils/logger';
import { BIRTHDAYS_FETCH_LIMIT, MANAGER_TEXTS } from './constants';
import { birthdayMonths, groupBirthdays, mergeById } from './utils';

/**
 * Painel de aniversariantes: busca só os perfis que fazem aniversário no mês (e no seguinte, perto da
 * virada), filtrados no servidor. Só enfeita a tela: se falhar, a lista segue funcionando.
 */
export function useBirthdays() {
  const [profiles, setProfiles] = useState<CompleteProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      birthdayMonths(new Date()).map((birthMonth) => apiGetAllProfiles({ limit: BIRTHDAYS_FETCH_LIMIT, birthMonth })),
    )
      .then((responses) => {
        if (!cancelled) setProfiles(mergeById(responses.map((response) => response.items)));
      })
      .catch((err: unknown) => logger.warn(MANAGER_TEXTS.birthdaysWarn, { feature: 'profiles' }, err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => groupBirthdays(profiles), [profiles]);
  return { groups, loading };
}
