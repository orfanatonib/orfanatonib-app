export type IntegrationImage = {
  id: string;
  title: string;
  description: string;
  url: string;
  uploadType: string;
  mediaType: string;
  isLocalFile: boolean;
  platformType?: string;
  originalName?: string;
  size?: number;
};

export type IntegrationResponseDto = {
  id: string;
  name?: string;
  phone?: string;
  gaLeader?: string;
  baptized?: boolean;
  churchYears?: number;
  previousMinistry?: string;
  integrationYear?: number;
  image?: IntegrationImage | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponseDto<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type QueryIntegrationDto = {
  page?: number;
  limit?: number;
  search?: string;
  integrationYear?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export type CreateIntegrationDto = {
  name?: string;
  phone?: string;
  gaLeader?: string;
  baptized?: boolean;
  churchYears?: number;
  previousMinistry?: string;
  integrationYear?: number;
  media?: {
    title?: string;
    description?: string;
  };
};

export type UpdateIntegrationDto = {
  name?: string;
  phone?: string;
  gaLeader?: string;
  baptized?: boolean;
  churchYears?: number;
  previousMinistry?: string;
  integrationYear?: number;
  media?: {
    id?: string;
    title?: string;
    description?: string;
  };
};

export type IntegrationFilters = QueryIntegrationDto;
