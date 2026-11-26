import type { ReactNode } from "react";

import { useIsFeatureEnabled } from "@/features/feature-flags";
import type { FeatureFlagKeys } from "@/features/feature-flags/types";

export interface FeatureGateProps {
  /** Flag que precisa estar ligada para o conteúdo aparecer. */
  readonly flag: FeatureFlagKeys;
  readonly children: ReactNode;
  /** Mostrado com a flag desligada (por padrão, nada). */
  readonly fallback?: ReactNode;
}

/** Esconde botões, links e seções de um recurso quando a feature flag dele está desligada. */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const enabled = useIsFeatureEnabled(flag);
  return <>{enabled ? children : fallback}</>;
}
