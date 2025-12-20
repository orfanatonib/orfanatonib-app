import api from '@/config/axiosConfig';
import type {
  SheltersResponse,
  ShelteredResponse,
  PagelasResponse,
  SheltersFilters,
  ShelteredFilters,
  PagelasFilters,
} from './types';

export class PagelaSheltersApi {
  // Endpoint 1: GET /shelters
  static async getShelters(filters: SheltersFilters = {}): Promise<SheltersResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 6, // Shelters: 6 itens
      sort: filters.sort || 'name',
      order: filters.order || 'ASC',
    };

    // Só adiciona parâmetros se tiverem valores
    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }

    const response = await api.get('/shelters', { params });
    return response.data;
  }

  // Endpoint 2: GET /sheltered
  static async getSheltered(filters: ShelteredFilters = {}): Promise<ShelteredResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 6, // Sheltered: 6 itens
      orderBy: filters.orderBy || 'name',
      order: filters.order || 'ASC',
    };

    // Só adiciona parâmetros se tiverem valores
    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }
    if (filters.shelterId && filters.shelterId.trim()) {
      params.shelterId = filters.shelterId;
    }

    const response = await api.get('/sheltered', { params });
    return response.data;
  }

  // Endpoint 3: GET /pagelas/paginated
  static async getPagelas(filters: PagelasFilters = {}): Promise<PagelasResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 6, // Padrão: 6 itens (máximo: 200)
    };

    // Só adiciona parâmetros se tiverem valores
    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }
    if (filters.shelteredId && filters.shelteredId.trim()) {
      params.shelteredId = filters.shelteredId;
    }

    const response = await api.get('/pagelas/paginated', { params });
    return response.data;
  }
}
