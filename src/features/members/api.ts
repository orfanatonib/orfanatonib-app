import api from "@/config/axiosConfig";
import { MemberProfile, Page, MemberQuery, MemberSimpleListDto } from "./types";

export async function apiListMembers(params: MemberQuery, signal?: AbortSignal) {
  const { data } = await api.get<Page<MemberProfile>>("/member-profiles", { params, signal });
  return data;
}

export async function apiListMembersSimple() {
  const { data } = await api.get<MemberSimpleListDto[]>("/member-profiles/simple");
  return data;
}

export type ManageMemberTeamDto = {
  shelterId: string;    
  numberTeam: number;   
};

export async function apiManageMemberTeam(memberId: string, payload: ManageMemberTeamDto) {
  const { data } = await api.put<MemberProfile>(`/member-profiles/${memberId}`, payload);
  return data;
}
