import { API_URL } from "../../../playwright.live.config";
import { cleanupData } from "../support/keep-data";
import { queryOne } from "../support/db";
import { defineModerationListFilterScenarios } from "../support/moderation-list-scenarios";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { deleteRaw, png, submit, type SectionBody } from "./support";

/**
 * Fila `GET /image-sections` (plano de telas administrativas): busca, estado da revisão, publicação, autor, período,
 * ordenação (legenda, envio, revisão) e paginação, tudo no banco; sem `page` continua o array legado.
 */
const REASON = `${RUN_TAG} motivo`;

defineModerationListFilterScenarios({
  title: "Fotos dos abrigos — fila filtrada, ordenada e paginada no servidor",
  endpoint: "/image-sections",
  table: "image_sections",
  labelColumn: "caption",
  sortKey: "caption",
  flags: ["shelter_photo_upload", "photo_moderation"],
  labelOf: (item) => String(item.caption),
  async create(request, ctx, input) {
    const token = input.index < 3 ? ctx.member : ctx.leader;
    const body: SectionBody = await submit(request, token, {
      caption: input.label,
      description: input.description,
      media: [{ file: png(`${input.label}.png`) }],
    });
    return { id: body.id };
  },
  async afterCreate(request, ctx, ids) {
    // bravo e depois delta: a ordem por revisão (`reviewedAt`) fica determinística.
    for (const name of ["bravo", "delta"]) {
      // `reviewedAt` tem precisão de segundo: separa as revisões para a ordenação ser determinística.
      if (name === "delta") await new Promise((resolve) => setTimeout(resolve, 1100));
      const res = await request.patch(`${API_URL}/image-sections/${ids[name]}/reject`, {
        headers: authHeaders(ctx.admin),
        data: { reason: REASON },
      });
      if (!res.ok()) throw new Error(`reprovar ${name} falhou: ${res.status()} ${await res.text()}`);
    }
  },
  remove: async (request, admin, id) => {
    await deleteRaw(request, admin, id);
  },
  filters: [
    { name: "reviewStatus=pending", query: "reviewStatus=pending", expected: ["alpha", "charlie", "echo"], dbWhere: "AND reviewStatus = 'pending'" },
    { name: "reviewStatus=rejected", query: "reviewStatus=rejected", expected: ["bravo", "delta"], dbWhere: "AND reviewStatus = 'rejected'" },
    { name: "reviewStatus=approved", query: "reviewStatus=approved", expected: [], dbWhere: "AND reviewStatus = 'approved'" },
    { name: "public=false (envio de não admin nunca nasce público)", query: "public=false", expected: ["alpha", "bravo", "charlie", "delta", "echo"], dbWhere: "AND public = 0" },
    { name: "public=true", query: "public=true", expected: [], dbWhere: "AND public = 1" },
    { name: "authorId do membro", query: "authorId={memberId}", expected: ["alpha", "bravo", "charlie"], dbWhere: "AND authorId = '{memberId}'" },
    { name: "authorId do líder + reprovada (combinado)", query: "authorId={leaderId}&reviewStatus=rejected", expected: ["delta"], dbWhere: "AND authorId = '{leaderId}' AND reviewStatus = 'rejected'" },
  ],
  extraSorts: [
    { query: "reviewStatus=rejected&sortBy=reviewedAt&order=DESC", expected: ["delta", "bravo"] },
    { query: "reviewStatus=rejected&sortBy=reviewedAt&order=ASC", expected: ["bravo", "delta"] },
  ],
  invalid: ["reviewStatus=x", "public=talvez", "authorId=nao-uuid", "sortBy=title"],
});

// A busca também alcança o NOME do autor (não só legenda/descrição).
test("busca pelo nome do autor devolve as publicações dele (ex.: membro do E2E)", async ({ request }) => {
  const admin = (await loginAs(request, "admin")).accessToken;
  const member = await loginAs(request, "member");
  const row = await queryOne<{ name: string }>("SELECT name FROM users WHERE id = ?", [member.userId]);
  const sent = await submit(request, member.accessToken, { caption: `${RUN_TAG}-autor`, media: [{ file: png("autor.png") }] });
  try {
    const response = await request.get(`${API_URL}/image-sections`, {
      headers: authHeaders(admin),
      params: { search: row!.name, page: 1, limit: 100 },
    });
    expect(response.status(), await response.text()).toBe(200);
    const body = (await response.json()) as { data: Array<{ id: string }> };
    expect(body.data.map((item) => item.id)).toContain(sent.id);
  } finally {
    await cleanupData(async () => {
      await deleteRaw(request, admin, sent.id);
    });
  }
});
