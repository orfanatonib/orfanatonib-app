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
 * URL de arquivo precisa entrar aqui (há teste de arquitetura na API que varre
 * as entidades e compara com esta lista).
 */
export const MEDIA_URL_COLUMNS: ReadonlyArray<{ table: string; column: string }> = [
  { table: "media_items", column: "url" },
  { table: "routes", column: "image" },
];

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    const { endpoint, region, accessKeyId, secretAccessKey } = s3Config();
    client = new S3Client({ endpoint, region, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  }
  return client;
}

/** Prefixo do ambiente usado pela API: `<ENVIRONMENT>/uploads/`. */
export function uploadsPrefix(): string {
  return `${s3Config().environmentPrefix}/uploads/`;
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

export async function referencedKeys(): Promise<string[]> {
  const { bucket } = s3Config();
  const keys = new Set<string>();
  for (const { table, column } of MEDIA_URL_COLUMNS) {
    const rows = await queryAll<{ url: string | null }>(`SELECT \`${column}\` AS url FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`);
    for (const row of rows) {
      const key = row.url ? keyFromUrl(row.url, bucket) : null;
      if (key) keys.add(key);
    }
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

/** Invariante: nenhum objeto do bucket sem referência no banco. */
export async function expectNoOrphans(prefix: string = uploadsPrefix()): Promise<void> {
  const { orphans } = diffBucketAndRefs(await listObjects(prefix), (await referencedKeys()).filter((k) => k.startsWith(prefix)));
  if (orphans.length > 0) throw new Error(`Objetos órfãos no S3 (${orphans.length}): ${orphans.slice(0, 10).join(", ")}`);
}

/** Invariante: nenhuma referência do banco aponta para objeto inexistente. */
export async function expectNoBrokenRefs(prefix: string = uploadsPrefix()): Promise<void> {
  const { broken } = diffBucketAndRefs(await listObjects(prefix), (await referencedKeys()).filter((k) => k.startsWith(prefix)));
  if (broken.length > 0) throw new Error(`Referências quebradas (${broken.length}): ${broken.slice(0, 10).join(", ")}`);
}

/** Cenário que falha: o bucket não pode ter ganhado nenhum objeto. */
export async function expectBucketUnchanged(before: string[]): Promise<void> {
  const added = addedKeys(before, await snapshotBucket());
  if (added.length > 0) throw new Error(`O cenário deixou objetos novos no bucket: ${added.join(", ")}`);
}
