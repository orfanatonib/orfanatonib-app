import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { setFlag } from "./feed-fixtures";
import { makePng } from "./png";
import { approveComment, commentBody } from "./comments-moderation-helpers";

/**
 * MASSA DE DADOS do feed, criada só pela API (fotos de verdade, vários autores, celebrações e comentários).
 * Não roda na execução normal: é opt-in.
 *
 *   FEED_SEED=1 npx playwright test -c playwright.live.config.ts --project=live-api e2e/live/shelter-feed/feed-seed.api.spec.ts --workers=1
 *   FEED_SEED_CLEAN=1 ...mesmo comando...   # apaga só o que a massa criou (marca na descrição)
 *
 * Vai para a galeria do feed local ("Feed dos Abrigos", ou `E2E_FEED_PAGE_ID`).
 */
const SEED = process.env.FEED_SEED === "1";
const CLEAN = process.env.FEED_SEED_CLEAN === "1";
const MARK = "massa-e2e";
const POSTS = Number(process.env.FEED_SEED_POSTS ?? 24);
const VIDEO = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "assets", "visita.mp4"));
const FLAGS = ["shelter_feed", "shelter_feed_celebrations", "shelter_feed_comments"] as const;

const THEMES = [
  ["Tarde de brincadeiras no abrigo", "As crianças adoraram a gincana no pátio. Muita risada e lanche coletivo."],
  ["Oficina de pintura", "Cada um pintou o que mais gosta; os desenhos já estão no mural."],
  ["Contação de histórias", "Hoje foi a história de Davi, com fantoches e muita participação."],
  ["Lanche da comunidade", "Preparamos o lanche juntos e dividimos a mesa com todo mundo."],
  ["Dia de jogos de tabuleiro", "Dama, dominó e quebra-cabeça: a turma passou a tarde concentrada."],
  ["Música e louvor", "Cantamos juntos e as crianças puderam tocar os instrumentos."],
  ["Visita das equipes", "Equipes de três igrejas se encontraram no abrigo para um dia especial."],
  ["Campeonato de bola", "Times mistos, regras simples e todo mundo jogou."],
  ["Horta do abrigo", "Plantamos alface e cebolinha, e cada criança cuidou de um canteiro."],
  ["Aniversariantes do mês", "Bolo, parabéns e uma lembrança para cada aniversariante."],
  ["Cinema no pátio", "Pipoca, almofadas e um filme para toda a turma."],
  ["Oficina de artesanato", "Pulseiras e porta-lápis feitos à mão, com materiais reciclados."],
];
const COMMENTS = [
  "Que dia lindo! Deus abençoe a todos.",
  "Obrigado por cada visita, faz toda a diferença.",
  "As crianças merecem muito carinho. Parabéns à equipe!",
  "Lindas fotos, dá pra ver a alegria de todos.",
  "Vamos repetir em breve?",
  "Que a gente continue servindo com amor.",
  "Gratidão por tudo que vocês fazem.",
  "Foi uma tarde abençoada.",
];

type Section = { id: string; description?: string };

async function galleryId(): Promise<string> {
  const fromEnv = process.env.E2E_FEED_PAGE_ID;
  if (fromEnv) return fromEnv;
  const row = await queryOne<{ id: string }>("SELECT id FROM image_pages WHERE name = ? ORDER BY createdAt LIMIT 1", ["Feed dos Abrigos"]);
  if (!row) throw new Error('Galeria "Feed dos Abrigos" não existe no banco local (crie-a e ponha o id em FEED_ORFANATO_PAGE_ID/VITE_FEED_MINISTERIO_ID).');
  return row.id;
}

/** O autor propõe a foto (com arquivos reais); o admin a publica (ou deixa pendente) na galeria do feed. */
async function createPost(request: APIRequestContext, authorToken: string, adminToken: string, pageId: string, index: number, isPublic: boolean): Promise<string> {
  const [title, text] = THEMES[index % THEMES.length];
  const photos = 1 + (index % 4);
  const mediaItems = Array.from({ length: photos }, (_, n) => ({
    title: `foto-${index}-${n}`,
    description: `${title} (${n + 1})`,
    uploadType: "upload",
    mediaType: "image",
    isLocalFile: true,
    fieldKey: `img${n}`,
    originalName: `massa-${index}-${n}.png`,
  }));
  // Um em cada quatro posts traz também um vídeo.
  const withVideo = index % 4 === 1;
  const allItems = withVideo
    ? [...mediaItems, { title: `video-${index}`, description: `${title} (vídeo)`, uploadType: "upload", mediaType: "video", isLocalFile: true, fieldKey: "vid0", originalName: `massa-${index}.mp4` }]
    : mediaItems;
  const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = {
    sectionData: JSON.stringify({ caption: `${title} #${index + 1}`, description: `${text} (${MARK})`, public: false, mediaItems: allItems }),
  };
  if (withVideo) multipart.vid0 = { name: `massa-${index}.mp4`, mimeType: "video/mp4", buffer: VIDEO };
  mediaItems.forEach((item, n) => {
    multipart[item.fieldKey] = { name: item.originalName, mimeType: "image/png", buffer: makePng(800, 600, index * 10 + n + 1) };
  });
  const created = await request.post(`${API_URL}/image-sections`, { headers: authHeaders(authorToken), multipart });
  if (!created.ok()) throw new Error(`POST /image-sections falhou: ${created.status()} ${await created.text()}`);
  const { id, mediaItems: stored } = (await created.json()) as { id: string; mediaItems: Array<Record<string, unknown>> };
  const attached = await request.patch(`${API_URL}/image-sections/${id}`, {
    headers: authHeaders(adminToken),
    multipart: { sectionData: JSON.stringify({ caption: `${title} #${index + 1}`, description: `${text} (${MARK})`, public: isPublic, pageId, mediaItems: stored }) },
  });
  if (!attached.ok()) throw new Error(`PATCH /image-sections falhou: ${attached.status()} ${await attached.text()}`);
  return id;
}

test.describe.serial("Massa do feed", () => {
  test.skip(!SEED && !CLEAN, "opt-in: FEED_SEED=1 cria a massa; FEED_SEED_CLEAN=1 apaga");
  test.afterAll(async () => {
    await closeDb();
  });

  test("cria a massa: posts com fotos reais, vários autores, celebrações e comentários", async ({ request }) => {
    test.skip(!SEED, "só com FEED_SEED=1");
    test.setTimeout(240_000);
    const admin = (await loginAs(request, "admin")).accessToken;
    const leader = (await loginAs(request, "leader")).accessToken;
    const member = (await loginAs(request, "member")).accessToken;
    for (const key of FLAGS) await setFlag(request, admin, key, true);
    const pageId = await galleryId();
    const authors = [admin, leader, member];

    const ids: string[] = [];
    for (let index = 0; index < POSTS; index += 1) {
      // Um em cada oito fica pendente (o admin ainda não publicou).
      ids.push(await createPost(request, authors[index % 3], admin, pageId, index, index % 8 !== 7));
    }

    // Celebrações: cada perfil celebra uma parte diferente das publicações.
    let celebrations = 0;
    for (const [who, token] of [
      ["admin", admin],
      ["leader", leader],
      ["member", member],
    ] as const) {
      for (const [index, id] of ids.entries()) {
        if ((index + who.length) % 5 === 0) continue;
        const res = await request.post(`${API_URL}/feed-sections/${id}/celebration/toggle`, { headers: authHeaders(token) });
        if (res.ok()) celebrations += 1;
      }
    }

    // Comentários: alguns posts ficam com conversa.
    let comments = 0;
    for (const [index, id] of ids.entries()) {
      if (index % 3 !== 0) continue;
      for (let n = 0; n < 1 + (index % 3); n += 1) {
        const res = await request.post(`${API_URL}/feed-sections/${id}/comments`, {
          headers: authHeaders(authors[(index + n) % 3]),
          data: commentBody(COMMENTS[(index + n) % COMMENTS.length]),
        });
        if (res.ok()) {
          comments += 1;
          // A massa de demonstração aparece publicada: o admin aprova cada comentário novo.
          await approveComment(request, admin, ((await res.json()) as { id: string }).id);
        }
      }
    }

    // Conferência no banco.
    const rows = await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE description LIKE ?", [`%${MARK}%`]);
    expect(Number(rows[0].n)).toBeGreaterThanOrEqual(POSTS);
    expect(celebrations).toBeGreaterThan(POSTS);
    expect(comments).toBeGreaterThan(5);
    console.log(`MASSA: ${POSTS} posts, ${celebrations} celebrações, ${comments} comentários na galeria ${pageId}`);
  });

  test("apaga a massa (só o que tem a marca)", async ({ request }) => {
    test.skip(!CLEAN, "só com FEED_SEED_CLEAN=1");
    const admin = (await loginAs(request, "admin")).accessToken;
    const rows = await queryAll<{ id: string }>("SELECT id FROM image_sections WHERE description LIKE ?", [`%${MARK}%`]);
    for (const row of rows) {
      const res = await request.delete(`${API_URL}/image-sections/${row.id}`, { headers: authHeaders(admin) });
      expect([200, 204]).toContain(res.status());
    }
    const left = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE description LIKE ?", [`%${MARK}%`]);
    expect(Number(left?.n)).toBe(0);
  });
});
