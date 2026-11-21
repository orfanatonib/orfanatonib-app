import { useSelector } from "react-redux";

import { FeatureFlagKeys } from "@/features/feature-flags/types";
import {
  selectFeatureFlagsLastFetched,
  selectIsFeatureEnabled,
} from "@/store/selectors/featureFlagsSelectors";
import type { RootState } from "@/store/slices";

/**
 * Uma opção de entrada (cadastro, recuperação de senha, Google) aparece quando a flag
 * está ligada. Antes de as flags chegarem não dá para saber: mostrar evita sumir com
 * uma opção válida por causa de uma requisição ainda em voo (a rota continua guardada pela flag).
 */
export const isEntryOptionVisible = (flagEnabled: boolean, flagsFetched: boolean): boolean =>
  !flagsFetched || flagEnabled;

export interface AuthEntryOptions {
  canRegister: boolean;
  canRecoverPassword: boolean;
  canUseGoogle: boolean;
}

export function useAuthEntryOptions(): AuthEntryOptions {
  const fetched = useSelector((state: RootState) => selectFeatureFlagsLastFetched(state) !== null);
  const registration = useSelector(selectIsFeatureEnabled(FeatureFlagKeys.PUBLIC_REGISTRATION));
  const recovery = useSelector(selectIsFeatureEnabled(FeatureFlagKeys.PASSWORD_RECOVERY));
  const google = useSelector(selectIsFeatureEnabled(FeatureFlagKeys.GOOGLE_LOGIN));

  return {
    canRegister: isEntryOptionVisible(registration, fetched),
    canRecoverPassword: isEntryOptionVisible(recovery, fetched),
    canUseGoogle: isEntryOptionVisible(google, fetched),
  };
}
