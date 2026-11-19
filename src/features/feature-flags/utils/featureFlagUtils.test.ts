import { describe, expect, it } from 'vitest';

import { FeatureFlagTargetRole } from '../types';
import type { FeatureFlagResponse } from '../types';
import {
  hasFeatureFlagFormErrors,
  isValidMetadataJson,
  parseFeatureFlagSort,
  rolesOfAudience,
  toCreateFeatureFlagRequest,
  toFeatureFlagFormValues,
  toUpdateFeatureFlagRequest,
  validateFeatureFlagForm,
} from './featureFlagUtils';

const FLAG: FeatureFlagResponse = {
  id: 'flag-id',
  key: 'sheltered_management',
  name: 'Gestão de acolhidos',
  description: 'Cadastro e consulta',
  enabled: true,
  environment: null,
  targetRoles: [FeatureFlagTargetRole.ADMIN, FeatureFlagTargetRole.LEADER],
  audience: 'ADMIN_LEADER',
  metadata: { rollout: 50 },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('feature flag management utilities', () => {
  it('maps every audience to the API roles', () => {
    expect(rolesOfAudience('EVERYONE')).toEqual([]);
    expect(rolesOfAudience('ADMIN_LEADER')).toEqual([
      FeatureFlagTargetRole.ADMIN,
      FeatureFlagTargetRole.LEADER,
    ]);
    expect(rolesOfAudience('ALL_ROLES')).toEqual([
      FeatureFlagTargetRole.ADMIN,
      FeatureFlagTargetRole.LEADER,
      FeatureFlagTargetRole.MEMBER,
    ]);
  });

  it('round-trips a response through the form payload', () => {
    const values = toFeatureFlagFormValues(FLAG);
    expect(toCreateFeatureFlagRequest(values)).toEqual({
      key: 'sheltered_management',
      name: 'Gestão de acolhidos',
      description: 'Cadastro e consulta',
      enabled: true,
      targetRoles: [FeatureFlagTargetRole.ADMIN, FeatureFlagTargetRole.LEADER],
      metadata: { rollout: 50 },
    });
  });

  it('accepts underscore and hyphen keys used by the Orfanato', () => {
    const values = toFeatureFlagFormValues(null);
    values.key = 'nova-feature_2';
    values.name = 'Nova feature';

    expect(hasFeatureFlagFormErrors(validateFeatureFlagForm(values))).toBe(false);
  });

  it('rejects arrays and malformed metadata', () => {
    expect(isValidMetadataJson('{"rollout":50}')).toBe(true);
    expect(isValidMetadataJson('[]')).toBe(false);
    expect(isValidMetadataJson('{')).toBe(false);
  });

  it('sends null when an edit clears existing metadata', () => {
    const values = toFeatureFlagFormValues(FLAG);
    values.metadataJson = '';

    expect(toUpdateFeatureFlagRequest(values).metadata).toBeNull();
  });

  it('falls back to a safe sort option', () => {
    expect(parseFeatureFlagSort('invalid:DESC')).toEqual({
      sort: 'name',
      order: 'DESC',
    });
  });
});
