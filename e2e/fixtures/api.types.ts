/**
 * Minimal mirrors of the API contracts the e2e suite needs. They are declared
 * here (and not imported from `src/`) on purpose: if a response contract drifts,
 * these fixtures should fail loudly instead of silently following the app types.
 */
export type ShelteredAddress = {
  id: string;
  street: string | null;
  number?: string;
  district: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  complement?: string;
};

export type Sheltered = {
  id: string;
  name: string;
  gender: "M" | "F";
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  joinedAt: string | null;
  active: boolean;
  shelter: { id: string; name: string } | null;
  address: ShelteredAddress | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

export type Paginated<TItem> = { data: TItem[]; meta: PaginationMeta };

export type ProfileShelter = { id: string; name: string };

export type ProfileTeam = { id: string; numberTeam?: number; shelter?: ProfileShelter | null };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "leader" | "member";
  active: boolean;
  completed: boolean;
  commonUser: boolean;
  leaderProfile?: { id: string; active: boolean; teams?: ProfileTeam[] } | null;
  memberProfile?: { id: string; active: boolean; team?: ProfileTeam | null } | null;
};

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  environment: string | null;
  targetRoles: Array<"admin" | "leader" | "member">;
  audience:
    | "EVERYONE"
    | "ADMIN"
    | "LEADER"
    | "MEMBER"
    | "ADMIN_LEADER"
    | "ADMIN_MEMBER"
    | "LEADER_MEMBER"
    | "ALL_ROLES";
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ShelterListItem = { id: string; name: string; leader: boolean };
