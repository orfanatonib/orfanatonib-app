import { UserPublicDto } from "../shelters/types";

export type TeamResponseDto = {
  id: string;
  numberTeam: number;
  description?: string | null;
  shelterId: string;
  shelter?: {
    id: string;
    name: string;
  };
  leaders: Array<{
    id: string;
    active: boolean;
    user: UserPublicDto;
  }>;
  members: Array<{
    id: string;
    active: boolean;
    user: UserPublicDto;
  }>;
  createdAt: string;
  updatedAt: string;
  isLeaderInTeam?: boolean;
};

export type TeamWithMembersDto = TeamResponseDto;

export type CreateTeamDto = {
  numberTeam: number;
  description?: string;
  shelterId: string;
  leaderProfileIds?: string[];
  memberProfileIds?: string[];
};

export type UpdateTeamDto = {
  numberTeam?: number;
  description?: string;
  leaderProfileIds?: string[];
  memberProfileIds?: string[];
};

export type TeamSimpleDto = {
  id: string;
  numberTeam: number;
  description?: string | null;
  shelterId: string;
  createdAt: string;
  updatedAt: string;
};

