import { apiManageMemberTeam, ManageMemberTeamDto } from "./api";
import { MemberProfile } from "./types";

export async function addMemberToShelter(
  memberId: string,
  shelterId: string,
  numberTeam: number       
): Promise<MemberProfile> {
  return apiManageMemberTeam(memberId, { shelterId, numberTeam });
}

