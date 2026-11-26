import { authHeaders, expect, loginAs, test } from "../support/live";
import { queryOne } from "../support/db";

/**
 * Percorre os cenários de `/visit-material-pages` contra a API real, o MySQL
 * real e o S3 local. Nada é interceptado: os uploads vão de fato para o bucket.
 */
const RUN_TAG = `e2e-${Date.now()}`;
const TITLE = `Gênesis ${RUN_TAG}`;

type MediaItem = {
  id: string;
  title: string;
  url: string;
  isLocalFile?: boolean;
  mediaType: string;
};
type PageDto = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  testament: string;
  currentWeek: boolean;
  route: { id: string; path: string; title: string };
  videos: MediaItem[];
  documents: MediaItem[];
  images: MediaItem[];
  audios: MediaItem[];
};

const linkVideo = (url: string, id?: string) => ({
  ...(id ? { id } : {}),
  title: "Vídeo da visita",
  description: "Descrição",
  uploadType: "link",
  mediaType: "video",
  isLocalFile: false,
  url,
  platformType: "youtube",
});

const uploadDocument = (fieldKey: string) => ({
  title: "Documento da visita",
  description: "Descrição",
  uploadType: "upload",
  mediaType: "document",
  isLocalFile: true,
  fieldKey,
});

const pdf = () => ({
  name: "material.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 conteudo de teste"),
});

// Serial: os cenários compartilham a página criada no primeiro deles.
test.describe.serial("Materiais de visita — API ao vivo", () => {
  let token: string;
  let pageId: string;

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    if (pageId) {
      await request.delete(`/visit-material-pages/${pageId}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("exige autenticação", async ({ request }) => {
    expect((await request.get("/visit-material-pages")).status()).toBe(401);
  });

  test("recusa escrita de quem não é admin", async ({ request }) => {
    const member = await loginAs(request, "member");
    const response = await request.post("/visit-material-pages", {
      headers: authHeaders(member.accessToken),
      multipart: {
        visitMaterialsPageData: JSON.stringify({
          pageTitle: "x",
          pageSubtitle: "y",
          pageDescription: "z",
        }),
      },
    });

    expect(response.status()).toBe(403);
  });

  test("current-material espelha o banco: o marcado como atual, ou vazio quando não há", async ({ request }) => {
    const current = await queryOne<{ id: string }>("SELECT id FROM visit_material_pages WHERE currentWeek = 1");
    const response = await request.get("/visit-material-pages/current-material", {
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    if (current) expect((JSON.parse(body) as { id: string }).id).toBe(current.id);
    else expect(body === "" || body === "null").toBe(true);
  });

  test("cria a página com mídias em link", async ({ request }) => {
    const response = await request.post("/visit-material-pages", {
      headers: authHeaders(token),
      multipart: {
        visitMaterialsPageData: JSON.stringify({
          pageTitle: TITLE,
          pageSubtitle: "O início de todas as coisas",
          pageDescription: "Estudo sobre Gênesis",
          testament: "OLD_TESTAMENT",
          videos: [linkVideo("https://youtube.test/a")],
          documents: [
            {
              title: "Documento da visita",
              description: "Descrição",
              uploadType: "link",
              mediaType: "document",
              isLocalFile: false,
              url: `https://example.com/material-${RUN_TAG}.pdf`,
            },
          ],
        }),
      },
    });

    expect(response.status()).toBe(201);
    const page = (await response.json()) as PageDto;
    pageId = page.id;

    expect(page.title).toBe(TITLE);
    expect(page.testament).toBe("OLD_TESTAMENT");
    expect(page.currentWeek).toBe(false);
    // Os quatro acervos vêm sempre, mesmo vazios.
    expect(page.videos).toHaveLength(1);
    expect(page.documents).toHaveLength(1);
    expect(page.images).toEqual([]);
    expect(page.audios).toEqual([]);
    expect(page.documents[0].isLocalFile).toBe(false);
    expect(page.documents[0].url).toContain(`material-${RUN_TAG}.pdf`);
    expect(page.videos[0].isLocalFile).toBe(false);
    // A rota pública é criada junto, com o prefixo do módulo.
    expect(page.route.path).toMatch(/^materiais_visita_/);
  });

  test("lê a página criada com sua mídia", async ({ request }) => {
    const page = (await (
      await request.get(`/visit-material-pages/${pageId}`, { headers: authHeaders(token) })
    ).json()) as PageDto;

    expect(page.id).toBe(pageId);
    expect(page.videos).toHaveLength(1);
    expect(page.documents).toHaveLength(1);
  });

  test("filtra por testamento e por texto", async ({ request }) => {
    const find = async (query: string) =>
      ((await (
        await request.get(`/visit-material-pages${query}`, { headers: authHeaders(token) })
      ).json()) as PageDto[]).some((page) => page.id === pageId);

    expect(await find("?testament=OLD_TESTAMENT")).toBe(true);
    expect(await find("?testament=NEW_TESTAMENT")).toBe(false);
    expect(await find(`?searchString=${encodeURIComponent(RUN_TAG)}`)).toBe(true);
    expect(await find("?searchString=inexistente-zzz")).toBe(false);
  });

  test("rejeita um testamento fora do enum", async ({ request }) => {
    const response = await request.get("/visit-material-pages?testament=GOSPEL", {
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(400);
  });

  test("atualiza campos, troca o testamento e espelha na rota", async ({ request }) => {
    const current = (await (
      await request.get(`/visit-material-pages/${pageId}`, { headers: authHeaders(token) })
    ).json()) as PageDto;

    const response = await request.patch(`/visit-material-pages/${pageId}`, {
      headers: authHeaders(token),
      multipart: {
        visitMaterialsPageData: JSON.stringify({
          id: pageId,
          pageTitle: `${TITLE} editado`,
          pageSubtitle: "Subtítulo editado",
          pageDescription: "Descrição editada",
          currentWeek: false,
          testament: "NEW_TESTAMENT",
          videos: [linkVideo("https://youtube.test/b", current.videos[0].id)],
          documents: [],
        }),
      },
    });

    expect(response.status()).toBe(200);
    const page = (await response.json()) as PageDto;
    expect(page.title).toBe(`${TITLE} editado`);
    expect(page.testament).toBe("NEW_TESTAMENT");
    // Acervo esvaziado é apagado; o vídeo mantido é atualizado.
    expect(page.documents).toEqual([]);
    expect(page.videos).toHaveLength(1);
    expect(page.videos[0].url).toBe("https://youtube.test/b");
    expect(page.route.title).toBe(`${TITLE} editado`);
  });

  test("promove a página a material atual e a devolve", async ({ request }) => {
    const response = await request.post(
      `/visit-material-pages/current-material/${pageId}`,
      { headers: authHeaders(token) },
    );

    expect(response.status()).toBe(201);
    const page = (await response.json()) as PageDto;
    expect(page.id).toBe(pageId);
    expect(page.currentWeek).toBe(true);

    const current = (await (
      await request.get("/visit-material-pages/current-material", {
        headers: authHeaders(token),
      })
    ).json()) as PageDto;
    expect(current.id).toBe(pageId);
    expect(Array.isArray(current.videos)).toBe(true);
  });

  test.describe("erros", () => {
    test("404 para id inexistente", async ({ request }) => {
      const response = await request.get(
        "/visit-material-pages/6f1c3c62-0f6a-4f4b-9a3f-0b5f7f2a1d11",
        { headers: authHeaders(token) },
      );

      expect(response.status()).toBe(404);
      expect((await response.json()).category).toBe("BUSINESS");
    });

    test("400 para id fora do formato UUID", async ({ request }) => {
      const response = await request.get("/visit-material-pages/nao-e-uuid", {
        headers: authHeaders(token),
      });

      expect(response.status()).toBe(400);
    });

    test("400 para JSON malformado no campo multipart", async ({ request }) => {
      const response = await request.post("/visit-material-pages", {
        headers: authHeaders(token),
        multipart: { visitMaterialsPageData: "{ json quebrado" },
      });

      expect(response.status()).toBe(400);
    });

    test("400 quando falta o campo do payload", async ({ request }) => {
      const response = await request.post("/visit-material-pages", {
        headers: authHeaders(token),
        multipart: { outroCampo: "x" },
      });

      expect(response.status()).toBe(400);
    });

    test("400 quando o payload não passa na validação", async ({ request }) => {
      const response = await request.post("/visit-material-pages", {
        headers: authHeaders(token),
        multipart: { visitMaterialsPageData: JSON.stringify({ pageTitle: "só o título" }) },
      });

      expect(response.status()).toBe(400);
    });

    test("400 quando o arquivo do fieldKey não foi enviado", async ({ request }) => {
      const response = await request.post("/visit-material-pages", {
        headers: authHeaders(token),
        multipart: {
          visitMaterialsPageData: JSON.stringify({
            pageTitle: "sem arquivo",
            pageSubtitle: "y",
            pageDescription: "z",
            documents: [uploadDocument("ausente")],
          }),
        },
      });

      expect(response.status()).toBe(400);
      expect(JSON.stringify(await response.json())).toContain("Arquivo ausente");
    });

    test("400 quando um upload não declara fieldKey", async ({ request }) => {
      const response = await request.post("/visit-material-pages", {
        headers: authHeaders(token),
        multipart: {
          visitMaterialsPageData: JSON.stringify({
            pageTitle: "sem fieldKey",
            pageSubtitle: "y",
            pageDescription: "z",
            documents: [{ ...uploadDocument("x"), fieldKey: undefined }],
          }),
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test("remove a página e a torna inacessível", async ({ request }) => {
    expect(
      (
        await request.delete(`/visit-material-pages/${pageId}`, {
          headers: authHeaders(token),
        })
      ).ok(),
    ).toBe(true);

    expect(
      (
        await request.get(`/visit-material-pages/${pageId}`, { headers: authHeaders(token) })
      ).status(),
    ).toBe(404);

    // Segunda remoção é 404, não uma falha genérica.
    expect(
      (
        await request.delete(`/visit-material-pages/${pageId}`, {
          headers: authHeaders(token),
        })
      ).status(),
    ).toBe(404);

    pageId = "";
  });
});
