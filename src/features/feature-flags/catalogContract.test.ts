import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FRONT_ONLY_FEATURE_FLAGS, featureFlagAreaOf } from './areas';
import { DEFAULT_FEATURE_FLAGS_MAP } from './constants';
import { FEATURE_PROFILE_RULES } from './profileRules';
import { FeatureFlagKeys } from './types';

const API_ENUM = resolve(
  process.cwd(),
  '../orfanatonib-api/src/core/feature-flags/enums/feature-flag-keys.enum.ts',
);

const API_SRC = resolve(process.cwd(), '../orfanatonib-api/src');
const API_CATALOG = join(API_SRC, 'core/feature-flags/constants.ts');
const hasApi = existsSync(API_ENUM) && existsSync(API_CATALOG);

interface ApiCatalogEntry {
  enabled: boolean;
  targetRoles: string[];
}

/** Lê `DEFAULT_FEATURE_FLAGS` da API (só interface; as `email_*` ficam de fora). */
function apiCatalog(): Record<string, ApiCatalogEntry> {
  const source = readFileSync(API_CATALOG, 'utf8');
  const start = source.indexOf('export const DEFAULT_FEATURE_FLAGS');
  const body = source.slice(start, source.indexOf('] as const;', start));
  const entries: Record<string, ApiCatalogEntry> = {};
  const block =
    /\{\s*key:\s*"([a-z0-9_-]+)"[\s\S]*?enabled:\s*(true|false),(?:\s*targetRoles:\s*\[([^\]]*)\],)?\s*\}/g;
  for (const match of body.matchAll(block)) {
    if (match[1].startsWith('email')) continue;
    entries[match[1]] = {
      enabled: match[2] === 'true',
      targetRoles: [...(match[3] ?? '').matchAll(/"([a-z]+)"/g)].map((m) => m[1]),
    };
  }
  return entries;
}

function walk(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, found);
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) found.push(path);
  }
  return found;
}

/** Flags de interface que algum código da API consulta (controller ou serviço). */
function apiEnforcedKeys(): string[] {
  const enumSource = readFileSync(API_ENUM, 'utf8');
  const byName = Object.fromEntries(
    [...enumSource.matchAll(/([A-Z_]+)\s*=\s*"([a-z0-9_]+)"/g)].map((m) => [m[1], m[2]]),
  );
  const used = new Set<string>();
  for (const file of walk(API_SRC)) {
    if (file.includes('core/feature-flags')) continue;
    for (const match of readFileSync(file, 'utf8').matchAll(/FeatureFlagKeys\.([A-Z_]+)/g)) {
      used.add(byName[match[1]]);
    }
  }
  return [...used].sort();
}

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

  it('o mapa de regras de perfil cobre exatamente as flags de interface (todas menos email_delivery)', () => {
    const uiKeys = Object.values(FeatureFlagKeys).filter((key) => key !== FeatureFlagKeys.EMAIL_DELIVERY).sort();
    expect(Object.keys(FEATURE_PROFILE_RULES).sort()).toEqual(uiKeys);
  });

  describe.skipIf(!hasApi)('catálogo do front × catálogo da API (DEFAULT_FEATURE_FLAGS)', () => {
    it('as mesmas flags de interface existem nos dois lados', () => {
      expect(Object.keys(DEFAULT_FEATURE_FLAGS_MAP).sort()).toEqual(Object.keys(apiCatalog()).sort());
    });

    it('o padrão ligado/desligado do front é o do catálogo da API', () => {
      const api = apiCatalog();
      for (const [key, enabled] of Object.entries(DEFAULT_FEATURE_FLAGS_MAP)) {
        expect(enabled, key).toBe(api[key].enabled);
      }
    });

    it('o perfil esperado de cada flag (FEATURE_PROFILE_RULES) é o targetRoles da API', () => {
      const api = apiCatalog();
      for (const [key, roles] of Object.entries(FEATURE_PROFILE_RULES)) {
        expect([...roles].sort(), key).toEqual([...api[key].targetRoles].sort());
      }
    });

    it('as flags só-de-interface (sem selo "imposta na API") são exatamente as que nenhum código da API consulta', () => {
      const enforced = new Set(apiEnforcedKeys());
      const uiOnly = Object.keys(DEFAULT_FEATURE_FLAGS_MAP)
        .filter((key) => !enforced.has(key))
        .sort();
      expect(uiOnly).toEqual([...FRONT_ONLY_FEATURE_FLAGS].sort());
    });

    it('toda flag do catálogo da API tem área no painel', () => {
      for (const key of Object.keys(apiCatalog())) {
        expect(featureFlagAreaOf(key), key).not.toBe('custom');
      }
    });
  });
});
