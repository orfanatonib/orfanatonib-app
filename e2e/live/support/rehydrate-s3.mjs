/**
 * O LocalStack community NÃO persiste o S3: reiniciar o container esvazia o bucket enquanto o MySQL mantém a massa
 * acumulada, e todas as invariantes "sem referência quebrada" passam a falhar. Este script repõe um objeto
 * de enchimento para cada referência PERDIDA, sem tocar no banco.
 *
 * Nunca roda sozinho (mascararia defeito real): é manual, só contra a máquina local e exige o instante em que o
 * LocalStack subiu. Referência quebrada criada DEPOIS dele não é reposta: é listada como suspeita de defeito.
 *
 *   node e2e/live/support/rehydrate-s3.mjs --before="$(docker inspect orfanato-localstack --format '{{.State.StartedAt}}')"
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import mysql from "mysql2/promise";

const before = new Date(process.argv.find((arg) => arg.startsWith("--before="))?.slice("--before=".length) ?? "");
if (Number.isNaN(before.getTime())) throw new Error("Informe --before=<ISO do início do LocalStack>.");

const envFile = resolve(process.cwd(), "../orfanatonib-api/env/local.env");
if (!existsSync(envFile)) throw new Error(`Env local da API não encontrado: ${envFile}`);
const env = Object.fromEntries(
  [...readFileSync(envFile, "utf8").matchAll(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/gm)].map((m) => [m[1], m[2]]),
);

const endpoint = env.AWS_S3_ENDPOINT ?? "http://localhost:4566";
for (const host of [new URL(endpoint).hostname, env.DB_HOST]) {
  if (!["localhost", "127.0.0.1"].includes(host)) throw new Error(`Só roda na máquina local (recusado: ${host}).`);
}

const bucket = env.AWS_S3_BUCKET_NAME;
const prefix = `${env.ENVIRONMENT ?? "local"}/`;
const s3 = new S3Client({
  endpoint,
  region: env.AWS_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
});

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const bodyFor = (key) => {
  if (/\.(png|jpe?g|webp|gif)$/i.test(key)) return [PNG, "image/png"];
  if (/\.pdf$/i.test(key)) return [PDF, "application/pdf"];
  return [Buffer.from("objeto reposto pelo E2E"), "application/octet-stream"];
};

/** Mesmas colunas de `s3.ts` (MEDIA_URL_COLUMNS / MEDIA_KEY_COLUMNS). */
const URL_COLUMNS = [
  ["media_items", "url"],
  ["routes", "image"],
  ["content_packages", "coverImageUrl"],
];
const KEY_COLUMNS = [["content_assets", "storageKey"]];

const keyFromUrl = (url) =>
  url.split(`${bucket}.s3.amazonaws.com/`)[1] ?? (url.includes(`/${bucket}/`) ? url.split(`/${bucket}/`)[1] : null);

const present = new Set();
let token;
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
  for (const item of page.Contents ?? []) present.add(item.Key);
  token = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (token);

const db = await mysql.createConnection({
  host: env.DB_HOST,
  port: Number(env.DB_PORT ?? 3306),
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

/** chave -> true quando ALGUMA linha anterior ao reinício a referencia. */
const lost = new Map();
for (const [columns, toKey] of [
  [URL_COLUMNS, keyFromUrl],
  [KEY_COLUMNS, (value) => value],
]) {
  for (const [table, column] of columns) {
    const [rows] = await db.query(
      `SELECT \`${column}\` AS value, UNIX_TIMESTAMP(createdAt) AS created FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`,
    );
    for (const row of rows) {
      const key = toKey(row.value);
      if (!key || !key.startsWith(prefix) || present.has(key)) continue;
      lost.set(key, lost.get(key) === true || Number(row.created) * 1000 < before.getTime());
    }
  }
}
await db.end();

const restore = [...lost].filter(([, old]) => old).map(([key]) => key);
const suspicious = [...lost].filter(([, old]) => !old).map(([key]) => key);
for (let index = 0; index < restore.length; index += 8) {
  await Promise.all(
    restore.slice(index, index + 8).map((Key) => {
      const [Body, ContentType] = bodyFor(Key);
      return s3.send(new PutObjectCommand({ Bucket: bucket, Key, Body, ContentType }));
    }),
  );
}

console.log(`Repostos: ${restore.length}. Suspeitos (criados depois de ${before.toISOString()}): ${suspicious.length}`);
for (const key of suspicious) console.log(`  ${key}`);
