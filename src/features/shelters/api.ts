import api from "@/config/axiosConfig";
import {
  ShelterResponseDto, CreateShelterForm, EditShelterForm,
  LeaderMiniDto, MemberOption, UserPublicDto,
  ShelterFilters, ShelterSort,
  LeaderOption, SimpleShelterResponseDto, ShelterListResponseDto, ShelterSimpleResponseDto
} from "./types";
import { LeaderProfile } from "../leaders/types";
import { MemberProfile } from "../members/types";
import { apiListMembersSimple, apiListMembers } from "../members/api";

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export async function apiFetchShelters(args: {
  page: number;
  limit: number;
  filters?: ShelterFilters;
  sort?: ShelterSort;
}) {
  const { page, limit, filters, sort } = args;
  const {
    shelterName,
    staffFilters,
    addressFilter,
    teamId,
    teamName,
    leaderId,
    searchString,
    nameSearchString,
  } = filters || {};

  const sortField = sort?.id ?? "name";
  const order = sort?.desc ? "DESC" : "ASC";

  const params: Record<string, string | number> = {
    page,
    limit,
    sort: sortField,
    order,
  };

  if (shelterName) {
    params.shelterName = shelterName;
  } else if (nameSearchString) {
    params.shelterName = nameSearchString;
  }

  if (staffFilters) {
    params.staffFilters = staffFilters;
  }

  if (addressFilter) {
    params.addressFilter = addressFilter;
  }

  if (teamId) {
    params.teamId = teamId;
  }

  if (teamName) {
    params.teamName = teamName;
  }

  if (leaderId) {
    params.leaderId = leaderId;
  }

  if (searchString && !shelterName && !nameSearchString) {
    params.searchString = searchString;
  }

  const { data } = await api.get<PaginatedResponse<ShelterResponseDto>>("/shelters", {
    params,
  });
  return data;
}

export async function apiFetchSheltersSimple() {
  const { data } = await api.get<ShelterSimpleResponseDto[]>("/shelters/simple");
  return data;
}

export async function apiFetchSheltersList() {
  const { data } = await api.get<SimpleShelterResponseDto[]>("/shelters/list");
  return data;
}

export async function apiFetchShelter(id: string) {
  const { data } = await api.get<ShelterResponseDto>(`/shelters/${id}`);
  return data;
}

export async function apiCreateShelter(payload: CreateShelterForm | FormData) {
  if (payload instanceof FormData) {
    const { data } = await api.post<ShelterResponseDto>("/shelters", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  }

  if (payload.file) {
    const formData = new FormData();

    const shelterData: Record<string, unknown> = {
      name: payload.name,
      description: payload.description,
      teamsQuantity: payload.teamsQuantity,
      address: payload.address,
      mediaItem: payload.mediaItem ? {
        uploadType: "upload",
        isLocalFile: true,
        fieldKey: "image",
        title: payload.mediaItem.title || "Foto do Abrigo",
        description: payload.mediaItem.description || "Imagem do abrigo",
      } : undefined,
    };

    if (payload.teams && Array.isArray(payload.teams) && payload.teams.length > 0) {
      shelterData.teams = payload.teams;
    }

    formData.append("shelterData", JSON.stringify(shelterData));
    formData.append("image", payload.file);

    const { data } = await api.post<ShelterResponseDto>("/shelters", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } else {
    const { file, ...rest } = payload;
    const body: Record<string, unknown> = { ...rest };

    if (rest.mediaItem && rest.mediaItem.url) {
      body.mediaItem = {
        uploadType: "link",
        isLocalFile: false,
        url: rest.mediaItem.url,
        title: rest.mediaItem.title || "Foto do Abrigo",
        description: rest.mediaItem.description || "Imagem do abrigo",
      };
    } else if (rest.mediaItem && !rest.mediaItem.url) {
      delete body.mediaItem;
    }

    if (rest.teams && Array.isArray(rest.teams) && rest.teams.length === 0) {
      delete body.teams;
    }

    const { data } = await api.post<ShelterResponseDto>("/shelters", body);
    return data;
  }
}

export async function apiUpdateShelter(id: string, payload: Omit<EditShelterForm, "id"> | FormData) {
  if (payload instanceof FormData) {
    const { data } = await api.put<ShelterResponseDto>(`/shelters/${id}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  }

  if (payload.file) {
    const formData = new FormData();

    const shelterData: Record<string, unknown> = {
      name: payload.name,
      description: payload.description,
      teamsQuantity: payload.teamsQuantity,
      address: payload.address,
      mediaItem: payload.mediaItem ? {
        title: payload.mediaItem.title || "Foto do Abrigo",
        description: payload.mediaItem.description || "Imagem do abrigo",
        uploadType: payload.mediaItem.uploadType === "upload" ? "UPLOAD" : "LINK",
        url: payload.mediaItem.url,
      } : undefined,
    };

    if (payload.teams) {
      shelterData.teams = payload.teams;
    }

    formData.append("shelterData", JSON.stringify(shelterData));
    formData.append("image", payload.file);

    const { data } = await api.put<ShelterResponseDto>(`/shelters/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } else {
    const { file, ...rest } = payload;
    const payloadJson: Record<string, unknown> = {
      name: rest.name,
      description: rest.description,
      teamsQuantity: rest.teamsQuantity,
      address: rest.address,
    };

    if (rest.teams) {
      payloadJson.teams = rest.teams;
    }

    if (rest.mediaItem && rest.mediaItem.uploadType === "link" && rest.mediaItem.url) {
      payloadJson.mediaItem = {
        title: rest.mediaItem.title || "Foto do Abrigo",
        description: rest.mediaItem.description || "Imagem do abrigo",
        uploadType: "LINK",
        url: rest.mediaItem.url,
      };
    }

    const { data } = await api.put<ShelterResponseDto>(`/shelters/${id}`, payloadJson);
    return data;
  }
}

export async function apiUpdateShelterMedia(
  id: string,
  payload: {
    mediaItem?: {
      title?: string;
      description?: string;
      uploadType: "upload" | "link";
      url?: string;
    };
    file?: File;
  }
) {
  if (payload.file) {
    const formData = new FormData();

    const mediaData = {
      title: payload.mediaItem?.title || "Foto do Abrigo",
      description: payload.mediaItem?.description || "Imagem do abrigo",
      uploadType: "UPLOAD",
    };

    formData.append("mediaData", JSON.stringify(mediaData));
    formData.append("image", payload.file);

    const { data } = await api.patch<ShelterResponseDto>(`/shelters/${id}/media`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } else {
    const { data } = await api.patch<ShelterResponseDto>(`/shelters/${id}/media`, {
      title: payload.mediaItem?.title || "Foto do Abrigo",
      description: payload.mediaItem?.description || "Imagem do abrigo",
      uploadType: payload.mediaItem?.uploadType === "link" ? "LINK" : "UPLOAD",
      url: payload.mediaItem?.url,
    });
    return data;
  }
}

export async function apiGetShelterTeamsQuantity(id: string) {
  const { data } = await api.get<{ id: string; teamsQuantity: number }>(`/shelters/${id}/teams-quantity`);
  return data;
}

export async function apiDeleteShelter(id: string) {
  await api.delete(`/shelters/${id}`);
}

export async function apiListUsersByRole(role: "leader" | "member", limit = 500) {
  const { data } = await api.get<{ items: { id: string; name?: string; email?: string }[] }>("/users", {
    params: { role, page: 1, limit, sort: "name", order: "ASC" },
  });
  return (Array.isArray(data?.items) ? data.items : []);
}

export async function apiGetLeaderProfile(userId: string) {
  const { data } = await api.get<LeaderMiniDto>(`/leader-profiles/${userId}`);
  return data;
}

export async function apiGetMemberProfile(userId: string) {
  const { data } = await api.get<{ id: string; user: UserPublicDto; team?: { id: string; name?: string } | null }>(`/member-profiles/${userId}`);
  return data;
}

export async function apiLoadLeaderOptions() {
  const allLeaders: LeaderProfile[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data } = await api.get<{ items: LeaderProfile[]; limit?: number; total?: number }>(`/leader-profiles?page=${page}&limit=100`);

    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      allLeaders.push(...data.items);
      const limit = data.limit || 100;
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit);

      if (page >= totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  return allLeaders.map((c) => ({
    leaderProfileId: c.id,
    name: c.user?.name || c.user?.email || c.id,
  })) as LeaderOption[];
}

export async function apiLoadMemberOptions() {
  const allMembers: MemberProfile[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await apiListMembers({ page, limit: 100 });

    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      allMembers.push(...data.items);
      const limit = data.limit || 100;
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit);

      if (page >= totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  return allMembers.map((t) => ({
    memberProfileId: t.id,
    name: t.user?.name || t.user?.email || "Sem nome",
    vinculado: !!t.shelter,
  })) as MemberOption[];
}

export type LeaderSimpleApi = {
  leaderProfileId: string;
  name: string;
  vinculado: boolean;
};

export async function apiListLeadersSimple(): Promise<LeaderSimpleApi[]> {
  const allLeaders: LeaderProfile[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data } = await api.get<{ items: LeaderProfile[]; limit?: number; total?: number }>(`/leader-profiles?page=${page}&limit=100`);

    if (data?.items && data.items.length > 0) {
      allLeaders.push(...data.items);
      const limit = data.limit || 100;
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit);

      if (page >= totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  const mapped = allLeaders.map((l) => {
    const teams = (l as { teams?: unknown[] }).teams;
    return {
      leaderProfileId: l.id,
      name: l.user?.name || l.user?.email || l.id,
      vinculado: Array.isArray(teams) ? teams.length > 0 : false,
    };
  });

  return mapped;
}
