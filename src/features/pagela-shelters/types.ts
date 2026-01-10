
export interface ShelterDto {
  id: string;
  name: string;
  description?: string | null;
  teamsQuantity?: number | null;
  address: {
    id: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    complement?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  teams?: Array<{
    id: string;
    numberTeam: number;
    description?: string | null;
    leaders: Array<{
      id: string;
      active: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        active: boolean;
        completed: boolean;
        commonUser: boolean;
      };
    }>;
    teachers: Array<{
      id: string;
      active: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        active: boolean;
        completed: boolean;
        commonUser: boolean;
      };
    }>;
  }>;
  leaders: Array<{
    id: string;
    active: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      active: boolean;
      completed: boolean;
      commonUser: boolean;
    };
  }>;
  teachers: Array<{
    id: string;
    active: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      active: boolean;
      completed: boolean;
      commonUser: boolean;
    };
  }>;
  mediaItem?: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShelteredDto {
  id: string;
  name: string;
  birthDate?: string | null;
  guardianName?: string | null;
  gender: string;
  guardianPhone?: string | null;
  joinedAt: string;
  shelter: {
    id: string;
    name: string;
  };
  address: {
    id: string;
    street?: string | null;
    number?: string | null;
    district?: string | null;
    city: string;
    state: string;
    postalCode?: string | null;
    complement?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PagelaDto {
  id: string;
  year: number;
  visit: number;
  present: boolean;
  notes?: string;
  referenceDate: string;
  sheltered: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    active: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      active: boolean;
      completed: boolean;
      commonUser: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface SheltersResponse {
  items: ShelterDto[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface ShelteredResponse {
  data: ShelteredDto[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    orderBy: string;
    order: string;
  };
}

export interface PagelasResponse {
  items: PagelaDto[];
  total: number;
  page: number;
  limit: number;
}

export interface SheltersFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  searchString?: string;
}

export interface ShelteredFilters {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
  searchString?: string;
  shelterId?: string;
}

export interface PagelasFilters {
  page?: number;
  limit?: number;
  searchString?: string;
  shelteredId?: string;
}
