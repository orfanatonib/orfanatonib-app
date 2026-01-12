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
  static async getShelters(filters: SheltersFilters = {}): Promise<SheltersResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 6, 
      sort: filters.sort || 'name',
      order: filters.order || 'ASC',
    };

    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }

    const response = await api.get('/shelters', { params });
    return response.data;
  }

  static async getSheltered(filters: ShelteredFilters = {}): Promise<ShelteredResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 6, 
      orderBy: filters.orderBy || 'name',
      order: filters.order || 'ASC',
    };

    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }
    if (filters.shelterId && filters.shelterId.trim()) {
      params.shelterId = filters.shelterId;
    }

    const response = await api.get('/sheltered', { params });
    return response.data;
  }

  static async getPagelas(filters: PagelasFilters = {}): Promise<PagelasResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 6, 
    };

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
