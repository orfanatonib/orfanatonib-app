import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Matriz `content-studio` (cenários de negócio, API ao vivo): caminho feliz, flag desligada, recurso inexistente,
 * validação e conflito de estado de cada rota. Perfis e 401/403 ficam em `content-studio-authorization.api.spec.ts`.
 * Cenários de falha de colaborador/rollback exigem injeção de falha e ficam nos testes unitários dos repositórios.
 */
const FLAGS = ["content_studio", "content_studio_generation", "content_studio_review", "content_studio_provider_admin"] as const;
const U = "00000000-0000-4000-8000-000000000000";
const CS = "/content-studio";
const before: Record<string, number> = {};
let admin = "";
const created: string[] = [];

type Version = { id: string; contentChecksum: string };
type Stage = { id: string; stageType: string; position: number; lockVersion: number; currentVersion: Version | null; reviewComments: Array<{ id: string }> };
type Pkg = { id: string; status: string; tracks: Array<{ audience: string; stages: Stage[] }> };

const call = (request: APIRequestContext, method: "get" | "post" | "patch", path: string, data?: unknown) =>
  request.fetch(`${API_URL}${path}`, { method, headers: authHeaders(admin), data });

async function newPackage(request: APIRequestContext): Promise<Pkg> {
  const res = await call(request, "post", `${CS}/packages`, {
    theme: `e2e-matriz ${Date.now()}-${created.length}`,
    biblicalReferences: "Salmos 23",
    canonicalObjective: "Confiar em Deus",
  });
  expect(res.status()).toBe(201);
  const pkg = (await res.json()) as Pkg;
  created.push(pkg.id);
  return pkg;
}
const getPkg = async (request: APIRequestContext, id: string) => (await (await call(request, "get", `${CS}/packages/${id}`)).json()) as Pkg;

/** Salva e conclui todas as etapas na ordem (pré-condição de revisão). */
async function completeAll(request: APIRequestContext, pkg: Pkg, audience?: string) {
  const track = audience ? pkg.tracks.find((t) => t.audience === audience)! : pkg.tracks[0];
  for (const stage of [...track.stages].sort((a, b) => a.position - b.position)) {
    const save = await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${stage.id}/content`, { structuredContent: { title: `Etapa ${stage.position}` } });
    expect(save.status()).toBe(200);
    const done = await call(request, "post", `${CS}/packages/${pkg.id}/stages/${stage.id}/complete-production`);
    expect([200, 201]).toContain(done.status());
  }
}
async function inReview(request: APIRequestContext) {
  const pkg = await newPackage(request);
  await completeAll(request, pkg);
  // Envia só a primeira categoria: as outras continuam em produção.
  const sent = await call(request, "post", `${CS}/packages/${pkg.id}/submit-review`, { audiences: [pkg.tracks[0].audience] });
  expect([200, 201]).toContain(sent.status());
  return getPkg(request, pkg.id);
}
/** Arquivar exige conteúdo salvo em alguma etapa. */
async function archiveWithContent(request: APIRequestContext, pkg: Pkg) {
  const stage = pkg.tracks[0].stages[0];
  await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${stage.id}/content`, { structuredContent: { title: "a" } });
  return call(request, "post", `${CS}/packages/${pkg.id}/archive`);
}
async function archived(request: APIRequestContext) {
  const pkg = await newPackage(request);
  expect([200, 201]).toContain((await archiveWithContent(request, pkg)).status());
  return pkg;
}
async function withFlagOff(request: APIRequestContext, run: () => Promise<void>) {
  await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: false } });
  try {
    await run();
  } finally {
    await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: true } });
  }
}
const decision = (stage: Stage) => ({ versionId: stage.currentVersion!.id, lockVersion: stage.lockVersion, contentChecksum: stage.currentVersion!.contentChecksum });

test.describe.serial("Estúdio — matriz de cenários", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const key of FLAGS) {
      before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
    }
  });
  test.afterAll(async ({ request }) => {
    for (const id of created) {
      const pkg = await getPkg(request, id);
      if (pkg.status !== "ARCHIVED") await archiveWithContent(request, pkg);
    }
    for (const key of FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
    await closeDb();
  });

  // ---------- leituras ----------
  test("[content-studio.get.ai-management-providers#feliz] lista os provedores", async ({ request }) => {
    const res = await call(request, "get", "/ai-management/providers");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
  test("[content-studio.get.content-studio-catalog#feliz] catálogo com públicos e etapas", async ({ request }) => {
    const res = await call(request, "get", `${CS}/catalog`);
    expect(res.status()).toBe(200);
    expect(JSON.stringify(await res.json())).toContain("CHILD");
  });
  test("[content-studio.get.content-studio-dashboard#feliz] dashboard", async ({ request }) => {
    expect((await call(request, "get", `${CS}/dashboard`)).status()).toBe(200);
  });
  test("[content-studio.get.content-studio-dashboard#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    await withFlagOff(request, async () => expect((await call(request, "get", `${CS}/dashboard`)).status()).toBe(403));
  });
  test("[content-studio.get.content-studio-packages#feliz] lista paginada", async ({ request }) => {
    const pkg = await newPackage(request);
    const res = await call(request, "get", `${CS}/packages?limit=50`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { total: number; packages?: Array<{ id: string }>; items?: Array<{ id: string }> };
    expect(body.total).toBeGreaterThan(0);
    expect(JSON.stringify(body)).toContain(pkg.id);
  });
  test("[content-studio.get.content-studio-packages#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    await withFlagOff(request, async () => expect((await call(request, "get", `${CS}/packages`)).status()).toBe(403));
  });
  test("[content-studio.get.content-studio-packages-id#feliz] detalhe com faixas e etapas", async ({ request }) => {
    const pkg = await newPackage(request);
    const got = await getPkg(request, pkg.id);
    expect(got.tracks[0].stages.length).toBeGreaterThan(0);
  });
  test("[content-studio.get.content-studio-packages-id#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await newPackage(request);
    await withFlagOff(request, async () => expect((await call(request, "get", `${CS}/packages/${pkg.id}`)).status()).toBe(403));
  });
  test("[content-studio.get.content-studio-packages-id#nao-encontrado] pacote inexistente ⇒ 404", async ({ request }) => {
    expect((await call(request, "get", `${CS}/packages/${U}`)).status()).toBe(404);
  });

  // ---------- criar pacote ----------
  test("[content-studio.post.content-studio-packages#feliz] cria o material para os quatro públicos, cada um com as cinco etapas", async ({ request }) => {
    const pkg = await newPackage(request);
    expect(pkg.tracks.map((t) => t.audience).sort()).toEqual(["ADULT", "BABY", "CHILD", "TEEN"]);
    for (const track of pkg.tracks)
      expect([...track.stages].sort((a, b) => a.position - b.position).map((s) => s.stageType)).toEqual([
        "LESSON",
        "LESSON_VISUALS",
        "VERSE_VISUALS",
        "VERSE_FIXATION",
        "STANDARD_GAME",
      ]);
    expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ?", [pkg.id])).toMatchObject({ n: 20 });
  });
  test("[content-studio.post.content-studio-packages#validacao] corpo vazio ou com público (o material nasce para todos) ⇒ 400", async ({ request }) => {
    expect((await call(request, "post", `${CS}/packages`, {})).status()).toBe(400);
    expect((await call(request, "post", `${CS}/packages`, { audience: "CHILD", theme: "t", biblicalReferences: "r", canonicalObjective: "o" })).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages#conflito-ou-duplicidade] temas repetidos são permitidos e geram pacotes distintos", async ({ request }) => {
    const body = { theme: `e2e-dup ${Date.now()}`, biblicalReferences: "Sl 1", canonicalObjective: "o" };
    const a = (await (await call(request, "post", `${CS}/packages`, body)).json()) as Pkg;
    const b = (await (await call(request, "post", `${CS}/packages`, body)).json()) as Pkg;
    created.push(a.id, b.id);
    expect(a.id).not.toBe(b.id);
  });

  // ---------- salvar conteúdo ----------
  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#feliz] salva nova versão", async ({ request }) => {
    const pkg = await newPackage(request);
    const stage = pkg.tracks[0].stages[0];
    const res = await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${stage.id}/content`, { structuredContent: { title: "Deus cuida" } });
    expect(res.status()).toBe(200);
    expect((await getPkg(request, pkg.id)).tracks[0].stages.find((s) => s.id === stage.id)!.currentVersion).not.toBeNull();
  });
  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await newPackage(request);
    await withFlagOff(request, async () =>
      expect((await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${pkg.tracks[0].stages[0].id}/content`, { structuredContent: { title: "x" } })).status()).toBe(403),
    );
  });
  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#nao-encontrado] etapa inexistente ⇒ 404", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${U}/content`, { structuredContent: { title: "x" } })).status()).toBe(404);
  });
  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#validacao] conteúdo inválido ⇒ 400", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${pkg.tracks[0].stages[0].id}/content`, { structuredContent: "texto" })).status()).toBe(400);
  });
  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#conflito-ou-duplicidade] pacote arquivado não aceita edição ⇒ 409", async ({ request }) => {
    const pkg = await archived(request);
    expect((await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${pkg.tracks[0].stages[0].id}/content`, { structuredContent: { title: "x" } })).status()).toBe(409);
  });

  // ---------- arquivar ----------
  test("[content-studio.post.content-studio-packages-packageid-archive#feliz] arquiva", async ({ request }) => {
    const pkg = await newPackage(request);
    const res = await archiveWithContent(request, pkg);
    expect([200, 201]).toContain(res.status());
    expect((await getPkg(request, pkg.id)).status).toBe("ARCHIVED");
  });
  test("[content-studio.post.content-studio-packages-packageid-archive#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await newPackage(request);
    await withFlagOff(request, async () => expect((await call(request, "post", `${CS}/packages/${pkg.id}/archive`)).status()).toBe(403));
  });
  test("[content-studio.post.content-studio-packages-packageid-archive#nao-encontrado] pacote inexistente ⇒ 404", async ({ request }) => {
    expect((await call(request, "post", `${CS}/packages/${U}/archive`)).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-archive#validacao] id que não é UUID ou pacote sem conteúdo ⇒ 400", async ({ request }) => {
    expect((await call(request, "post", `${CS}/packages/nao-e-uuid/archive`)).status()).toBe(400);
    const empty = await newPackage(request);
    expect((await call(request, "post", `${CS}/packages/${empty.id}/archive`)).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-archive#conflito-ou-duplicidade] arquivar de novo ⇒ 409", async ({ request }) => {
    const pkg = await archived(request);
    expect((await call(request, "post", `${CS}/packages/${pkg.id}/archive`)).status()).toBe(409);
  });

  // ---------- concluir produção ----------
  const completePath = (pkgId: string, stageId: string) => `${CS}/packages/${pkgId}/stages/${stageId}/complete-production`;
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#feliz] conclui a etapa com conteúdo salvo", async ({ request }) => {
    const pkg = await newPackage(request);
    const stage = pkg.tracks[0].stages[0];
    await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${stage.id}/content`, { structuredContent: { title: "a" } });
    expect([200, 201]).toContain((await call(request, "post", completePath(pkg.id, stage.id))).status());
    expect((await getPkg(request, pkg.id)).tracks[0].stages.find((s) => s.id === stage.id)).toMatchObject({ id: stage.id });
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await newPackage(request);
    await withFlagOff(request, async () => expect((await call(request, "post", completePath(pkg.id, pkg.tracks[0].stages[0].id))).status()).toBe(403));
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#nao-encontrado] etapa inexistente ⇒ 404", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "post", completePath(pkg.id, U))).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#validacao] ids que não são UUID ⇒ 400", async ({ request }) => {
    expect((await call(request, "post", completePath("x", "y"))).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#conflito-ou-duplicidade] concluir duas vezes ⇒ 409", async ({ request }) => {
    const pkg = await newPackage(request);
    const stage = pkg.tracks[0].stages[0];
    await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${stage.id}/content`, { structuredContent: { title: "a" } });
    await call(request, "post", completePath(pkg.id, stage.id));
    expect((await call(request, "post", completePath(pkg.id, stage.id))).status()).toBe(409);
  });

  // ---------- gerar ----------
  const genPath = (pkgId: string, stageId: string) => `${CS}/packages/${pkgId}/stages/${stageId}/generations`;
  const genBody = () => ({ capability: "TEXT_STRUCTURED", idempotencyKey: `m-${Date.now()}-${Math.random()}` });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#feliz] aceita o pedido (202) e cria o job", async ({ request }) => {
    const pkg = await newPackage(request);
    const res = await call(request, "post", genPath(pkg.id, pkg.tracks[0].stages[0].id), genBody());
    expect(res.status()).toBe(202);
    expect(await res.json()).toMatchObject({ stageId: pkg.tracks[0].stages[0].id });
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#nao-encontrado] etapa inexistente ⇒ 404", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "post", genPath(pkg.id, U), genBody())).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#validacao] corpo vazio ⇒ 400", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "post", genPath(pkg.id, pkg.tracks[0].stages[0].id), {})).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#conflito-ou-duplicidade] pacote arquivado não gera ⇒ 409", async ({ request }) => {
    const pkg = await archived(request);
    expect((await call(request, "post", genPath(pkg.id, pkg.tracks[0].stages[0].id), genBody())).status()).toBe(409);
  });

  // ---------- revisão ----------
  const submitPath = (id: string) => `${CS}/packages/${id}/submit-review`;
  test("[content-studio.post.content-studio-packages-packageid-submit-review#feliz] etapas concluídas ⇒ pacote em revisão", async ({ request }) => {
    const pkg = await inReview(request);
    expect(pkg.status).toBe("IN_REVIEW");
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await newPackage(request);
    await withFlagOff(request, async () => expect((await call(request, "post", submitPath(pkg.id))).status()).toBe(403));
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#nao-encontrado] pacote inexistente ⇒ 404", async ({ request }) => {
    expect((await call(request, "post", submitPath(U))).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#validacao] id que não é UUID ⇒ 400", async ({ request }) => {
    expect((await call(request, "post", submitPath("x"))).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#conflito-ou-duplicidade] pacote sem produção ⇒ 409; categoria já enviada ⇒ 400", async ({ request }) => {
    const fresh = await newPackage(request);
    expect((await call(request, "post", submitPath(fresh.id), {})).status()).toBe(409);
    const reviewing = await inReview(request);
    expect((await call(request, "post", submitPath(reviewing.id), { audiences: [reviewing.tracks[0].audience] })).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#parcial] envia uma categoria por vez e as outras continuam em produção", async ({ request }) => {
    const pkg = await newPackage(request);
    await completeAll(request, pkg);
    const first = pkg.tracks[0].audience;
    expect([200, 201]).toContain((await call(request, "post", submitPath(pkg.id), { audiences: [first] })).status());
    const after = await getPkg(request, pkg.id);
    expect(after.status).toBe("IN_REVIEW");
    for (const track of after.tracks)
      for (const stage of track.stages) {
        const status = await queryOne<{ status: string }>("SELECT status FROM content_stages WHERE id = ?", [stage.id]);
        expect(status?.status, `${track.audience} ${stage.stageType}`).toBe(track.audience === first ? "IN_REVIEW" : "NOT_STARTED");
      }
    // Enquanto uma categoria está em revisão, as outras seguem editáveis.
    const other = after.tracks.find((t) => t.audience !== first)!.stages[0];
    expect((await call(request, "patch", `${CS}/packages/${pkg.id}/stages/${other.id}/content`, { structuredContent: { title: "continua em produção" } })).status()).toBe(200);
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#todas] sem lista envia todas as categorias (todas precisam estar concluídas)", async ({ request }) => {
    const pkg = await newPackage(request);
    await completeAll(request, pkg);
    expect((await call(request, "post", submitPath(pkg.id), {})).status()).toBe(400);
    for (const track of pkg.tracks.slice(1)) await completeAll(request, pkg, track.audience);
    expect([200, 201]).toContain((await call(request, "post", submitPath(pkg.id), {})).status());
    expect(await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM content_stages s JOIN content_tracks t ON t.id = s.track_id WHERE t.package_id = ? AND s.status = 'IN_REVIEW'", [pkg.id])).toMatchObject({ n: 20 });
  });
  test("[content-studio.post.content-studio-packages-packageid-submit-review#validacao-publico] público inválido ou repetido ⇒ 400", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "post", submitPath(pkg.id), { audiences: ["NAO"] })).status()).toBe(400);
    expect((await call(request, "post", submitPath(pkg.id), { audiences: ["CHILD", "CHILD"] })).status()).toBe(400);
    expect((await call(request, "post", submitPath(pkg.id), { audiences: [] })).status()).toBe(400);
  });

  const approvePath = (pkgId: string, stageId: string) => `${CS}/packages/${pkgId}/stages/${stageId}/approve`;
  const changesPath = (pkgId: string, stageId: string) => `${CS}/packages/${pkgId}/stages/${stageId}/request-changes`;
  const fakeDecision = { versionId: U, lockVersion: 1, contentChecksum: "a".repeat(64) };

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#feliz] aprova a etapa em revisão", async ({ request }) => {
    const pkg = await inReview(request);
    const stage = pkg.tracks[0].stages[0];
    const res = await call(request, "post", approvePath(pkg.id, stage.id), decision(stage));
    expect([200, 201]).toContain(res.status());
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await inReview(request);
    const stage = pkg.tracks[0].stages[0];
    await withFlagOff(request, async () => expect((await call(request, "post", approvePath(pkg.id, stage.id), decision(stage))).status()).toBe(403));
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#nao-encontrado] etapa inexistente ⇒ 404", async ({ request }) => {
    const pkg = await inReview(request);
    expect((await call(request, "post", approvePath(pkg.id, U), fakeDecision)).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#validacao] corpo inválido ⇒ 400", async ({ request }) => {
    const pkg = await inReview(request);
    expect((await call(request, "post", approvePath(pkg.id, pkg.tracks[0].stages[0].id), {})).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#conflito-ou-duplicidade] versão/checksum desatualizados ou fora de revisão ⇒ 409", async ({
    request,
  }) => {
    const fresh = await newPackage(request);
    expect((await call(request, "post", approvePath(fresh.id, fresh.tracks[0].stages[0].id), fakeDecision)).status()).toBe(409);
    const pkg = await inReview(request);
    expect((await call(request, "post", approvePath(pkg.id, pkg.tracks[0].stages[0].id), fakeDecision)).status()).toBeGreaterThanOrEqual(409);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#feliz] pede ajustes e cria o comentário", async ({ request }) => {
    const pkg = await inReview(request);
    const stage = pkg.tracks[0].stages[0];
    const res = await call(request, "post", changesPath(pkg.id, stage.id), { ...decision(stage), message: "Simplificar a linguagem" });
    expect([200, 201]).toContain(res.status());
    expect((await getPkg(request, pkg.id)).tracks[0].stages.find((s) => s.id === stage.id)!.reviewComments.length).toBe(1);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const pkg = await inReview(request);
    const stage = pkg.tracks[0].stages[0];
    await withFlagOff(request, async () => expect((await call(request, "post", changesPath(pkg.id, stage.id), { ...decision(stage), message: "m" })).status()).toBe(403));
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#nao-encontrado] etapa inexistente ⇒ 404", async ({ request }) => {
    const pkg = await inReview(request);
    expect((await call(request, "post", changesPath(pkg.id, U), { ...fakeDecision, message: "m" })).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#validacao] sem mensagem ⇒ 400", async ({ request }) => {
    const pkg = await inReview(request);
    const stage = pkg.tracks[0].stages[0];
    expect((await call(request, "post", changesPath(pkg.id, stage.id), { ...decision(stage), message: "   " })).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#conflito-ou-duplicidade] fora de revisão ⇒ 409", async ({ request }) => {
    const fresh = await newPackage(request);
    expect((await call(request, "post", changesPath(fresh.id, fresh.tracks[0].stages[0].id), { ...fakeDecision, message: "m" })).status()).toBe(409);
  });

  const resolvePath = (pkgId: string, commentId: string) => `${CS}/packages/${pkgId}/review-comments/${commentId}/resolve`;
  async function withComment(request: APIRequestContext) {
    const pkg = await inReview(request);
    const stage = pkg.tracks[0].stages[0];
    await call(request, "post", changesPath(pkg.id, stage.id), { ...decision(stage), message: "Ajustar" });
    const after = await getPkg(request, pkg.id);
    return { pkg: after, commentId: after.tracks[0].stages.find((s) => s.id === stage.id)!.reviewComments[0].id };
  }
  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#feliz] resolve o comentário", async ({ request }) => {
    const { pkg, commentId } = await withComment(request);
    expect([200, 201]).toContain((await call(request, "post", resolvePath(pkg.id, commentId), { message: "Ajustado" })).status());
  });
  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#flag-desligada] flag desligada ⇒ 403", async ({ request }) => {
    const { pkg, commentId } = await withComment(request);
    await withFlagOff(request, async () => expect((await call(request, "post", resolvePath(pkg.id, commentId), { message: "Ajustado" })).status()).toBe(403));
  });
  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#nao-encontrado] comentário inexistente ⇒ 404", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "post", resolvePath(pkg.id, U), { message: "Ajustado" })).status()).toBe(404);
  });
  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#validacao] id que não é UUID ⇒ 400", async ({ request }) => {
    const pkg = await newPackage(request);
    expect((await call(request, "post", resolvePath(pkg.id, "x"))).status()).toBe(400);
  });
  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#conflito-ou-duplicidade] resolver de novo não duplica o efeito", async ({
    request,
  }) => {
    const { pkg, commentId } = await withComment(request);
    await call(request, "post", resolvePath(pkg.id, commentId), { message: "Ajustado" });
    const again = await call(request, "post", resolvePath(pkg.id, commentId), { message: "Ajustado" });
    expect([200, 201, 409]).toContain(again.status());
    const after = await getPkg(request, pkg.id);
    expect(after.tracks[0].stages.flatMap((s) => s.reviewComments).filter((c) => c.id === commentId)).toHaveLength(1);
  });
});
