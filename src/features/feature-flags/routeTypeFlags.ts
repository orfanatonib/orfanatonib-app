import { FeatureFlagKeys } from './types';

/**
 * Flag(s) de cada TIPO de página dinâmica (`entityType` da rota). Basta UMA ligada
 * para a página existir para o usuário (`anyOf`): o mesmo tipo serve a mais de um
 * público (ex.: vídeos públicos e vídeos de formação da Área do Membro).
 * Tipo fora do mapa não tem flag (nunca é escondido por aqui).
 *
 * Valores de `entityType`: `MediaTargetType` (+ `MeditationDay`, tipo de ROTA da meditação).
 */
export const ROUTE_TYPE_FLAG: Readonly<Record<string, readonly FeatureFlagKeys[]>> = {
  ImagesPage: [FeatureFlagKeys.PUBLIC_GALLERIES],
  VideosPage: [FeatureFlagKeys.PUBLIC_VIDEOS, FeatureFlagKeys.TRAINING_VIDEOS],
  VisitMaterialsPage: [FeatureFlagKeys.VISIT_MATERIALS],
  IdeasPage: [FeatureFlagKeys.IDEAS_SHARING],
  shelterPage: [FeatureFlagKeys.SHELTER_PAGES],
  MeditationDay: [FeatureFlagKeys.WEEKLY_MEDITATION],
};

/** `true` se o tipo da rota está liberado: sem flag mapeada, ou ao menos uma ligada. */
export function isRouteTypeEnabled(
  entityType: string,
  isEnabled: (flag: FeatureFlagKeys) => boolean,
): boolean {
  const flags = ROUTE_TYPE_FLAG[entityType];
  return !flags || flags.some((flag) => isEnabled(flag));
}

/** Só as rotas cujo tipo está liberado (pura; o hook `useVisibleRoutes` a aplica ao Redux). */
export function filterVisibleRoutes<T extends { entityType: string }>(
  routes: readonly T[],
  isEnabled: (flag: FeatureFlagKeys) => boolean,
): T[] {
  return routes.filter((route) => isRouteTypeEnabled(route.entityType, isEnabled));
}
