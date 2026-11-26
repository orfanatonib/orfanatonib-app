import { RUN_TAG } from "../support/factory";
import { RUN_TAG as LIST_TAG } from "../support/moderation-list-scenarios";
import { expect } from "../support/live";
import { defineModerationListFilterScenarios } from "../support/moderation-list-scenarios";
import { create, deleteRaw, putRaw } from "./support";

/**
 * Fila `GET /comments` (moderação de depoimentos): busca (nome, comentário, abrigo, bairro), status de publicação,
 * abrigo, período, ordenação e paginação, tudo no banco; sem `page` continua o array legado.
 */
const SOL = `Sol ${RUN_TAG}`;
const LUA = `Lua ${RUN_TAG}`;
const shelterQuery = (shelter: string): string => `shelter=${encodeURIComponent(shelter)}`;

defineModerationListFilterScenarios({
  title: "Comentários — fila filtrada, ordenada e paginada no servidor",
  endpoint: "/comments",
  table: "comments",
  labelColumn: "name",
  sortKey: "name",
  flags: ["comment_submission", "comment_moderation"],
  labelOf: (item) => String(item.name),
  async create(request, ctx, input) {
    // alpha e bravo no "Sol"; as demais na "Lua".
    return create(request, ctx.member, {
      name: input.label,
      comment: input.text,
      shelter: input.index < 2 ? SOL : LUA,
      neighborhood: "Centro",
    });
  },
  async afterCreate(request, ctx, ids) {
    for (const name of ["bravo", "delta"]) {
      const response = await putRaw(request, ctx.admin, ids[name], {
        name: `${LIST_TAG}-${name}`,
        comment: `Texto de ${name}`,
        shelter: name === "bravo" ? SOL : LUA,
        neighborhood: "Centro",
        published: true,
      });
      expect(response.status(), await response.text()).toBe(200);
    }
  },
  remove: async (request, admin, id) => {
    await deleteRaw(request, admin, id);
  },
  filters: [
    { name: "published=true", query: "published=true", expected: ["bravo", "delta"], dbWhere: "AND published = 1" },
    { name: "published=false", query: "published=false", expected: ["alpha", "charlie", "echo"], dbWhere: "AND published = 0" },
    { name: "shelter=Sol", query: shelterQuery(SOL), expected: ["alpha", "bravo"], dbWhere: `AND shelter = '${SOL}'` },
    { name: "shelter=Lua + published=false (combinado)", query: `${shelterQuery(LUA)}&published=false`, expected: ["charlie", "echo"] },
    { name: "shelter=Sol + published=true (combinado)", query: `${shelterQuery(SOL)}&published=true`, expected: ["bravo"] },
  ],
  invalid: ["published=talvez", "sortBy=published", `shelter=${"x".repeat(101)}`],
});
