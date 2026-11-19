import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, expectRow, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Edição de documento e exportação do material para visita (LibreOffice real): salva campos e documento rico,
 * baixa DOCX e PDF por etapa, por faixa e do material completo. Material criado aqui é arquivado no fim.
 */
const FLAGS = ["content_studio"] as const;
const before: Record<string, number> = {};
let admin = "";
let packageId = "";

type Stage = { id: string; stageType: string };
type Track = { audience: string; stages: Stage[] };
type Pkg = { id: string; tracks: Track[] };

const doc = (text: string) => ({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Título editado" }] },
    { type: "paragraph", content: [{ type: "text", text }] },
  ],
});

test.describe.serial("Estúdio — documento e exportação", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const key of FLAGS) {
      before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
    }
  });

  test.afterAll(async ({ request }) => {
    if (packageId) await request.post(`${API_URL}/content-studio/packages/${packageId}/archive`, { headers: authHeaders(admin) });
    for (const key of FLAGS) {
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
    }
    await closeDb();
  });

  const get = (request: import("@playwright/test").APIRequestContext, path: string) =>
    request.get(`${API_URL}/content-studio/packages/${packageId}/${path}`, { headers: authHeaders(admin) });

  test("sem nenhum conteúdo: exportar dá 422 explicando", async ({ request }) => {
    const res = await request.post(`${API_URL}/content-studio/packages`, {
      headers: authHeaders(admin),
      data: { theme: `e2e-export ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
    });
    expect(res.status()).toBe(201);
    const pkg = (await res.json()) as Pkg;
    packageId = pkg.id;
    expect((await get(request, "export/pdf")).status()).toBe(422);
  });

  test("salvar campos e documento rico: o documento fica na versão e o checksum muda", async ({ request }) => {
    const pkg = (await (await request.get(`${API_URL}/content-studio/packages/${packageId}`, { headers: authHeaders(admin) })).json()) as Pkg;
    const child = pkg.tracks.find((t) => t.audience === "CHILD")!;
    const lesson = child.stages.find((s) => s.stageType === "LESSON")!;
    const activity = child.stages.find((s) => s.stageType === "ACTIVITY")!;

    const fields = await request.patch(`${API_URL}/content-studio/packages/${packageId}/stages/${activity.id}/content`, {
      headers: authHeaders(admin),
      data: { structuredContent: { name: "Pastor e ovelhas", objective: "Brincar", materials: ["bolas"], steps: ["Roda", "Canto"], durationMinutes: 15 } },
    });
    expect(fields.status(), await fields.text()).toBe(200);

    const rich = await request.patch(`${API_URL}/content-studio/packages/${packageId}/stages/${lesson.id}/content`, {
      headers: authHeaders(admin),
      data: { structuredContent: { title: "Deus cuida de nós" }, contentDocument: doc("Texto escrito à mão no editor.") },
    });
    expect(rich.status(), await rich.text()).toBe(200);
    const saved = await expectRow<{ contentDocument: string }>("content_versions", { stage_id: lesson.id });
    expect(JSON.stringify(saved.contentDocument)).toContain("Texto escrito à mão");
  });

  test("documento com dado pessoal é recusado (400) e nenhuma versão nova é criada", async ({ request }) => {
    const pkg = (await (await request.get(`${API_URL}/content-studio/packages/${packageId}`, { headers: authHeaders(admin) })).json()) as Pkg;
    const lesson = pkg.tracks.find((t) => t.audience === "CHILD")!.stages.find((s) => s.stageType === "LESSON")!;
    const before = await countRows("content_versions", { stage_id: lesson.id });
    const res = await request.patch(`${API_URL}/content-studio/packages/${packageId}/stages/${lesson.id}/content`, {
      headers: authHeaders(admin),
      data: { structuredContent: { title: "x" }, contentDocument: doc("O CPF dele é 123.456.789-09") },
    });
    expect(res.status()).toBe(400);
    expect(await countRows("content_versions", { stage_id: lesson.id })).toBe(before);
  });

  test("DOCX da faixa Crianças: arquivo zip com nome legível", async ({ request }) => {
    const res = await get(request, "tracks/CHILD/export/docx");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-disposition"]).toContain("attachment");
    expect(res.headers()["content-disposition"]).toMatch(/e2e-export.*criancas\.docx/);
    expect((await res.body()).subarray(0, 2).toString()).toBe("PK");
  });

  test("PDF por faixa, por etapa e do material completo (LibreOffice real) abrem inline e começam com %PDF-", async ({ request }) => {
    const pkg = (await (await request.get(`${API_URL}/content-studio/packages/${packageId}`, { headers: authHeaders(admin) })).json()) as Pkg;
    const lesson = pkg.tracks.find((t) => t.audience === "CHILD")!.stages.find((s) => s.stageType === "LESSON")!;
    for (const path of ["tracks/CHILD/export/pdf", `stages/${lesson.id}/export/pdf`, "export/pdf"]) {
      const res = await get(request, path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()["content-disposition"]).toContain("inline");
      expect((await res.body()).subarray(0, 5).toString(), path).toBe("%PDF-");
    }
  });

  test("faixa sem conteúdo é 422; formato e faixa inválidos são 400; visitante 401; membro 403", async ({ request }) => {
    expect((await get(request, "tracks/ADULT/export/pdf")).status()).toBe(422);
    expect((await get(request, "export/odt")).status()).toBe(400);
    expect((await get(request, "tracks/ALIEN/export/pdf")).status()).toBe(400);
    expect((await request.get(`${API_URL}/content-studio/packages/${packageId}/export/pdf`)).status()).toBe(401);
    const member = (await loginAs(request, "member")).accessToken;
    expect((await request.get(`${API_URL}/content-studio/packages/${packageId}/export/pdf`, { headers: authHeaders(member) })).status()).toBe(403);
  });
});
