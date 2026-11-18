/**
 * Lógica **pura** do invariante de S3: o que o bucket tem × o que o banco
 * referencia. Fica separada do cliente para ser testada em unitário.
 */
export interface BucketDiff {
  /** Objetos no bucket que nenhuma linha referencia. */
  orphans: string[];
  /** Chaves referenciadas pelo banco que não existem no bucket. */
  broken: string[];
}

/** Extrai a chave do objeto de uma URL do bucket (path-style do LocalStack ou virtual-host da AWS). */
export function keyFromUrl(url: string, bucket: string): string | null {
  const virtual = url.split(`${bucket}.s3.amazonaws.com/`)[1];
  if (virtual) return virtual;
  const pathStyle = url.includes(`/${bucket}/`) ? url.split(`/${bucket}/`)[1] : undefined;
  return pathStyle || null;
}

export function diffBucketAndRefs(bucketKeys: Iterable<string>, referencedKeys: Iterable<string>): BucketDiff {
  const inBucket = new Set(bucketKeys);
  const referenced = new Set(referencedKeys);
  return {
    orphans: [...inBucket].filter((key) => !referenced.has(key)).sort(),
    broken: [...referenced].filter((key) => !inBucket.has(key)).sort(),
  };
}

/** Chaves que apareceram no bucket depois do `antes` (cenário que falha não pode deixar nada novo). */
export function addedKeys(before: Iterable<string>, after: Iterable<string>): string[] {
  const previous = new Set(before);
  return [...new Set(after)].filter((key) => !previous.has(key)).sort();
}
