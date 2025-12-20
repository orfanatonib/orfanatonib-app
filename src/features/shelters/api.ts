import api from "@/config/axiosConfig";
import {
  ShelterResponseDto, CreateShelterForm, EditShelterForm,
  LeaderMiniDto, TeacherOption, UserPublicDto,
  ShelterFilters, ShelterSort,
  LeaderOption, ShelterSimpleResponseDto, ShelterListResponseDto
} from "./types";
import { LeaderProfile } from "../leaders/types";
import { TeacherProfile } from "../teachers/types";
import { apiListTeachersSimple } from "../teachers/api";

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

  const params: any = {
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
  const { data } = await api.get<ShelterListResponseDto[]>("/shelters/list");
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
    
    const shelterData: any = {
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
    
    if ((payload as any).teams && Array.isArray((payload as any).teams) && (payload as any).teams.length > 0) {
      shelterData.teams = (payload as any).teams;
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
    
    if (rest.mediaItem && rest.mediaItem.url) {
      rest.mediaItem = {
        uploadType: "link",
        isLocalFile: false,
        url: rest.mediaItem.url,
        title: rest.mediaItem.title || "Foto do Abrigo",
        description: rest.mediaItem.description || "Imagem do abrigo",
      };
    } else if (rest.mediaItem && !rest.mediaItem.url) {
      delete rest.mediaItem;
    }
    
    if (rest.teams && Array.isArray(rest.teams) && rest.teams.length === 0) {
      delete rest.teams;
    }
    
    const { data } = await api.post<ShelterResponseDto>("/shelters", rest);
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
    
    const shelterData: any = {
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
    
    if ((payload as any).teams) {
      shelterData.teams = (payload as any).teams;
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
    const payloadJson: any = {
      name: rest.name,
      description: rest.description,
      teamsQuantity: rest.teamsQuantity,
      address: rest.address,
    };
    
    if ((rest as any).teams) {
      payloadJson.teams = (rest as any).teams;
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


export async function apiListUsersByRole(role: "leader" | "teacher", limit = 500) {
  const { data } = await api.get<{ items: { id: string; name?: string; email?: string }[] }>("/users", {
    params: { role, page: 1, limit, sort: "name", order: "ASC" },
  });
  return (Array.isArray(data?.items) ? data.items : []);
}

export async function apiGetLeaderProfile(userId: string) {
  const { data } = await api.get<LeaderMiniDto>(`/leader-profiles/${userId}`);
  return data;
}

export async function apiGetTeacherProfile(userId: string) {
  const { data } = await api.get<{ id: string; user: UserPublicDto; team?: { id: string; name?: string } | null }>(`/teacher-profiles/${userId}`);
  return data;
}

export async function apiLoadLeaderOptions() {
  let allLeaders: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const { data } = await api.get(`/leader-profiles?page=${page}&limit=50`);
    
    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      allLeaders.push(...data.items);
      hasMore = data.items.length === 50;
      page++;
    } else {
      hasMore = false;
    }
  }
  
  return allLeaders.map((c) => ({
    leaderProfileId: c.id,
    name: c.user?.name || c.user?.email || c.id,
  })) as LeaderOption[];
}

export async function apiLoadTeacherOptions() {
  const teachers = await apiListTeachersSimple();
  
  return teachers.map((t) => ({
    teacherProfileId: t.teacherProfileId,
    name: t.name,
    vinculado: t.vinculado,
  })) as TeacherOption[];
}

// Removido: TeacherSimpleApi agora é TeacherSimpleListDto no módulo de teachers

export type LeaderSimpleApi = {
  leaderProfileId: string;
  name: string;
  vinculado: boolean;
};

// Removido: apiListTeachersSimple agora está no módulo de teachers

export async function apiListLeadersSimple(): Promise<LeaderSimpleApi[]> {
  let allLeaders: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const { data } = await api.get(`/leader-profiles?page=${page}&limit=50`);
    
    if (data?.items && data.items.length > 0) {
      allLeaders.push(...data.items);
      hasMore = data.items.length === 50;
      page++;
    } else {
      hasMore = false;
    }
  }
  
  const mapped = allLeaders.map((l: any) => ({
    leaderProfileId: l.id,
    name: l.user?.name || l.user?.email || l.id,
    vinculado: !!l.team,
  }));
  
  return mapped;
}
