import type {
  AuthUser,
  FeatureFlag,
  Paginated,
  Sheltered,
  ShelterListItem,
} from "./api.types";

export const ADMIN_USER: AuthUser = {
  id: "admin-user-id",
  name: "Ana Administradora",
  email: "admin@orfanatonib.test",
  role: "admin",
  active: true,
  completed: true,
  commonUser: false,
};

export const LEADER_USER: AuthUser = {
  id: "leader-user-id",
  name: "Lucas Líder",
  email: "lider@orfanatonib.test",
  role: "leader",
  active: true,
  completed: true,
  commonUser: false,
  leaderProfile: {
    id: "leader-profile-id",
    active: true,
    teams: [{ id: "team-1", numberTeam: 1, shelter: { id: "shelter-1", name: "Abrigo Esperança" } }],
  },
};

export const MEMBER_USER: AuthUser = {
  id: "member-user-id",
  name: "Marta Membro",
  email: "membro@orfanatonib.test",
  role: "member",
  active: true,
  completed: true,
  commonUser: false,
  memberProfile: {
    id: "member-profile-id",
    active: true,
    team: { id: "team-2", numberTeam: 2, shelter: { id: "shelter-2", name: "Abrigo Bom Pastor" } },
  },
};

export const SHELTER_MANAGEMENT_FLAG: FeatureFlag = {
  id: "flag-shelter-management",
  key: "shelter-management",
  name: "Gestão de abrigos",
  description: "Habilita a gestão de abrigos e acolhidos",
  enabled: true,
  environment: "local",
  targetRoles: ["admin", "leader", "member"],
  audience: "ALL_ROLES",
  metadata: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const SHELTER_PAGELAS_FLAG: FeatureFlag = {
  id: "flag-shelter-pagelas",
  key: "shelter-pagelas",
  name: "Pagelas dos acolhidos",
  description: "Habilita a gestão de pagelas dos acolhidos",
  enabled: true,
  environment: "local",
  targetRoles: ["admin", "leader", "member"],
  audience: "ALL_ROLES",
  metadata: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const SHELTERS: ShelterListItem[] = [
  { id: "shelter-1", name: "Abrigo Esperança", leader: false },
  { id: "shelter-2", name: "Abrigo Bom Pastor", leader: false },
];

export const buildSheltered = (overrides: Partial<Sheltered> = {}): Sheltered => ({
  id: "sheltered-1",
  name: "Maria Silva",
  gender: "F",
  birthDate: "2015-04-02",
  guardianName: "Joana Silva",
  guardianPhone: "92999990000",
  joinedAt: "2024-08-01",
  active: true,
  shelter: { id: "shelter-1", name: "Abrigo Esperança" },
  address: {
    id: "address-1",
    street: "Rua das Flores",
    number: "100",
    district: "Centro",
    city: "Manaus",
    state: "AM",
    postalCode: "69000000",
    complement: "Apto 2",
  },
  createdAt: "2026-01-10T12:30:00.000Z",
  updatedAt: "2026-02-20T08:00:00.000Z",
  ...overrides,
});

export const SHELTERED_LIST: Sheltered[] = [
  buildSheltered(),
  buildSheltered({
    id: "sheltered-2",
    name: "João Pereira",
    gender: "M",
    birthDate: "2012-11-20",
    guardianName: "Carlos Pereira",
    guardianPhone: "92988887777",
    joinedAt: "2023-02-15",
    shelter: { id: "shelter-2", name: "Abrigo Bom Pastor" },
    address: null,
  }),
  buildSheltered({
    id: "sheltered-3",
    name: "Beatriz Souza",
    gender: "F",
    birthDate: "2018-06-05",
    guardianName: null,
    guardianPhone: null,
    joinedAt: null,
    shelter: null,
  }),
];

export const paginate = (
  items: Sheltered[],
  page = 1,
  limit = 12,
): Paginated<Sheltered> => ({
  data: items,
  meta: {
    page,
    limit,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
    orderBy: "updatedAt",
    order: "DESC",
  },
});
