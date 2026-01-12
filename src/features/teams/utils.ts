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

export async function addMemberToTeam(teamId: string, memberId: string): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentMemberIds = team.members.map((t) => t.id);
  
  if (currentMemberIds.includes(memberId)) {
    return team;
  }
  
  const updatedMemberIds = [...currentMemberIds, memberId];
  
  return await apiUpdateTeam(teamId, {
    memberProfileIds: updatedMemberIds,
  });
}

export async function removeMemberFromTeam(teamId: string, memberId: string): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentMemberIds = team.members.map((t) => t.id);
  const updatedMemberIds = currentMemberIds.filter((id) => id !== memberId);
  
  return await apiUpdateTeam(teamId, {
    memberProfileIds: updatedMemberIds,
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

export async function addMembersToTeam(teamId: string, memberIds: string[]): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentMemberIds = team.members.map((t) => t.id);
  const newMemberIds = memberIds.filter((id) => !currentMemberIds.includes(id));
  const updatedMemberIds = [...currentMemberIds, ...newMemberIds];
  
  return await apiUpdateTeam(teamId, {
    memberProfileIds: updatedMemberIds,
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

export async function removeMembersFromTeam(teamId: string, memberIds: string[]): Promise<TeamResponseDto> {
  const team = await apiGetTeam(teamId);
  const currentMemberIds = team.members.map((t) => t.id);
  const updatedMemberIds = currentMemberIds.filter((id) => !memberIds.includes(id));
  
  return await apiUpdateTeam(teamId, {
    memberProfileIds: updatedMemberIds,
  });
}

export async function replaceLeadersInTeam(teamId: string, leaderIds: string[]): Promise<TeamResponseDto> {
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: leaderIds,
  });
}

export async function replaceMembersInTeam(teamId: string, memberIds: string[]): Promise<TeamResponseDto> {
  return await apiUpdateTeam(teamId, {
    memberProfileIds: memberIds,
  });
}

export async function clearTeam(teamId: string): Promise<TeamResponseDto> {
  return await apiUpdateTeam(teamId, {
    leaderProfileIds: [],
    memberProfileIds: [],
  });
}

