import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_FEATURE_FLAGS_MAP } from './constants';
import { FeatureFlagKeys } from './types';

const API_ENUM = resolve(
  process.cwd(),
  '../orfanatonib-api/src/core/feature-flags/enums/feature-flag-keys.enum.ts',
);

function apiUiKeys(): string[] {
  const source = readFileSync(API_ENUM, 'utf8');
  return [...source.matchAll(/=\s*"([a-z0-9_]+)"/g)].map((m) => m[1]);
}

describe('contrato do catálogo de flags (API × front)', () => {
  it('toda chave do enum do front tem valor no mapa padrão', () => {
    // email_delivery é a chave-mestra dos e-mails: vive só no servidor.
    for (const key of Object.values(FeatureFlagKeys)) {
      if (key === FeatureFlagKeys.EMAIL_DELIVERY) continue;
      expect(DEFAULT_FEATURE_FLAGS_MAP, key).toHaveProperty(key);
    }
  });

  it('chaves do front são snake_case', () => {
    for (const key of Object.values(FeatureFlagKeys)) {
      expect(key).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
    }
  });

  it.skipIf(!existsSync(API_ENUM))(
    'o front e a API declaram exatamente as mesmas chaves',
    () => {
      const front = Object.values(FeatureFlagKeys).sort();
      expect(front).toEqual([...apiUiKeys()].sort());
    },
  );
});
