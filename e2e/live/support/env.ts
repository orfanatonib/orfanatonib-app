import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Configuração dos helpers de banco e S3 dos E2E.
 *
 * Os valores vêm de `E2E_*` ou, na falta, do `env/local.env` da API (somente
 * leitura das variáveis DB_ e AWS_). Nada daqui é impresso nem versionado, e os helpers
 * **recusam** qualquer host que não seja a máquina local.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);

export function parseDotenv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadApiLocalEnv(): Record<string, string> {
  const file = resolve(process.cwd(), "../orfanatonib-api/env/local.env");
  return existsSync(file) ? parseDotenv(readFileSync(file, "utf8")) : {};
}

const apiEnv = loadApiLocalEnv();
const pick = (e2e: string, api: string, fallback = ""): string =>
  process.env[e2e] ?? apiEnv[api] ?? fallback;

/** `JWT_SECRET` da API local: só para assinar, nos testes, o token de conclusão que o login Google emitiria. */
export function apiJwtSecret(): string {
  const secret = pick("E2E_JWT_SECRET", "JWT_SECRET");
  if (!secret) throw new Error("JWT_SECRET não encontrado (E2E_JWT_SECRET ou env/local.env da API).");
  return secret;
}

export interface E2eDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface E2eS3Config {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Prefixo de ambiente usado pela API (`<ENVIRONMENT>/uploads/...`). */
  environmentPrefix: string;
}

export function assertLocalHost(host: string, what: string): void {
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `${what} aponta para "${host}": os E2E só rodam contra a máquina local (localhost/127.0.0.1).`,
    );
  }
}

export function dbConfig(): E2eDbConfig {
  const config: E2eDbConfig = {
    host: pick("E2E_DB_HOST", "DB_HOST", "localhost"),
    port: Number(pick("E2E_DB_PORT", "DB_PORT", "3306")),
    user: pick("E2E_DB_USER", "DB_USERNAME", "root"),
    password: pick("E2E_DB_PASSWORD", "DB_PASSWORD"),
    database: pick("E2E_DB_NAME", "DB_NAME"),
  };
  assertLocalHost(config.host, "O banco dos E2E");
  if (!config.database) {
    throw new Error("Banco dos E2E não configurado (E2E_DB_NAME ou DB_NAME do env/local.env da API).");
  }
  return config;
}

export function s3Config(): E2eS3Config {
  const endpoint = pick("E2E_S3_ENDPOINT", "AWS_S3_ENDPOINT", "http://localhost:4566");
  assertLocalHost(new URL(endpoint).hostname, "O S3 dos E2E");
  return {
    endpoint,
    bucket: pick("E2E_S3_BUCKET", "AWS_S3_BUCKET_NAME", "orfanatos-nib-storage"),
    region: pick("E2E_S3_REGION", "AWS_REGION", "us-east-1"),
    accessKeyId: pick("E2E_S3_ACCESS_KEY", "AWS_ACCESS_KEY_ID", "test"),
    secretAccessKey: pick("E2E_S3_SECRET_KEY", "AWS_SECRET_ACCESS_KEY", "test"),
    environmentPrefix: pick("E2E_S3_ENV_PREFIX", "ENVIRONMENT", "local"),
  };
}
