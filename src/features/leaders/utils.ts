import { apiManageLeaderTeam, ManageLeaderTeamDto } from "./api";
import { LeaderProfile } from "./types";

export async function addLeaderToShelter(
  leaderId: string,
  shelterId: string,
  numberTeam: number       
): Promise<LeaderProfile> {
  return apiManageLeaderTeam(leaderId, { shelterId, numberTeam });
}
