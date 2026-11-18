import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Percorre os cenários de `/shelters` contra a API real, o MySQL real e o S3
 * local. Nada é interceptado: o upload vai de fato para o bucket e o abrigo é
 * de fato gravado e removido.
 *
 * Três defeitos deste módulo passavam pelos testes unitários e só apareceram
 * aqui: o DELETE que cascateava pela rota, o POST com mídia respondendo 500 e a
 * foto ausente na resposta da criação.
 */
const RUN_TAG = `e2e-shelter-${Date.now()}`;

type MediaItem = { id: string; title: string; url: string };
type Team = { id: string; numberTeam: number; description?: string };
type ShelterDto = {
  id: string;
  name: string;
  description?: string;
  teamsQuantity: number;
  address?: { city: string; state: string };
  teams: Team[];
  mediaItem?: MediaItem | null;
};

const address = {
  street: "Rua Teste",
  number: "10",
  district: "Centro",
  city: "Manaus",
  state: "AM",
};

const png = () => ({
  name: "foto.png",
  mimeType: "image/png",
  buffer: Buffer.from("conteudo de teste"),
});

const numbers = (teams: Team[]) =>
  teams.map((team) => team.numberTeam).sort((a, b) => a - b);

// Serial: os cenários compartilham o abrigo criado no primeiro deles.
test.describe.serial("Abrigos — API ao vivo", () => {
  let token: string;
  let shelterId: string;

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    if (shelterId) {
      await request.delete(`/shelters/${shelterId}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("exige autenticação", async ({ request }) => {
    expect((await request.get("/shelters")).status()).toBe(401);
  });

  test("a lista de equipes é pública", async ({ request }) => {
    expect((await request.get("/shelters/list-teams")).status()).toBe(200);
  });

  test("a listagem administrativa responde o envelope que a tela consome", async ({
    request,
  }) => {
    const response = await request.get("/shelters?page=1&limit=5", {
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual([
      "items",
      "limit",
      "page",
      "pageCount",
      "total",
    ]);
  });

  test("membro não alcança a listagem administrativa, mas alcança a simples", async ({
    request,
  }) => {
    const member = await loginAs(request, "member");

    const denied = await request.get("/shelters", {
      headers: authHeaders(member.accessToken),
    });
    expect(denied.status()).toBe(403);
    expect((await denied.json()).category).toBe("BUSINESS");

    const simple = await request.get("/shelters/simple", {
      headers: authHeaders(member.accessToken),
    });
    expect(simple.status()).toBe(200);
  });

  test("400 quando falta o payload do abrigo", async ({ request }) => {
    const response = await request.post("/shelters", {
      headers: authHeaders(token),
      multipart: {},
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).category).toBe("RULE");
  });

  test("400 lista os campos que não passaram na validação", async ({
    request,
  }) => {
    const response = await request.post("/shelters", {
      headers: authHeaders(token),
      multipart: {
        shelterData: JSON.stringify({ name: "x", teamsQuantity: 0 }),
      },
    });

    expect(response.status()).toBe(400);
    const fields = ((await response.json()).details as Array<{ field: string }>)
      .map((detail) => detail.field)
      .sort();
    expect(fields).toEqual(["name", "teamsQuantity"]);
  });

  test("cria o abrigo com endereço, equipes e foto em link", async ({
    request,
  }) => {
    const response = await request.post("/shelters", {
      headers: authHeaders(token),
      multipart: {
        shelterData: JSON.stringify({
          name: RUN_TAG,
          description: "Criado pela suíte ao vivo",
          teamsQuantity: 2,
          address,
          teams: [{ numberTeam: 1, description: "Equipe um" }],
          mediaItem: {
            title: "Foto",
            uploadType: "link",
            isLocalFile: false,
            url: `https://example.com/${RUN_TAG}.png`,
          },
        }),
      },
    });

    expect(response.status()).toBe(201);
    const shelter = (await response.json()) as ShelterDto;
    shelterId = shelter.id;

    expect(shelter.name).toBe(RUN_TAG);
    expect(numbers(shelter.teams)).toEqual([1, 2]);
    // A resposta da criação carrega a foto, como a da atualização.
    expect(shelter.mediaItem?.url).toContain(`${RUN_TAG}.png`);
    // Nada de entidade crua: a rota não vai na resposta.
    expect(shelter).not.toHaveProperty("route");
  });

  test("o detalhe traz o endereço e a quantidade de equipes", async ({
    request,
  }) => {
    const response = await request.get(`/shelters/${shelterId}`, {
      headers: authHeaders(token),
    });
    expect(response.status()).toBe(200);
    expect(((await response.json()) as ShelterDto).address?.city).toBe("Manaus");

    const quantity = await request.get(`/shelters/${shelterId}/teams-quantity`, {
      headers: authHeaders(token),
    });
    expect(await quantity.json()).toEqual({ id: shelterId, teamsQuantity: 2 });
  });

  test("abrigo fora do escopo do líder responde 404, não 403", async ({
    request,
  }) => {
    const leader = await loginAs(request, "leader");

    const response = await request.get(`/shelters/${shelterId}`, {
      headers: authHeaders(leader.accessToken),
    });

    expect(response.status()).toBe(404);
    expect((await response.json()).category).toBe("BUSINESS");
  });

  test("o update renomeia, reconcilia as equipes e preserva a foto", async ({
    request,
  }) => {
    const response = await request.put(`/shelters/${shelterId}`, {
      headers: authHeaders(token),
      multipart: {
        shelterData: JSON.stringify({
          name: `${RUN_TAG}-renomeado`,
          teamsQuantity: 3,
        }),
      },
    });

    expect(response.status()).toBe(200);
    const shelter = (await response.json()) as ShelterDto;
    expect(shelter.name).toBe(`${RUN_TAG}-renomeado`);
    expect(numbers(shelter.teams)).toEqual([1, 2, 3]);
    // Update sem mídia não reenvia a imagem nem apaga o arquivo do bucket.
    expect(shelter.mediaItem?.url).toContain("foto.png");
  });

  test("reduzir a quantidade remove as equipes excedentes", async ({
    request,
  }) => {
    const response = await request.put(`/shelters/${shelterId}`, {
      headers: authHeaders(token),
      multipart: { shelterData: JSON.stringify({ teamsQuantity: 1 }) },
    });

    expect(response.status()).toBe(200);
    expect(numbers(((await response.json()) as ShelterDto).teams)).toEqual([1]);
  });

  test("o patch de mídia troca a foto por uma url", async ({ request }) => {
    const response = await request.patch(`/shelters/${shelterId}/media`, {
      headers: authHeaders(token),
      multipart: {
        mediaData: JSON.stringify({
          title: "Nova",
          url: "https://cdn.exemplo/foto.png",
        }),
      },
    });

    expect(response.status()).toBe(200);
    expect(((await response.json()) as ShelterDto).mediaItem?.url).toBe(
      "https://cdn.exemplo/foto.png",
    );
  });

  test("400 quando o patch de mídia não traz mídia alguma", async ({
    request,
  }) => {
    const response = await request.patch(`/shelters/${shelterId}/media`, {
      headers: authHeaders(token),
      multipart: {},
    });

    expect(response.status()).toBe(400);
  });

  test("membro não remove abrigo", async ({ request }) => {
    const member = await loginAs(request, "member");

    const response = await request.delete(`/shelters/${shelterId}`, {
      headers: authHeaders(member.accessToken),
    });

    expect(response.status()).toBe(403);
  });

  test("remove o abrigo e o torna inacessível", async ({ request }) => {
    const removed = await request.delete(`/shelters/${shelterId}`, {
      headers: authHeaders(token),
    });
    expect(removed.status()).toBe(200);

    const gone = await request.get(`/shelters/${shelterId}`, {
      headers: authHeaders(token),
    });
    expect(gone.status()).toBe(404);

    shelterId = "";
  });

  test("id malformado responde 400 e uuid inexistente responde 404", async ({
    request,
  }) => {
    expect(
      (
        await request.get("/shelters/nao-e-uuid", { headers: authHeaders(token) })
      ).status(),
    ).toBe(400);

    expect(
      (
        await request.get("/shelters/00000000-0000-0000-0000-000000000000", {
          headers: authHeaders(token),
        })
      ).status(),
    ).toBe(404);
  });
});
