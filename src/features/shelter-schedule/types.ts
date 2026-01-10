// Types para o módulo de Agendamento de Abrigos (Shelter Schedule)

export interface ShelterScheduleAddress {
  street?: string;
  number?: string;
  district?: string;
  city: string;
  state: string;
  postalCode?: string;
  complement?: string;
}

export interface ShelterScheduleTeam {
  id: string;
  numberTeam: number;
  description?: string;
}

export interface ShelterScheduleShelter {
  id: string;
  name: string;
  description?: string;
  address?: ShelterScheduleAddress;
  team: ShelterScheduleTeam;
}

export interface ShelterScheduleResponseDto {
  id: string;
  visitNumber: number;
  visitDate?: string;
  meetingDate?: string;
  lessonContent: string;
  observation?: string;
  meetingRoom?: string;
  shelter: ShelterScheduleShelter;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShelterScheduleDto {
  visitNumber: number;
  teamId: string;
  visitDate?: string;
  meetingDate?: string;
  lessonContent: string;
  observation?: string;
  meetingRoom?: string;
}

export interface UpdateShelterScheduleDto {
  visitNumber?: number;
  teamId?: string;
  visitDate?: string;
  meetingDate?: string;
  lessonContent?: string;
  observation?: string;
  meetingRoom?: string;
}

// Tipo para a equipe retornada pelo endpoint /teams/my-teams
export interface MyTeamResponseDto {
  id: string;
  numberTeam: number;
  description?: string;
  shelterId: string;
  shelter: {
    id: string;
    name: string;
    description?: string;
    address?: ShelterScheduleAddress;
  };
  leaders: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
