import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Contratos de `/ideas-sections` contra a API real, o MySQL real e o S3 local.
 *
 * Quatro defeitos deste módulo só apareceram aqui: a criação com mídia
 * respondendo 400 do banco, o `JSON.parse` virando 500 com stack, as leituras
 * abertas ao público e o PATCH inserindo uma seção nova a cada chamada.
 */
const RUN_TAG = `e2e-ideia-${Date.now()}`;

type MediaDto = {
  id: string;
  title: string;
  description: string;
  uploadType: "upload" | "link";
  mediaType: "video" | "document" | "image";
  isLocalFile: boolean;
  url: string;
};

type SectionDto = {
  id: string;
  title: string;
  description: string;
  public: boolean;
  medias: MediaDto[];
  user?: { name: string; email: string; phone?: string };
};

const png = () => ({
  name: "foto.png",
  mimeType: "image/png",
  buffer: Buffer.from("conteudo de teste"),
});

const payload = (data: Record<string, unknown>) => JSON.stringify(data);

test.describe.serial("Ideias compartilhadas — API ao vivo", () => {
  let admin: string;
  let member: string;
  let sectionId = "";

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    if (sectionId) {
      await request.delete(`/ideas-sections/${sectionId}`, {
        headers: authHeaders(admin),
      });
    }
  });

  test("as leituras exigem autenticação", async ({ request }) => {
    // A seção carrega nome, e-mail e telefone de quem a enviou, e as duas
    // leituras estavam abertas a qualquer visitante anônimo.
    expect((await request.get("/ideas-sections")).status()).toBe(401);
    expect(
      (
        await request.get(
          "/ideas-sections/11111111-1111-1111-1111-111111111111",
        )
      ).status(),
    ).toBe(401);
  });

  test("id fora do formato UUID responde 400", async ({ request }) => {
    const response = await request.get("/ideas-sections/nao-e-uuid", {
      headers: authHeaders(admin),
    });

    expect(response.status()).toBe(400);
  });

  test("400 quando falta o payload", async ({ request }) => {
    const response = await request.post("/ideas-sections", {
      headers: authHeaders(member),
      multipart: {},
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).category).toBe("RULE");
  });

  test("JSON quebrado responde 400 sem stack trace no corpo", async ({
    request,
  }) => {
    const response = await request.post("/ideas-sections", {
      headers: authHeaders(member),
      multipart: { sectionData: "{" },
    });

    expect(response.status()).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain("stack");
  });

  test("400 lista os campos que não passaram na validação", async ({
    request,
  }) => {
    const response = await request.post("/ideas-sections", {
      headers: authHeaders(member),
      multipart: { sectionData: payload({ medias: [] }) },
    });

    expect(response.status()).toBe(400);
    const fields = ((await response.json()).details as Array<{ field: string }>)
      .map((detail) => detail.field)
      .sort();
    expect(fields).toEqual(["description", "title"]);
  });

  test("400 quando o upload não traz o arquivo", async ({ request }) => {
    const response = await request.post("/ideas-sections", {
      headers: authHeaders(member),
      multipart: {
        sectionData: payload({
          title: RUN_TAG,
          description: "x",
          medias: [
            {
              uploadType: "upload",
              mediaType: "image",
              isLocalFile: true,
              fieldKey: "foto",
              title: "Foto",
            },
          ],
        }),
      },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toContain("Arquivo ausente");
  });

  test("um membro compartilha uma ideia com mídias em link", async ({
    request,
  }) => {
    const response = await request.post("/ideas-sections", {
      headers: authHeaders(member),
      multipart: {
        sectionData: payload({
          title: RUN_TAG,
          description: "Enviada pela suíte ao vivo",
          public: true,
          medias: [
            {
              uploadType: "link",
              mediaType: "video",
              isLocalFile: false,
              url: "https://youtu.be/abc",
              platformType: "youtube",
              title: "Vídeo",
              description: "Vídeo da ideia",
            },
            {
              uploadType: "link",
              mediaType: "image",
              isLocalFile: false,
              url: "https://example.com/foto.png",
              title: "Foto",
              description: "Foto da ideia",
            },
          ],
        }),
      },
    });

    expect(response.status()).toBe(201);
    const section = (await response.json()) as SectionDto;
    sectionId = section.id;

    expect(section.title).toBe(RUN_TAG);
    expect(section.medias).toHaveLength(2);
    expect(
      section.medias.find((media) => media.mediaType === "image")?.url,
    ).toContain("foto.png");
    // A resposta traz o autor: antes vinha `user: { name: "" }`.
    expect(section.user?.email).toBe("e2e.member@orfanatonib.test");
    // Nada de entidade crua: a página não vai na resposta.
    expect(section).not.toHaveProperty("page");
  });

  test("a ideia aparece na listagem das não publicadas", async ({
    request,
  }) => {
    const response = await request.get("/ideas-sections", {
      headers: authHeaders(admin),
    });

    expect(response.status()).toBe(200);
    const sections = (await response.json()) as SectionDto[];
    const created = sections.find((section) => section.id === sectionId);

    expect(created?.medias).toHaveLength(2);
  });

  test("o detalhe traz a seção com as mídias", async ({ request }) => {
    const response = await request.get(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(admin),
    });

    expect(response.status()).toBe(200);
    expect(((await response.json()) as SectionDto).medias).toHaveLength(2);
  });

  test("[ideas-section.get.ideas-sections#perfil-membro] [ideas-section.get.ideas-sections-id#perfil-membro] membro não lê a fila de ideias nem o detalhe (traz nome, e-mail e telefone do autor)", async ({
    request,
  }) => {
    const list = await request.get("/ideas-sections", {
      headers: authHeaders(member),
    });
    expect(list.status()).toBe(403);
    // a recusa não devolve nenhum dado da fila
    expect(await list.text()).not.toContain("@");

    const detail = await request.get(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(member),
    });
    expect(detail.status()).toBe(403);
    expect(await detail.text()).not.toContain("@");
  });

  test("membro não edita nem remove ideia alguma", async ({ request }) => {
    const update = await request.patch(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(member),
      multipart: {
        sectionData: payload({ title: "x", description: "y", medias: [] }),
      },
    });
    expect(update.status()).toBe(403);

    const remove = await request.delete(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(member),
    });
    expect(remove.status()).toBe(403);
  });

  test("o PATCH edita a seção no lugar, sem criar outra", async ({
    request,
  }) => {
    const before = (await (
      await request.get("/ideas-sections", { headers: authHeaders(admin) })
    ).json()) as SectionDto[];

    const response = await request.patch(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(admin),
      multipart: {
        sectionData: payload({
          title: `${RUN_TAG}-editada`,
          description: "Editada",
          medias: [],
        }),
      },
    });

    expect(response.status()).toBe(200);
    const updated = (await response.json()) as SectionDto;

    // O método anterior salvava um objeto sem `id`: cada PATCH inseria uma
    // seção nova, devolvia outro id e deixava a original órfã no banco.
    expect(updated.id).toBe(sectionId);
    expect(updated.title).toBe(`${RUN_TAG}-editada`);

    const after = (await (
      await request.get("/ideas-sections", { headers: authHeaders(admin) })
    ).json()) as SectionDto[];
    expect(after).toHaveLength(before.length);
  });

  test("a lista de mídias enviada é a verdade sobre a seção", async ({
    request,
  }) => {
    const detail = (await (
      await request.get(`/ideas-sections/${sectionId}`, {
        headers: authHeaders(admin),
      })
    ).json()) as SectionDto;

    // O PATCH anterior mandou `medias: []`, então nada sobrou.
    expect(detail.medias).toEqual([]);
  });

  test("404 ao editar seção inexistente", async ({ request }) => {
    const response = await request.patch(
      "/ideas-sections/11111111-1111-1111-1111-111111111111",
      {
        headers: authHeaders(admin),
        multipart: {
          sectionData: payload({ title: "a", description: "b", medias: [] }),
        },
      },
    );

    expect(response.status()).toBe(404);
    expect((await response.json()).category).toBe("BUSINESS");
  });

  test("404 ao vincular a uma página que não existe", async ({ request }) => {
    const response = await request.patch(
      `/ideas-sections/${sectionId}/attach/11111111-1111-1111-1111-111111111111`,
      {
        headers: authHeaders(admin),
        multipart: {
          sectionData: payload({ title: "a", description: "b", medias: [] }),
        },
      },
    );

    expect(response.status()).toBe(404);
  });

  test("404 ao remover seção inexistente", async ({ request }) => {
    const response = await request.delete(
      "/ideas-sections/11111111-1111-1111-1111-111111111111",
      { headers: authHeaders(admin) },
    );

    expect(response.status()).toBe(404);
  });

  test("a remoção apaga a seção de verdade", async ({ request }) => {
    const response = await request.delete(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(admin),
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).message).toContain("removida");

    const detail = await request.get(`/ideas-sections/${sectionId}`, {
      headers: authHeaders(admin),
    });
    expect(detail.status()).toBe(404);

    sectionId = "";
  });
});
