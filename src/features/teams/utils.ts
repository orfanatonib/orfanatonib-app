import { apiGetTeam, apiUpdateTeam } from "./api";
import { TeamResponseDto, UpdateTeamDto } from "./types";

export async function addLeaderToTeam(teamId: string, leaderId: string): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentLeaderIds = team.leaders.map((l) => l.id);
  
  if (currentLeaderIds.includes(leaderId)) {
    return team;
  }
  
  const updatedLeaderIds = [...currentLeaderIds, leaderId];
  
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: updatedLeaderIds,
  });
}

export async function removeLeaderFromTeam(teamId: string, leaderId: string): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentLeaderIds = team.leaders.map((l) => l.id);
  
  if (!currentLeaderIds.includes(leaderId)) {
    return team;
  }
  
  const updatedLeaderIds = currentLeaderIds.filter((id) => id !== leaderId);
  
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: updatedLeaderIds,
  });
}

export async function addTeacherToTeam(teamId: string, teacherId: string): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentTeacherIds = team.teachers.map((t) => t.id);
  
  if (currentTeacherIds.includes(teacherId)) {
    return team;
  }
  
  const updatedTeacherIds = [...currentTeacherIds, teacherId];
  
  return await apiUpdateTeam(teamId, {
    teacherProfileIds: updatedTeacherIds,
  });
}

export async function removeTeacherFromTeam(teamId: string, teacherId: string): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentTeacherIds = team.teachers.map((t) => t.id);
  const updatedTeacherIds = currentTeacherIds.filter((id) => id !== teacherId);
  
  return await apiUpdateTeam(teamId, {
    teacherProfileIds: updatedTeacherIds,
  });
}

export async function addLeadersToTeam(teamId: string, leaderIds: string[]): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentLeaderIds = team.leaders.map((l) => l.id);
  const newLeaderIds = leaderIds.filter((id) => !currentLeaderIds.includes(id));
  const updatedLeaderIds = [...currentLeaderIds, ...newLeaderIds];
  
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: updatedLeaderIds,
  });
}

export async function addTeachersToTeam(teamId: string, teacherIds: string[]): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentTeacherIds = team.teachers.map((t) => t.id);
  const newTeacherIds = teacherIds.filter((id) => !currentTeacherIds.includes(id));
  const updatedTeacherIds = [...currentTeacherIds, ...newTeacherIds];
  
  return await apiUpdateTeam(teamId, {
    teacherProfileIds: updatedTeacherIds,
  });
}

export async function removeLeadersFromTeam(teamId: string, leaderIds: string[]): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentLeaderIds = team.leaders.map((l) => l.id);
  const updatedLeaderIds = currentLeaderIds.filter((id) => !leaderIds.includes(id));
  
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: updatedLeaderIds,
  });
}

export async function removeTeachersFromTeam(teamId: string, teacherIds: string[]): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentTeacherIds = team.teachers.map((t) => t.id);
  const updatedTeacherIds = currentTeacherIds.filter((id) => !teacherIds.includes(id));
  
  return await apiUpdateTeam(teamId, {
    teacherProfileIds: updatedTeacherIds,
  });
}

export async function replaceLeadersInTeam(teamId: string, leaderIds: string[]): Promise<TeamResponseDto> {
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: leaderIds,
  });
}

export async function replaceTeachersInTeam(teamId: string, teacherIds: string[]): Promise<TeamResponseDto> {
  return await apiUpdateTeam(teamId, {
    teacherProfileIds: teacherIds,
  });
}

export async function clearTeam(teamId: string): Promise<TeamResponseDto> {
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: [],
    teacherProfileIds: [],
  });
}

