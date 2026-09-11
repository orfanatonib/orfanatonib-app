import type { AcceptedChristShortDto } from "@/features/accepted-christs/types";
import type { RootState } from "@/store/slices";
import type {
  AcceptedJesusFilter,
  ShelteredActiveFilter,
  ShelteredGender,
  ShelteredOrderBy,
  SortOrder,
} from "./enums";

export type { AcceptedChristShortDto };

/** Mirrors `ShelteredAddressResponseDto` in the API. */
export type ShelteredAddressResponseDto = {
  id: string;
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  complement?: string | null;
};

export type ShelteredShelterResponseDto = {
  id: string;
  name: string;
};

/** Mirrors `ShelteredResponseDto` in the API. */
export type ShelteredResponseDto = {
  id: string;
  name: string;
  gender: ShelteredGender;
  birthDate: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  joinedAt: string | null;
  active: boolean;
  shelter: ShelteredShelterResponseDto | null;
  address: ShelteredAddressResponseDto | null;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `ShelteredListItemDto` returned by `GET /sheltered/simple`. */
export type ShelteredSimpleResponseDto = {
  id: string;
  name: string;
  guardianName?: string | null;
  gender: ShelteredGender;
  guardianPhone?: string | null;
  shelterId: string | null;
  active: boolean;
  acceptedChrists: AcceptedChristShortDto[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  orderBy?: ShelteredOrderBy;
  order?: SortOrder;
};

export type Paginated<TItem> = {
  data: TItem[];
  meta: PaginationMeta;
};

/** Exactly the filters accepted by `GET /sheltered`. */
export type ShelteredFilters = {
  searchString?: string;
  shelterSearchingString?: string;
  addressFilter?: string;
  shelterId?: string;
  gender?: ShelteredGender;
  birthDateFrom?: string;
  birthDateTo?: string;
  joinedFrom?: string;
  joinedTo?: string;
};

export type ShelteredSort = {
  id: ShelteredOrderBy;
  desc: boolean;
};

export type ShelteredListParams = {
  page: number;
  limit: number;
  filters?: ShelteredFilters;
  sort?: ShelteredSort | null;
};

export type ShelteredSimpleParams = {
  page?: number;
  limit?: number;
  searchString?: string;
  acceptedJesus?: AcceptedJesusFilter;
  active?: ShelteredActiveFilter;
};

/** Address payload sent on create/update. */
export type ShelteredAddressForm = {
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  complement?: string | null;
};

export type CreateShelteredForm = {
  name: string;
  gender: ShelteredGender;
  guardianName?: string | null;
  guardianPhone?: string | null;
  birthDate?: string | null;
  joinedAt?: string | null;
  shelterId?: string | null;
  address?: ShelteredAddressForm | null;
};

export type EditShelteredForm = Partial<CreateShelteredForm> & { id: string };

/** Union handled by the form dialog, which serves both modes. */
export type ShelteredFormValue = CreateShelteredForm | EditShelteredForm;

export type ShelterOption = {
  id: string;
  name: string;
};

/** Authenticated user as stored in Redux; the form dialog reads its profiles. */
export type AuthUser = NonNullable<RootState["auth"]["user"]>;
