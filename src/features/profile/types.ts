import { UserRole } from "@/store/slices/auth/authSlice";

export type ProfileImage = {
  id: string;
  title: string;
  description: string;
  url: string;
  uploadType: string;
  mediaType: string;
  isLocalFile: boolean;
  platformType: string | null;
  originalName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
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
  image: ProfileImage | null;
  teacherProfile?: {
    id: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    team?: {
      id: string;
      numberTeam: number;
      description: string | null;
      createdAt: string;
      updatedAt: string;
      shelter?: {
        id: string;
        name: string;
        description: string;
        teamsQuantity: number;
        createdAt: string;
        updatedAt: string;
        address?: {
          id: string;
          street: string;
          number: string;
          district: string;
          city: string;
          state: string;
          postalCode: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    };
  } | null;
  leaderProfile?: any | null;
};

export type UpdateProfileDto = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ChangePasswordDto = {
  currentPassword?: string;
  newPassword: string;
};

export type UpdateProfileImageDto = {
  uploadType: 'UPLOAD' | 'LINK';
  url?: string;
  title?: string;
  description?: string;
  isLocalFile?: boolean;
};

