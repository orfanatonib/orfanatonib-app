import api from "@/config/axiosConfig";
import {
  CreateUserForm,
  UsersPage,
  UserRow,
  UpadateUserForm,
  ActiveFilter,
  CompletedFilter,
} from "./types";
import { UserRole } from "@/store/slices/auth/authSlice";

export async function apiListUsers(params: {
  page: number;
  limit: number;
  q?: string;
  role?: string;
  active?: ActiveFilter;
  completed?: CompletedFilter;
  sort?: string;
  order?: "ASC" | "DESC";
}): Promise<UsersPage> {
  const {
    page,
    limit,
    q,
    role,
    active,
    completed,
    sort = "updatedAt",
    order = "DESC",
  } = params;

  const { data } = await api.get<UsersPage>("/users", {
    params: {
      page,
      limit,
      q: q || undefined,
      role: role && role !== "all" ? role : undefined,
      active: active && active !== "all" ? active : undefined,
      completed: completed && completed !== "all" ? completed : undefined,
      sort,
      order,
    },
  });

  return data;
}

export type UserSimpleDto = { id: string; name: string; email: string };

export async function apiListUsersSimple(): Promise<UserSimpleDto[]> {
  const { data } = await api.get<UserSimpleDto[]>("/users/simple");
  return data;
}

export async function apiListUsersSimpleForSelect(): Promise<UserSimpleDto[]> {
  const { data } = await api.get<UserSimpleDto[]>("/users/simple-for-select");
  return data;
}

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  active: boolean;
  completed: boolean;
  commonUser: boolean;
  createdAt: string;
  updatedAt: string;
  memberProfile?: {
    id: string;
    active: boolean;
    team?: {
      id: string;
      numberTeam: number;
      description?: string;
      shelter?: {
        id: string;
        name: string;
        description?: string;
      } | null;
    } | null;
  } | null;
};

export async function apiGetUserProfile(id: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/users/${id}/profile`);
  return data;
}

export async function apiCreateUser(
  payload: Omit<CreateUserForm, "confirmPassword">
): Promise<UserRow> {
  const { name, email, password, phone, role } = payload;

  const { data } = await api.post<UserRow>("/users", {
    name,
    email,
    password,
    phone,
    role,
  });

  return data;
}

export async function apiUpdateUser(
  id: string,
  payload: UpadateUserForm
): Promise<UserRow> {
  const {
    name,
    role,
    phone,
    active,
    completed,
    commonUser,
    password,
  } = payload;  

  const { data } = await api.put<UserRow>(`/users/${id}`, {
    name,
    role,
    phone,
    active,
    completed,
    commonUser,
    password,
  });

  return data;
}

export async function apiDeleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
