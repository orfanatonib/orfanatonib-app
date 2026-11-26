import type { APIRequestContext } from "@playwright/test";

import { queryAll } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { createShelter, deleteShelterApi } from "../shelters/support";
import { cleanupData } from "../support/keep-data";
import { buildFlowCast, disposeFlowCast, type FlowCast } from "./flow-support";

/**
 * Massa da listagem "Lançar presença": o abrigo do fluxo (2 equipes, 3 membros, 2 líderes) mais 13 abrigos de uma
 * equipe, todos com o prefixo `<RUN_TAG>-lancar` no nome — 15 abrigos que casam com a busca pela tag. O último tem
 * acento no nome para provar a busca sem acento. Tudo criado pela API e removido no fim.
 */
export const LAUNCH_LABEL = "lancar";
export const LAUNCH_TAG = `${RUN_TAG}-${LAUNCH_LABEL}`;
export const LAUNCH_SHELTERS = 15;
/** Nome do primeiro membro da equipe 1 (o usuário se chama `E2E lancar-membro1`). */
export const LAUNCH_MEMBER_SEARCH = `${LAUNCH_LABEL}-membro1`;
export const ACCENT_NAME = `${LAUNCH_TAG}-x14 Esperança`;

export interface LaunchWorld {
  cast: FlowCast;
  extraShelterIds: string[];
}

export async function buildLaunchWorld(request: APIRequestContext): Promise<LaunchWorld> {
  const cast = await buildFlowCast(request, LAUNCH_LABEL);
  const extraShelterIds: string[] = [];
  for (let n = 1; n <= 14; n += 1) {
    const name = n === 14 ? ACCENT_NAME : `${LAUNCH_TAG}-x${String(n).padStart(2, "0")}`;
    extraShelterIds.push((await createShelter(request, cast.adminToken, { name, teamsQuantity: 1 })).id);
  }
  return { cast, extraShelterIds };
}

export async function disposeLaunchWorld(request: APIRequestContext, world: LaunchWorld | undefined): Promise<void> {
  if (!world) return;
  await cleanupData(async () => {
    for (const id of world.extraShelterIds) await deleteShelterApi(request, world.cast.adminToken, id);
    await disposeFlowCast(request, world.cast);
  });
}

/** Ids dos abrigos do cenário (nome com a tag), na ordem do SQL pedido. */
export async function launchShelterIds(where = "", params: Array<string | number> = [], order = "sh.name ASC, sh.id ASC"): Promise<string[]> {
  return (
    await queryAll<{ id: string }>(
      `SELECT sh.id AS id FROM shelters sh WHERE sh.name LIKE ? ${where} ORDER BY ${order}`,
      [`%${LAUNCH_TAG}%`, ...params],
    )
  ).map((row) => row.id);
}
