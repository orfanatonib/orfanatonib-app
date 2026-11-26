import type { ReactElement } from "react";
import { FeatureFlagRoute, type FeatureFlagKeys } from "@/features/feature-flags";
import { lazyElement } from "./lazyElement";

/** Guarda de flag (síncrona) por fora; a página carregada sob demanda, com esqueleto, por dentro. */
export function flaggedElement(
  featureKey: FeatureFlagKeys,
  element: ReactElement,
) {
  return (
    <FeatureFlagRoute featureKey={featureKey}>
      {lazyElement(element)}
    </FeatureFlagRoute>
  );
}
