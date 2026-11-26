import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { queryAll } from "./db";
import { s3Config } from "./env";
import { addedKeys, diffBucketAndRefs, keyFromUrl } from "./s3-invariants";

/**
 * Colunas que guardam URL de mídia do bucket. **Toda** coluna nova que guarde
 * URL de arquivo precisa entrar aqui (o teste de arquitetura
 * `orfanatonib-api/src/shared/media/media-columns.architecture.spec.ts` varre as entidades e compara com as duas listas).
 */
export const MEDIA_URL_COLUMNS: ReadonlyArray<{ table: string; column: string }> = [
  { table: "media_items", column: "url" },
  { table: "routes", column: "image" },
  { table: "content_packages", column: "coverImageUrl" },
  { table: "lessons", column: "cover_image_url" },
];

/** Colunas que guardam a chave do objeto (sem URL), como `content_assets.storage_key` do Estúdio. */
export const MEDIA_KEY_COLUMNS: ReadonlyArray<{ table: string; column: string }> = [
  { table: "content_assets", column: "storageKey" },
  { table: "lesson_versions", column: "docxS3Key" },
  { table: "lesson_versions", column: "pdfS3Key" },
];

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    const { endpoint, region, accessKeyId, secretAccessKey } = s3Config();
    client = new S3Client({ endpoint, region, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  }
  return client;
}

/**
 * Prefixo do ambiente usado pela API: `<ENVIRONMENT>/`. Cobre as chaves legadas
 * (`<env>/uploads/…`) e as novas por entidade (`<env>/<Entidade>/<dono>/<uuid>.<ext>`).
 */
export function uploadsPrefix(): string {
  return `${s3Config().environmentPrefix}/`;
}

export async function listObjects(prefix: string = uploadsPrefix()): Promise<string[]> {
  const { bucket } = s3Config();
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const page = await getClient().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    for (const item of page.Contents ?? []) if (item.Key) keys.push(item.Key);
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys.sort();
}

export async function objectExists(key: string): Promise<boolean> {
  return (await listObjects(key)).includes(key);
}

/**
 * Tabelas que existem no banco do ambiente. Uma entidade pode estar no código sem migration aplicada
 * (módulo ainda não ativado): sem tabela não há referência, e o `SELECT` não pode derrubar os invariantes
 * das demais features. A correspondência lista × entidades é garantida pelo teste de arquitetura da API.
 */
async function existingTables(): Promise<Set<string>> {
  const rows = await queryAll<{ name: string }>(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  return new Set(rows.map((row) => row.name));
}

export async function referencedKeys(): Promise<string[]> {
  const { bucket } = s3Config();
  const keys = new Set<string>();
  const tables = await existingTables();
  for (const { table, column } of MEDIA_URL_COLUMNS) {
    if (!tables.has(table)) continue;
    const rows = await queryAll<{ url: string | null }>(`SELECT \`${column}\` AS url FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`);
    for (const row of rows) {
      const key = row.url ? keyFromUrl(row.url, bucket) : null;
      if (key) keys.add(key);
    }
  }
  for (const { table, column } of MEDIA_KEY_COLUMNS) {
    if (!tables.has(table)) continue;
    const rows = await queryAll<{ key: string | null }>(`SELECT \`${column}\` AS \`key\` FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`);
    for (const row of rows) if (row.key) keys.add(row.key);
  }
  return [...keys].sort();
}

export const snapshotBucket = (): Promise<string[]> => listObjects();

/** Planta um objeto (só para testar os próprios helpers e a varredura de órfãos). */
export async function plantObject(key: string, body: string): Promise<void> {
  await getClient().send(new PutObjectCommand({ Bucket: s3Config().bucket, Key: key, Body: body }));
}

export async function removeObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: s3Config().bucket, Key: key }));
}

/**
 * A API grava no S3 ANTES de gravar a linha, e trabalhos em segundo plano (pré-geração de PDF, capas) gravam
 * enquanto o teste confere. Por isso a ordem das duas leituras importa, e um candidato a órfão só vale se continuar
 * sem linha depois de um tempo de assentamento.
 */
const SETTLE_ATTEMPTS = 6;
const SETTLE_DELAY_MS = 1_000;

async function stillUnreferenced(candidates: string[], prefix: string): Promise<string[]> {
  let pending = candidates;
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS && pending.length > 0; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY_MS));
    // Bucket antes do banco: quem já saiu do bucket ou já ganhou linha deixa de ser candidato.
    const present = new Set(await listObjects(prefix));
    const referenced = new Set(await referencedKeys());
    pending = pending.filter((key) => present.has(key) && !referenced.has(key));
  }
  return pending;
}

/** Invariante: nenhum objeto do bucket sem referência no banco. */
export async function expectNoOrphans(prefix: string = uploadsPrefix()): Promise<void> {
  const objects = await listObjects(prefix);
  const { orphans: candidates } = diffBucketAndRefs(objects, (await referencedKeys()).filter((k) => k.startsWith(prefix)));
  const orphans = await stillUnreferenced(candidates, prefix);
  if (orphans.length > 0) throw new Error(`Objetos órfãos no S3 (${orphans.length}): ${orphans.slice(0, 10).join(", ")}`);
}

/** Invariante: nenhuma referência do banco aponta para objeto inexistente. */
export async function expectNoBrokenRefs(prefix: string = uploadsPrefix()): Promise<void> {
  // Banco antes do bucket: toda linha lida aqui já teve o objeto gravado.
  const references = (await referencedKeys()).filter((k) => k.startsWith(prefix));
  const { broken } = diffBucketAndRefs(await listObjects(prefix), references);
  if (broken.length > 0) throw new Error(`Referências quebradas (${broken.length}): ${broken.slice(0, 10).join(", ")}`);
}

/**
 * Cenário que falha: o bucket não pode ter ganhado nenhum objeto SEM linha. (Objeto novo com linha é de um trabalho
 * em segundo plano; uma linha criada pelo próprio cenário que falhou é pega pelo retrato do banco.)
 */
export async function expectBucketUnchanged(before: string[]): Promise<void> {
  const added = await stillUnreferenced(addedKeys(before, await snapshotBucket()), uploadsPrefix());
  if (added.length > 0) throw new Error(`O cenário deixou objetos novos no bucket: ${added.join(", ")}`);
}
