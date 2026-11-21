import { useEffect, useState } from "react";

import { logger } from "@/utils/logger";

import { apiListShelterTeams } from "./api";
import type { ShelterTeamOption } from "./types";

/** Carrega as equipes uma única vez, na primeira vez que o cadastro de membro é escolhido. */
export function useRegisterTeams(enabled: boolean): {
  teams: ShelterTeamOption[];
  loading: boolean;
} {
  const [teams, setTeams] = useState<ShelterTeamOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;

    const run = async (): Promise<void> => {
      setLoading(true);
      try {
        const options = await apiListShelterTeams();
        if (!cancelled) setTeams(options);
      } catch (error: unknown) {
        logger.warn("Não foi possível carregar as equipes no cadastro", { feature: "register" }, error);
        if (!cancelled) setTeams([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, loaded]);

  return { teams, loading };
}
