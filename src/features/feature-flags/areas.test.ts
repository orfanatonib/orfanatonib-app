import { describe, expect, it } from 'vitest';

import {
  FEATURE_FLAG_AREAS,
  FRONT_ONLY_FEATURE_FLAGS,
  countFlagsByArea,
  featureFlagAreaOf,
  featureFlagKeysOfArea,
  groupFlagsByArea,
  isEnforcedByApi,
} from './areas';
import { DEFAULT_FEATURE_FLAGS_MAP } from './constants';
import { FeatureFlagKeys } from './types';

describe('áreas do painel de flags', () => {
  it('toda flag de interface do catálogo cai em exatamente uma área (nenhuma em "Outras")', () => {
    for (const key of Object.keys(DEFAULT_FEATURE_FLAGS_MAP)) {
      const area = featureFlagAreaOf(key);
      expect(area, key).not.toBe('custom');
      expect(area, key).not.toBe('email');
    }
  });

  it('nenhuma chave aparece em duas áreas', () => {
    const seen = new Map<string, string>();
    for (const area of FEATURE_FLAG_AREAS) {
      for (const key of featureFlagKeysOfArea(area.id)) {
        expect(seen.get(key), key).toBeUndefined();
        seen.set(key, area.id);
      }
    }
  });

  it('e-mails (nas duas gerações de chave) e flags personalizadas têm área própria', () => {
    expect(featureFlagAreaOf('email_delivery')).toBe('email');
    expect(featureFlagAreaOf('email-password-reset')).toBe('email');
    expect(featureFlagAreaOf('e2e-flag-123')).toBe('custom');
  });

  it('agrupa na ordem do painel, omite área vazia e preserva a ordem interna', () => {
    const groups = groupFlagsByArea([
      { key: 'pagelas' },
      { key: 'public_registration' },
      { key: 'about_page' },
      { key: 'minha_flag' },
    ]);
    expect(groups.map((group) => group.area.id)).toEqual(['public', 'people-admin', 'custom']);
    expect(groups[0].items.map((item) => item.key)).toEqual(['public_registration', 'about_page']);
  });

  it('conta por área', () => {
    const counts = countFlagsByArea([{ key: 'pagelas' }, { key: 'user_management' }, { key: 'x' }]);
    expect(counts['people-admin']).toBe(2);
    expect(counts.custom).toBe(1);
    expect(counts.public).toBe(0);
  });

  it('selo "imposta na API": só as de catálogo com endpoint', () => {
    expect(isEnforcedByApi(FeatureFlagKeys.PAGELAS)).toBe(true);
    for (const key of FRONT_ONLY_FEATURE_FLAGS) expect(isEnforcedByApi(key)).toBe(false);
    expect(isEnforcedByApi('email_delivery')).toBe(false);
    expect(isEnforcedByApi('flag_minha')).toBe(false);
  });
});
