export type AttendableType = "integration" | "user";

/** Situação dos PDFs, na forma que a API recebe em `documents`. */
export enum AtendenteDocumentsFilter {
  COMPLETE = "complete",
  ONLY_ESTADUAL = "only_estadual",
  ONLY_FEDERAL = "only_federal",
}

export type PdfScope = "estadual" | "federal";

export type AtendentePdf = {
  id?: string;
  title: string;
  description: string;
  url?: string;
  uploadType: string;
  mediaType: string;
  isLocalFile: boolean;
  platformType?: string;
  originalName?: string;
  size?: number;
};

export type AtendenteResponseDto = {
  id: string;
  name?: string;
  attendableType?: AttendableType | null;
  attendableId?: string | null;
  attendableDisplayName?: string;
  pdfEstadual?: AtendentePdf;
  pdfFederal?: AtendentePdf;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedAtendenteResponseDto = {
  data: AtendenteResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateAtendenteDto = {
  name?: string;
  attendableType?: AttendableType | null;
  attendableId?: string | null;
  pdfEstadual?: {
    title?: string;
    description?: string;
    uploadType: string;
    mediaType: string;
    isLocalFile: boolean;
    url?: string;
    fieldKey?: string;
  };
  pdfFederal?: {
    title?: string;
    description?: string;
    uploadType: string;
    mediaType: string;
    isLocalFile: boolean;
    url?: string;
    fieldKey?: string;
  };
};

export type UpdateAtendenteDto = {
  name?: string;
  attendableType?: AttendableType | null;
  attendableId?: string | null;
  pdfEstadual?: {
    title?: string;
    description?: string;
    uploadType?: string;
    mediaType?: string;
    isLocalFile?: boolean;
    url?: string;
    fieldKey?: string;
  };
  pdfFederal?: {
    title?: string;
    description?: string;
    uploadType?: string;
    mediaType?: string;
    isLocalFile?: boolean;
    url?: string;
    fieldKey?: string;
  };
  removePdfEstadual?: boolean;
  removePdfFederal?: boolean;
};

export type AtendenteFiles = {
  estadual?: File;
  federal?: File;
};
