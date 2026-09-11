import { FEATURE_FLAG_AUDIENCE_OPTIONS } from '../constants';
import type {
  CreateFeatureFlagRequest,
  FeatureFlagAudience,
  FeatureFlagFormErrors,
  FeatureFlagFormValues,
  FeatureFlagResponse,
  FeatureFlagSortField,
  FeatureFlagSortOrder,
  UpdateFeatureFlagRequest,
} from '../types';
import { FeatureFlagKeys, FeatureFlagTargetRole } from '../types';

export const AUDIENCE_ROLES: Record<
  FeatureFlagAudience,
  FeatureFlagTargetRole[]
> = {
  EVERYONE: [],
  ADMIN: [FeatureFlagTargetRole.ADMIN],
  LEADER: [FeatureFlagTargetRole.LEADER],
  MEMBER: [FeatureFlagTargetRole.MEMBER],
  ADMIN_LEADER: [FeatureFlagTargetRole.ADMIN, FeatureFlagTargetRole.LEADER],
  ADMIN_MEMBER: [FeatureFlagTargetRole.ADMIN, FeatureFlagTargetRole.MEMBER],
  LEADER_MEMBER: [FeatureFlagTargetRole.LEADER, FeatureFlagTargetRole.MEMBER],
  ALL_ROLES: [
    FeatureFlagTargetRole.ADMIN,
    FeatureFlagTargetRole.LEADER,
    FeatureFlagTargetRole.MEMBER,
  ],
};

export function rolesOfAudience(
  audience: FeatureFlagAudience,
): FeatureFlagTargetRole[] {
  return [...AUDIENCE_ROLES[audience]];
}

export function audienceInfo(audience: FeatureFlagAudience) {
  return (
    FEATURE_FLAG_AUDIENCE_OPTIONS.find((option) => option.value === audience) ??
    FEATURE_FLAG_AUDIENCE_OPTIONS[0]
  );
}

export function formatFeatureFlagDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

export function featureFlagInitials(key: string): string {
  const parts = key.trim().split(/[_\-\s]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function isMetadata(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidMetadataJson(value: string): boolean {
  if (!value.trim()) return true;
  try {
    return isMetadata(JSON.parse(value) as unknown);
  } catch {
    return false;
  }
}

export function parseMetadataJson(
  value: string,
): Record<string, unknown> | undefined {
  if (!value.trim()) return undefined;
  const parsed: unknown = JSON.parse(value);
  return isMetadata(parsed) ? parsed : undefined;
}

export function toFeatureFlagFormValues(
  flag: FeatureFlagResponse | null,
): FeatureFlagFormValues {
  return {
    key: flag?.key ?? '',
    name: flag?.name ?? '',
    description: flag?.description ?? '',
    enabled: flag?.enabled ?? false,
    audience: flag?.audience ?? 'EVERYONE',
    metadataJson: flag?.metadata ? JSON.stringify(flag.metadata, null, 2) : '',
  };
}

export function validateFeatureFlagForm(
  values: FeatureFlagFormValues,
): FeatureFlagFormErrors {
  return {
    key: !/^[a-z0-9][a-z0-9_-]*$/.test(values.key.trim()),
    name: !values.name.trim(),
    metadataJson: !isValidMetadataJson(values.metadataJson),
  };
}

export function hasFeatureFlagFormErrors(
  errors: FeatureFlagFormErrors,
): boolean {
  return errors.key || errors.name || errors.metadataJson;
}

export function toCreateFeatureFlagRequest(
  values: FeatureFlagFormValues,
): CreateFeatureFlagRequest {
  return {
    key: values.key.trim().toLowerCase(),
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    enabled: values.enabled,
    targetRoles: rolesOfAudience(values.audience),
    metadata: parseMetadataJson(values.metadataJson),
  };
}

export function toUpdateFeatureFlagRequest(
  values: FeatureFlagFormValues,
): UpdateFeatureFlagRequest {
  return {
    key: values.key.trim().toLowerCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    enabled: values.enabled,
    targetRoles: rolesOfAudience(values.audience),
    metadata: parseMetadataJson(values.metadataJson) ?? null,
  };
}

export function isFeatureFlagKeyUsedByApp(key: string): boolean {
  return (Object.values(FeatureFlagKeys) as string[]).includes(key.trim());
}

export function parseFeatureFlagSort(value: string): {
  sort: FeatureFlagSortField;
  order: FeatureFlagSortOrder;
} {
  const [sort, order] = value.split(':');
  const field: FeatureFlagSortField =
    sort === 'key' || sort === 'createdAt' || sort === 'updatedAt'
      ? sort
      : 'name';
  return { sort: field, order: order === 'DESC' ? 'DESC' : 'ASC' };
}
