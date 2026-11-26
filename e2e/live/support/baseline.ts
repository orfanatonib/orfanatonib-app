import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { authHeaders, loginAs } from "./live";

/**
 * Dados mínimos para as telas de listagem (a pesquisa só tem o que filtrar se houver
 * ao menos um registro). Cada função cria pela API e devolve o `undo` que apaga.
 */
export type Undo = (request: APIRequestContext) => Promise<void>;

export async function seedContact(request: APIRequestContext, tag: string): Promise<Undo> {
  const res = await request.post(`${API_URL}/contact`, {
    data: { name: `Ana ${tag}`, email: "ana@orfanatonib.test", phone: "92999990000", message: "mensagem de teste" },
  });
  const id = ((await res.json()) as { id: string }).id;
  return async (r) => {
    const admin = (await loginAs(r, "admin")).accessToken;
    await r.delete(`${API_URL}/contact/${id}`, { headers: authHeaders(admin) });
  };
}

export async function seedDocument(request: APIRequestContext, tag: string): Promise<Undo> {
  const admin = (await loginAs(request, "admin")).accessToken;
  const res = await request.post(`${API_URL}/documents`, {
    headers: authHeaders(admin),
    multipart: {
      documentData: JSON.stringify({
        name: `Aula ${tag}`,
        description: "documento de teste",
        media: { title: "Guia", description: "Guia", mediaType: "document", uploadType: "link", url: "https://example.com/guia.pdf", isLocalFile: false },
      }),
    },
  });
  const id = ((await res.json()) as { id: string }).id;
  return async (r) => {
    const token = (await loginAs(r, "admin")).accessToken;
    await r.delete(`${API_URL}/documents/${id}`, { headers: authHeaders(token) });
  };
}

export async function seedShelter(request: APIRequestContext, tag: string): Promise<Undo> {
  const admin = (await loginAs(request, "admin")).accessToken;
  const res = await request.post(`${API_URL}/shelters`, {
    headers: authHeaders(admin),
    multipart: {
      shelterData: JSON.stringify({
        name: `Abrigo ${tag}`,
        description: "abrigo de teste",
        teamsQuantity: 1,
        address: { street: "Rua Teste", number: "10", district: "Centro", city: "Manaus", state: "AM" },
      }),
    },
  });
  const id = ((await res.json()) as { id: string }).id;
  return async (r) => {
    const token = (await loginAs(r, "admin")).accessToken;
    await r.delete(`${API_URL}/shelters/${id}`, { headers: authHeaders(token) });
  };
}

/** Meditação semanal numa semana futura aleatória (a API recusa duas meditações na mesma semana). */
export async function seedMeditation(request: APIRequestContext, tag: string): Promise<Undo> {
  const admin = (await loginAs(request, "admin")).accessToken;
  const monday = new Date(Date.UTC(2040, 0, 2) + Math.floor(Math.random() * 4000) * 7 * 86_400_000);
  const day = (offset: number) => new Date(monday.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
  const res = await request.post(`${API_URL}/meditations`, {
    headers: authHeaders(admin),
    multipart: {
      meditationData: JSON.stringify({
        topic: `Meditação a ${tag}`,
        startDate: day(0),
        endDate: day(4),
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => ({ day: d, verse: "Salmos 23:1", topic: `Tema ${d}` })),
        media: { title: "Guia", description: "Guia", mediaType: "document", uploadType: "link", url: "https://example.com/guia.pdf", isLocalFile: false },
      }),
    },
  });
  const id = ((await res.json()) as { id: string }).id;
  return async (r) => {
    const token = (await loginAs(r, "admin")).accessToken;
    await r.delete(`${API_URL}/meditations/${id}`, { headers: authHeaders(token) });
  };
}
