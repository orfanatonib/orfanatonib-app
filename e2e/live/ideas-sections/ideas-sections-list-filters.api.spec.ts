import { API_URL } from "../../../playwright.live.config";
import { cleanupData } from "../support/keep-data";
import { queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { defineModerationListFilterScenarios } from "../support/moderation-list-scenarios";
import { createIdeaWithDescription as createWithDescription, deleteIdea } from "./ideas-sections.helpers";

/**
 * Fila `GET /ideas-sections`: busca (título, descrição, autor), tipo de mídia, período, ordenação (título, envio) e
 * paginação, tudo no banco; sem `page` continua o array legado.
 */

defineModerationListFilterScenarios({
  title: "Ideias compartilhadas — fila filtrada, ordenada e paginada no servidor",
  endpoint: "/ideas-sections",
  table: "ideas_sections",
  labelColumn: "title",
  sortKey: "title",
  flags: ["idea_submission", "idea_moderation"],
  labelOf: (item) => String(item.title),
  async create(request, ctx, input) {
    // charlie e echo levam foto enviada; as demais, um vídeo por link. alpha/bravo/charlie são do membro.
    const token = input.index < 3 ? ctx.member : ctx.leader;
    return createWithDescription(request, token, {
      label: input.label,
      description: input.description,
      image: input.index === 2 || input.index === 4,
    });
  },
  remove: (request, admin, id) => deleteIdea(request, admin, id),
  filters: [
    { name: "mediaType=image", query: "mediaType=image", expected: ["charlie", "echo"] },
    { name: "mediaType=video", query: "mediaType=video", expected: ["alpha", "bravo", "delta"] },
    { name: "mediaType=document", query: "mediaType=document", expected: [] },
  ],
  invalid: ["mediaType=audio", "public=true", "sortBy=caption"],
});

test("busca pelo e-mail do autor devolve as ideias dele e o tipo de mídia combina com a busca", async ({ request }) => {
  const admin = (await loginAs(request, "admin")).accessToken;
  const member = await loginAs(request, "member");
  const row = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = ?", [member.userId]);
  const idea = await createWithDescription(request, member.accessToken, { label: `${RUN_TAG}-autor`, description: "d", image: false });
  try {
    const response = await request.get(`${API_URL}/ideas-sections`, {
      headers: authHeaders(admin),
      params: { search: row!.email, page: 1, limit: 100 },
    });
    expect(response.status(), await response.text()).toBe(200);
    const body = (await response.json()) as { data: Array<{ id: string }> };
    expect(body.data.map((item) => item.id)).toContain(idea.id);
  } finally {
    await cleanupData(async () => {
      await deleteIdea(request, admin, idea.id);
    });
  }
});
