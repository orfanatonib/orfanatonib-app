import { API_URL } from "../../../playwright.live.config";
import {
  authHeaders,
  expect,
  loginAs,
  seedBrowserSession,
  test,
} from "../support/live";

/**
 * Telas de frequência contra a pilha real: API NestJS, MySQL e sessão obtida
 * por login de verdade. Nada é interceptado — o que a tela mostra veio do
 * banco.
 *
 * A suíte monta a própria hierarquia pela API (abrigo, equipe, membro
 * vinculado e visita no passado) porque um cenário que pula não prova nada.
 * O `DELETE /shelters/:id` do final cascateia a equipe e o agendamento e
 * devolve o membro ao estado sem equipe.
 */
const RUN_TAG = `e2e-presenca-${Date.now()}`;
const MEMBER_EMAIL = "e2e.member@orfanatonib.test";

/** Data local em ISO e em pt-BR, das mesmas partes — sem passar por UTC. */
const daysAgo = (days: number): { iso: string; br: string } => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return { iso: `${year}-${month}-${day}`, br: `${day}/${month}/${year}` };
};

const VISIT = daysAgo(10);
const MEETING = daysAgo(11);

type ShelterTeams = {
  shelterId: string;
  shelterName: string;
  teams: Array<{
    teamId: string;
    teamNumber: number;
    members: Array<{ id: string; name: string }>;
  }>;
};

type AttendanceRecords = {
  data: Array<{
    memberId: string;
    scheduleId: string;
    category: string;
    type: string;
  }>;
  meta: { total: number };
};

test.describe.serial("Frequência — UI ao vivo", () => {
  let token: string;
  let shelterId = "";
  let teamId = "";
  let memberProfileId = "";
  let memberUserId = "";

  /**
   * A tela abre num seletor: "Listar" ou "Lançar". A hierarquia de abrigos só
   * é carregada no modo de lançamento.
   */
  const openRegisterMode = async (
    page: import("@playwright/test").Page,
  ): Promise<void> => {
    await page.goto("/adm/presenca");
    await page.getByTestId("attendance-mode-register").click();
    await expect(page.getByTestId("attendance-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("attendance-shelters")).toBeVisible({
      timeout: 20_000,
    });
  };

  /**
   * Entra na equipe criada por esta suíte. Filtrada a um único abrigo, a tela
   * o expande sozinha — clicar no cabeçalho aqui fecharia a lista.
   */
  const openTeam = async (
    page: import("@playwright/test").Page,
  ): Promise<void> => {
    await openRegisterMode(page);
    await page.getByTestId("attendance-search").fill(RUN_TAG);

    const teamCard = page.getByTestId(`attendance-team-${teamId}`);
    await expect(teamCard).toBeVisible({ timeout: 10_000 });
    await teamCard.click();

    await expect(page.getByTestId("team-attendance-page")).toBeVisible({
      timeout: 20_000,
    });
  };

  test.beforeAll(async ({ request }) => {
    token = (await loginAs(request, "admin")).accessToken;

    const shelterResponse = await request.post(`${API_URL}/shelters`, {
      headers: authHeaders(token),
      multipart: {
        shelterData: JSON.stringify({
          name: RUN_TAG,
          description: "Abrigo da suíte de frequência",
          teamsQuantity: 1,
          address: {
            street: "Rua Teste",
            number: "10",
            district: "Centro",
            city: "Manaus",
            state: "AM",
          },
          teams: [{ numberTeam: 1, description: "Equipe E2E" }],
        }),
      },
    });
    expect(shelterResponse.status()).toBe(201);
    const shelter = (await shelterResponse.json()) as {
      id: string;
      teams: Array<{ id: string }>;
    };
    shelterId = shelter.id;
    teamId = shelter.teams[0].id;

    const membersResponse = await request.get(
      `${API_URL}/member-profiles?memberSearchString=${MEMBER_EMAIL}&limit=1`,
      { headers: authHeaders(token) },
    );
    const members = (await membersResponse.json()) as {
      items: Array<{ id: string; user: { id: string } }>;
    };
    expect(
      members.items.length,
      `A conta ${MEMBER_EMAIL} não tem perfil de membro. Rode: (cd ../orfanatonib-api && npm run seed:local)`,
    ).toBe(1);
    memberProfileId = members.items[0].id;
    memberUserId = members.items[0].user.id;

    // Vincular à equipe: sem membro, não há o que lançar nem o que pendurar.
    const linkResponse = await request.put(
      `${API_URL}/member-profiles/${memberProfileId}`,
      {
        headers: authHeaders(token),
        data: { shelterId, numberTeam: 1 },
      },
    );
    expect(linkResponse.status()).toBe(200);

    // Visita já realizada: gera pendência de lançamento e de relatório.
    const scheduleResponse = await request.post(
      `${API_URL}/shelter-schedules`,
      {
        headers: authHeaders(token),
        data: {
          visitNumber: 1,
          visitDate: VISIT.iso,
          meetingDate: MEETING.iso,
          lessonContent: `Lição ${RUN_TAG}`,
          teamId,
        },
      },
    );
    expect(scheduleResponse.status()).toBe(201);
  });

  test.afterAll(async ({ request }) => {
    if (!shelterId) return;
    // Cascateia equipe e agendamento; o vínculo do membro volta a ser nulo.
    await request.delete(`${API_URL}/shelters/${shelterId}`, {
      headers: authHeaders(token),
    });
  });

  test("a hierarquia criada pela API chega inteira na tela", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));

    const response = await request.get(
      `${API_URL}/attendance/leader/teams/members`,
      { headers: authHeaders(token) },
    );
    const hierarchy = (await response.json()) as ShelterTeams[];
    const created = hierarchy.find((item) => item.shelterId === shelterId);
    expect(created?.teams[0].members.map((member) => member.id)).toEqual([
      memberUserId,
    ]);

    await page.goto("/adm/presenca");
    await expect(page.getByTestId("attendance-mode-list")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId("attendance-mode-register").click();

    await expect(page.getByTestId("attendance-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("attendance-shelters")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("attendance-loading")).toHaveCount(0);
    await expect(
      page.getByText(RUN_TAG, { exact: false }).first(),
    ).toBeVisible();
  });

  test("a busca filtra os abrigos e o vazio aparece sem resultado", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await openRegisterMode(page);

    await page.getByTestId("attendance-search").fill(RUN_TAG);
    await expect(
      page.getByText(RUN_TAG, { exact: false }).first(),
    ).toBeVisible();

    await page.getByTestId("attendance-search").fill("zzz-nao-existe-zzz");
    await expect(page.getByTestId("attendance-empty")).toBeVisible();
  });

  test("o cabeçalho do abrigo abre e fecha a lista de equipes", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await openRegisterMode(page);
    await page.getByTestId("attendance-search").fill(RUN_TAG);

    const teamCard = page.getByTestId(`attendance-team-${teamId}`);
    // Um único abrigo no filtro: a tela já o mostra aberto.
    await expect(teamCard).toBeVisible({ timeout: 10_000 });

    const toggle = page.getByTestId(`attendance-shelter-toggle-${shelterId}`);
    await toggle.click();
    await expect(teamCard).toBeHidden();

    await toggle.click();
    await expect(teamCard).toBeVisible();
  });

  test("entrar na equipe mostra o membro vinculado pela API", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await openTeam(page);

    await expect(page.getByTestId("attendance-shelters")).toHaveCount(0);
    await expect(
      page.getByTestId(`team-attendance-member-${memberUserId}`),
    ).toBeVisible();
  });

  test("a central de pendências mostra a equipe com lançamento em aberto", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/presenca/pendencias");

    await expect(page.getByTestId("pendings-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("pendings-loading")).toHaveCount(0);
    await expect(page.getByTestId("pendings-error")).toHaveCount(0);

    await page.getByTestId("pendings-search").fill(RUN_TAG);
    await expect(
      page.getByText(RUN_TAG, { exact: false }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("pendings-empty")).toHaveCount(0);
  });

  test("as datas na tela não voltam um dia", async ({ page, request }) => {
    const adminResult = await loginAs(request, "admin");
    await seedBrowserSession(page, adminResult);

    const response = await request.get(`${API_URL}/attendance/pending/all`, {
      headers: authHeaders(adminResult.accessToken),
    });
    const body = (await response.json()) as {
      visitReportPendings: Array<{
        teamId: string;
        pendings: Array<{ visitDate: string; visitDateFormatted: string }>;
      }>;
    };
    const pending = body.visitReportPendings
      .filter((team) => team.teamId === teamId)
      .flatMap((team) => team.pendings)
      .find((item) => item.visitDate === VISIT.iso);

    // A API formata a partir das partes da data, não de um Date em UTC.
    expect(pending?.visitDateFormatted).toBe(VISIT.br);

    await page.goto("/adm/relatorios/pendencias");
    await expect(page.getByTestId("visit-reports-pendings-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("visit-reports-pendings-list")).toBeVisible();

    // A data só aparece dois níveis abaixo: abrigo e depois equipe.
    await page.getByTestId(`visit-reports-shelter-${RUN_TAG}`).click();
    await page.waitForTimeout(500);
    await page.getByTestId(`visit-reports-team-${teamId}`).click();
    await page.waitForTimeout(500);

    // `new Date("2026-09-01")` era lido como UTC e exibido no fuso local,
    // mostrando o dia anterior em toda a tela.
    await expect(
      page.getByText(VISIT.br, { exact: false }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("lançar a presença pela tela grava no banco", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await openTeam(page);

    const before = (await (
      await request.get(`${API_URL}/attendance/records?teamId=${teamId}`, {
        headers: authHeaders(token),
      })
    ).json()) as AttendanceRecords;
    expect(before.meta.total).toBe(0);

    await page
      .getByRole("button", { name: "Marcar pendentes como presentes" })
      .click();
    const submit = page.getByTestId("team-attendance-submit");
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await submit.click();

    // A mensagem de sucesso precisa sobreviver ao recarregamento da
    // hierarquia — antes ela sumia junto com a tela.
    await expect(page.getByTestId("team-attendance-feedback")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("team-attendance-error")).toHaveCount(0);
    // A tela passa a oferecer edição, porque agora existe lançamento.
    await expect(page.getByTestId("team-attendance-existing")).toBeVisible();

    // O que a tela diz ter salvo precisa estar na API.
    const after = (await (
      await request.get(`${API_URL}/attendance/records?teamId=${teamId}`, {
        headers: authHeaders(token),
      })
    ).json()) as AttendanceRecords;
    expect(after.meta.total).toBe(1);
    expect(after.data[0].memberId).toBe(memberUserId);
    expect(after.data[0].type).toBe("present");
  });

  test("@mobile rotas, preenchimento e consulta em 375px", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await openTeam(page);
    await expect(page).toHaveURL(new RegExp(`/adm/presenca/equipes/${teamId}`));
    const card = page.getByTestId(`team-attendance-member-${memberUserId}`);
    await expect(card).toBeVisible();
    await page.screenshot({
      path: "/tmp/attendance-mobile-form.png",
      fullPage: true,
    });
    const submit = page.getByTestId("team-attendance-submit");
    await expect(submit).toBeDisabled();
    await card.getByRole("button", { name: "Faltou", exact: true }).click();
    await page.getByRole("tab", { name: "Consultar", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /continuar|ficar|cancelar/i })
      .click();
    await submit.click();
    await expect(page.getByTestId("team-attendance-feedback")).toBeVisible();
    const records = await request.get(
      `${API_URL}/attendance/records?teamId=${teamId}`,
      { headers: authHeaders(token) },
    );
    const body = (await records.json()) as AttendanceRecords;
    expect(
      body.data.find(
        (record) =>
          record.memberId === memberUserId && record.category === "visit",
      )?.type,
    ).toBe("absent");
    await page.reload();
    await expect(
      card.getByRole("button", { name: "Faltou", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("tab", { name: "Consultar", exact: true }).click();
    await expect(page).toHaveURL(/\/adm\/presenca\/consultar$/);
    await expect(page.getByTestId("attendance-history-page")).toBeVisible();
    await page.getByLabel("De", { exact: true }).fill(VISIT.iso);
    await page.getByLabel("Até", { exact: true }).fill(VISIT.iso);
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await page.getByLabel("Buscar abrigo, equipe ou conteúdo").fill(RUN_TAG);
    await expect(page.getByText(VISIT.br, { exact: false })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "/tmp/attendance-mobile-history.png",
      fullPage: true,
    });
    await page.getByRole("tab", { name: "Pendências", exact: true }).click();
    await page.getByTestId("pendings-search").fill(RUN_TAG);
    await expect(
      page.getByText(MEETING.br, { exact: false }).first(),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Preencher presença" })
      .first()
      .click();
    await expect(page).toHaveURL(/tipo=meeting/);
    await expect(
      page.getByRole("button", { name: "Reuniões", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("membro não alcança a tela de frequência administrativa", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/adm/presenca/pendencias");

    await expect(page.getByTestId("pendings-page")).toHaveCount(0);
  });
});
