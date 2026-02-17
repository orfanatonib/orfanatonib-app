export type AttendableType = "integration" | "user";

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
  pdf?: AtendentePdf;
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

export type QueryAtendenteDto = {
  page?: number;
  limit?: number;
  search?: string;
  attendableType?: AttendableType;
};

export type CreateAtendenteDto = {
  name?: string;
  attendableType?: AttendableType | null;
  attendableId?: string | null;
  pdf: {
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
  pdf?: {
    title?: string;
    description?: string;
    uploadType?: string;
    mediaType?: string;
    isLocalFile?: boolean;
    url?: string;
    fieldKey?: string;
  };
};

export type AtendenteFilters = {
  search?: string;
  attendableType?: AttendableType;
};
