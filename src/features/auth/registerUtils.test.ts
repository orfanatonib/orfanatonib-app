import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { REGISTER_ERROR_MESSAGES } from "@/constants/errors";

import type { RegisterFormData } from "./register.types";
import { mapRegisterApiError, toCompleteRegisterRequest, toRegisterRequest } from "./registerUtils";

const axiosError = (data: unknown): AxiosError =>
  new AxiosError("falhou", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: {} as AxiosResponse["config"],
  } as AxiosResponse);

const form = (patch: Partial<RegisterFormData> = {}): RegisterFormData => ({
  name: "  maria   souza ",
  email: " Maria@Orfanatonib.TEST ",
  phone: "(92) 99999-0000",
  password: "E2e@12345",
  role: "member",
  teamId: "team-1",
  ...patch,
});

describe("mapRegisterApiError", () => {
  it("usa a mensagem em texto da API", () => {
    expect(mapRegisterApiError(axiosError({ message: "E-mail já cadastrado" }))).toBe(
      "E-mail já cadastrado",
    );
  });

  it("junta a lista de mensagens da validação", () => {
    expect(
      mapRegisterApiError(axiosError({ message: ["phone must be a string", "role inválido"] })),
    ).toBe("phone must be a string role inválido");
  });

  it("cai na mensagem genérica sem corpo utilizável", () => {
    expect(mapRegisterApiError(axiosError({}))).toBe(REGISTER_ERROR_MESSAGES.GENERIC);
    expect(mapRegisterApiError(axiosError({ message: "  " }))).toBe(REGISTER_ERROR_MESSAGES.GENERIC);
    expect(mapRegisterApiError(axiosError({ message: [] }))).toBe(REGISTER_ERROR_MESSAGES.GENERIC);
  });

  it("erro que não é do Axios é inesperado", () => {
    expect(mapRegisterApiError(new Error("x"))).toBe(REGISTER_ERROR_MESSAGES.UNEXPECTED);
    expect(mapRegisterApiError("x")).toBe(REGISTER_ERROR_MESSAGES.UNEXPECTED);
  });
});

describe("toRegisterRequest", () => {
  it("normaliza nome, e-mail e telefone", () => {
    const req = toRegisterRequest(form(), true);
    expect(req.email).toBe("maria@orfanatonib.test");
    expect(req.phone).toBe("92999990000");
    expect(req.name).not.toMatch(/\s{2,}/);
  });

  it("senha só vai no cadastro comum", () => {
    expect(toRegisterRequest(form(), true).password).toBe("E2e@12345");
    expect(toRegisterRequest(form(), false).password).toBeUndefined();
  });

  it("equipe só vai para membro", () => {
    expect(toRegisterRequest(form({ role: "member" }), true).teamId).toBe("team-1");
    expect(toRegisterRequest(form({ role: "leader" }), true).teamId).toBeUndefined();
    expect(toRegisterRequest(form({ role: "member", teamId: "" }), true).teamId).toBeUndefined();
  });

  it("papel vazio vira indefinido", () => {
    expect(toRegisterRequest(form({ role: "" }), true).role).toBeUndefined();
  });
});

describe("toCompleteRegisterRequest", () => {
  it("identifica a conta só pelo token: o e-mail nunca vai no corpo", () => {
    const body = toCompleteRegisterRequest(toRegisterRequest(form({ role: "leader" }), false), "tok-123");
    expect(body.completionToken).toBe("tok-123");
    expect(body).not.toHaveProperty("email");
    expect(body.role).toBe("leader");
    expect(body.password).toBeUndefined();
  });
});
