import type { ContentAudienceDefinitionResponse } from './types';

export function formatAudienceAgeRange(
  audience: ContentAudienceDefinitionResponse,
): string {
  if (audience.maximumAge === null) {
    return `A partir de ${audience.minimumAge} anos`;
  }

  return `${audience.minimumAge} a ${audience.maximumAge} anos`;
}

export function formatContentStudioDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
