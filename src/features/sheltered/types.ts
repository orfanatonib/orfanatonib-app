export type ShelteredListItemDto = {
  id: string;
  name: string;
  guardianName: string;
  guardianPhone: string;
  shelterId: string | null;
};

export type ShelteredResponseDto = {
  id: string;
  name: string;
  gender: "M" | "F";
  guardianName: string;
  guardianPhone: string;
  birthDate?: string | null;
  joinedAt: string | null;
  active: boolean;
  acceptedChrists: AcceptedChristShortDto[];
  shelter: { id: string; name: string } | null;
  address: {
    id: string;
    street?: string | null;
    number?: string | null;
    district?: string | null;
    city: string;
    state: string;
    postalCode?: string | null;
    complement?: string | null;
  } | null;
  pagelas?: Array<{
    id: string;
    year: number;
    visit: number;
    referenceDate: string;
    present: boolean;
    notes: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

import type { AcceptedChristShortDto } from "@/features/accepted-christs/types";

export type { AcceptedChristShortDto };

export type ShelteredSimpleResponseDto = {
  id: string;
  name: string;
  guardianName: string | null;
  gender: "M" | "F";
  guardianPhone: string | null;
  shelterId: string | null;
  active: boolean;
  acceptedChrists: AcceptedChristShortDto[];
};

export type Paginated<T> = {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    orderBy: string;
    order: 'ASC' | 'DESC';
  };
  total?: number;
  page?: number;
  limit?: number;
  pageCount?: number;
};

export type ShelteredFilters = {
  shelteredSearchingString?: string;
  shelterSearchingString?: string;
  addressFilter?: string;
  gender?: "M" | "F";
  birthDateFrom?: string;
  birthDateTo?: string;
  joinedFrom?: string;
  joinedTo?: string;
  searchString?: string;
  shelterId?: string;
  shelterName?: string;
  city?: string;
  state?: string;
  birthDate?: string;
  joinedAt?: string;
};

export type ShelteredSort =
  | { id: 'name' | 'birthDate' | 'joinedAt' | 'createdAt' | 'updatedAt'; desc: boolean }
  | null;

export type CreateShelteredForm = {
  name: string;
  gender: "M" | "F";
  guardianName: string;
  guardianPhone: string;
  birthDate?: string | null;
  joinedAt?: string | null;
  shelterId?: string | null;
  address?: {
    street?: string | null;
    number?: string | null;
    district?: string | null;
    city: string;
    state: string;
    postalCode?: string | null;
    complement?: string | null;
  } | null;
};

export type EditShelteredForm = Partial<CreateShelteredForm> & { id: string };
