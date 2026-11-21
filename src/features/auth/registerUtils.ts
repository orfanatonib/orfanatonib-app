import axios from "axios";

import { REGISTER_ERROR_MESSAGES } from "@/constants/errors";
import { digitsOnly } from "@/utils/masks";
import { normalizeName } from "@/utils/textUtils";
import { normalizeEmail } from "@/utils/validators";

import type { RegisterFormData } from "./register.types";
import type { CompleteRegisterRequest, RegisterRequest } from "./types";

/**
 * Mensagem que a tela mostra para uma falha de cadastro. A API devolve `message`
 * como texto, ou como lista quando a validação do corpo reprova mais de um campo.
 */
export function mapRegisterApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) return REGISTER_ERROR_MESSAGES.UNEXPECTED;

  const message: unknown = error.response?.data?.message;
  if (Array.isArray(message)) {
    const lines = message.filter((m): m is string => typeof m === "string");
    if (lines.length > 0) return lines.join(" ");
  }
  if (typeof message === "string" && message.trim()) return message;
  return REGISTER_ERROR_MESSAGES.GENERIC;
}

/**
 * Corpo do complemento do cadastro Google. O e-mail não vai: a API identifica a
 * conta pelo token, que prova a posse da identidade Google.
 */
export function toCompleteRegisterRequest(
  request: RegisterRequest,
  completionToken: string,
): CompleteRegisterRequest {
  return {
    completionToken,
    name: request.name,
    phone: request.phone,
    password: request.password,
    role: request.role,
    teamId: request.teamId,
  };
}

/** Corpo enviado à API: normaliza texto, tira a máscara do telefone e só manda equipe para membro. */
export function toRegisterRequest(
  data: RegisterFormData,
  commonUser: boolean,
): RegisterRequest {
  return {
    name: normalizeName(data.name),
    email: normalizeEmail(data.email),
    phone: digitsOnly(data.phone),
    password: commonUser ? data.password : undefined,
    role: data.role || undefined,
    teamId: data.role === "member" ? data.teamId || undefined : undefined,
  };
}
