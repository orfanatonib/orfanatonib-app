/** Categoria de arquivo aceita pela API (`MediaType`). */
export type UploadKind = 'image' | 'video' | 'document' | 'audio';

/** Política de upload de uma categoria: espelha `MEDIA_UPLOAD_POLICIES` da API. */
export interface UploadPolicy {
  maxBytes: number;
  /** MIME aceito (a API também confere a assinatura dos bytes). */
  mimeTypes: readonly string[];
  /** Nome da categoria para a mensagem ao usuário. */
  label: string;
}

/** Por que o arquivo foi recusado antes do envio. */
export type UploadRejection = 'empty' | 'type' | 'size';

export type UploadValidation =
  | { ok: true }
  | { ok: false; reason: UploadRejection; message: string };

/** O mínimo de `File` que a validação lê (permite testar sem DOM). */
export interface UploadFileLike {
  name: string;
  type: string;
  size: number;
}
