import api from "@/config/axiosConfig";
import { MemberProfile, ShelterSimple, Page, MemberQuery, MemberSimpleListDto } from "./types";

export async function apiListMembers(params: MemberQuery) {
  const { data } = await api.get<Page<MemberProfile>>("/member-profiles", { params });
  return data;
}

export async function apiGetMember(memberId: string) {
  const { data } = await api.get<MemberProfile>(`/member-profiles/${memberId}`);
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

export async function apiListSheltersSimple() {
  const { data } = await api.get<ShelterSimple[]>("/shelters/simple");
  return data;
}
