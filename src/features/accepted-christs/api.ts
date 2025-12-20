import api from "@/config/axiosConfig";
import type { CreateAcceptedChristDto, AcceptedChristResponseDto } from "./types";

export async function apiCreateAcceptedChrist(payload: CreateAcceptedChristDto) {
  const { data } = await api.post<AcceptedChristResponseDto>("/accepted-christs", payload);
  return data;
}

