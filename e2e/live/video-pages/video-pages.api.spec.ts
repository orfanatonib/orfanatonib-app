import { API_URL } from "../../../playwright.live.config";
import { expectNoRow, expectRow } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Testes E2E ao vivo do contrato da API `/video-pages`.
 * Valida criação, listagem, busca por id, atualização e deleção de galerias de vídeos.
 */
const RUN_TAG = `e2e-${Date.now()}`;

type VideoPageResponse = {
  id: string;
  title: string;
  description: string;
  public: boolean;
  route: {
    title: string;
    path: string;
  };
  videos: Array<{
    id: string;
    url: string;
    platformType?: string;
  }>;
};

test.describe.serial("Video Pages — API ao vivo", () => {
  let adminToken: string;
  let createdPageId: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
  });

  test("a rota POST /video-pages exige autenticação", async ({ request }) => {
    const response = await request.post(`${API_URL}/video-pages`, {
      multipart: {
        videosPageData: JSON.stringify({
          title: `Vídeos ${RUN_TAG}`,
          description: "Descrição E2E",
          public: true,
          videos: [],
        }),
      },
    });
    expect(response.status()).toBe(401);
  });

  test("a rota GET /video-pages permite acesso público", async ({ request }) => {
    const response = await request.get(`${API_URL}/video-pages`);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as VideoPageResponse[];
    expect(Array.isArray(body)).toBe(true);
  });

  test("[video-page.post.video-pages#feliz] cria uma nova galeria de vídeos", async ({ request }) => {
    const payload = {
      title: `Galeria de Vídeos E2E ${RUN_TAG}`,
      description: "Vídeos institucionais de teste",
      public: true,
      videos: [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          uploadType: "link",
          platformType: "youtube",
          mediaType: "video",
          isLocalFile: false,
          title: "Vídeo 1",
          description: "Descrição do Vídeo 1",
        },
      ],
    };

    const response = await request.post(`${API_URL}/video-pages`, {
      headers: authHeaders(adminToken),
      multipart: {
        videosPageData: JSON.stringify(payload),
      },
    });

    expect(response.status()).toBe(201);
    const body = (await response.json()) as VideoPageResponse;
    expect(body.id).toBeTruthy();
    expect(body.title).toBe(payload.title);
    expect(body.description).toBe(payload.description);
    expect(body.public).toBe(true);
    expect(body.videos.length).toBe(1);

    createdPageId = body.id;
    await expectRow("videos_pages", { id: createdPageId });
  });

  test("busca a galeria de vídeos recém-criada por ID", async ({ request }) => {
    expect(createdPageId, "a criação do teste anterior precisa ter funcionado").toBeTruthy();

    const response = await request.get(`${API_URL}/video-pages/${createdPageId}`);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as VideoPageResponse;
    expect(body.id).toBe(createdPageId);
  });

  test("[video-page.patch.video-pages-id#feliz] atualiza a galeria de vídeos", async ({ request }) => {
    expect(createdPageId, "a criação do teste anterior precisa ter funcionado").toBeTruthy();

    const payload = {
      id: createdPageId,
      title: `Galeria de Vídeos E2E Atualizada ${RUN_TAG}`,
      description: "Descrição atualizada",
      public: true,
      videos: [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          uploadType: "link",
          platformType: "youtube",
          mediaType: "video",
          isLocalFile: false,
          title: "Vídeo 1 Atualizado",
          description: "Descrição do Vídeo 1 Atualizado",
        },
      ],
    };

    const response = await request.patch(`${API_URL}/video-pages/${createdPageId}`, {
      headers: authHeaders(adminToken),
      multipart: {
        videosPageData: JSON.stringify(payload),
      },
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as VideoPageResponse;
    expect(body.title).toBe(payload.title);
    await expectRow("videos_pages", { id: createdPageId });
  });

  test("[video-page.delete.video-pages-id#feliz] remove a galeria de vídeos", async ({ request }) => {
    expect(createdPageId, "a criação do teste anterior precisa ter funcionado").toBeTruthy();

    const response = await request.delete(`${API_URL}/video-pages/${createdPageId}`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    await expectNoRow("videos_pages", { id: createdPageId });
  });
});
