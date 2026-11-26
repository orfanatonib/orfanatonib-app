# E2E ao vivo

Suíte que exercita a **pilha real** — API NestJS, MySQL e S3 (LocalStack) — sem
nenhuma interceptação. Esta é a suíte padrão de e2e: não use `page.route`,
`route.fulfill`, fixtures de API, sessão falsa ou qualquer mock HTTP em
Playwright.

| Camada | Padrão obrigatório |
|---|---|
| API | real, em `:3000` |
| Banco | MySQL local |
| S3 | LocalStack em `:4566` |
| Sessão | login real em `/auth/login` |
| Serve para | contrato real ponta a ponta |

## Pré-requisito

```bash
./run.sh local
```

Sobe API, app, LocalStack e MySQL — e semeia as contas e feature flags que a
suíte usa. As contas estão em `support/credentials.ts` e são criadas por
`orfanatonib-api/scripts/seed-local-credentials.js`.

Para semear à mão, sem subir tudo:

```bash
cd ../orfanatonib-api && npm run seed:local
```

**Admin nunca vem pela API.** O seed cria/promove `e2e.admin@orfanatonib.test`
direto no banco (bcrypt, idempotente); leader/member continuam pelo cadastro
normal. Os testes que precisam de um admin descartável criam a conta como
membro por `POST /users` e a promovem com `promoteToAdminInDb`
(`support/db-admin.ts`, único helper de escrita do E2E, só em banco local). Para
promover alguém em staging/produção, veja o README do módulo auth
(`orfanatonib-api/docs/modules/auth/README.md`).

**Cadastro pelo Google nos E2E.** O Google real não entra: o teste assina o
`completionToken` (mesmo segredo derivado da API, `completionTokenFor`) e, nas
telas, semeia o estado em memória pelo `window.__APP_STORE__` (exposto só no dev
server). A API e o banco são os reais.

> `run.sh` encerra os serviços quando a shell que o chamou termina (tem
> `trap cleanup EXIT`, para o Ctrl+C derrubar API e app juntos). Rode-o em um
> terminal próprio e deixe aberto — em background de script ele se derruba.
> Se preferir subir cada um por conta:
>
> ```bash
> (cd ../orfanatonib-api && npm run start:local)   # :3000
> (cd . && npm run start:local)                    # :5173
> ```

As portas `3000` e `5173` precisam estar livres. O `run.sh` agora checa antes de
subir e diz qual processo está segurando cada uma, em vez de encerrar calado.

## O que a suíte cobre

| Arquivo | Projeto | Cobre |
|---------|---------|-------|
| `visit-material-pages.api.spec.ts` | `live-api` | contratos de `/visit-material-pages`, uploads reais no bucket |
| `shelters.api.spec.ts` | `live-api` | contratos de `/shelters`: escopo por papel, multipart, equipes, foto e exclusão |
| `auth.api.spec.ts` | `live-api` | contratos de `/auth`: login, sessão, rotação e invalidação de refresh, cadastro e recuperação de senha |
| `notifications.api.spec.ts` | `live-api` | templates de e-mail, preview, confirmação de e-mail e fila de saída |
| `feature-flags.ui.spec.ts` | `live-ui` | painel de flags pela tela, mapa público e catálogo administrativo |
| `attendance.api.spec.ts` | `live-api` | contratos de `/attendance`: escopo por papel, pendências, histórico e estatísticas |
| `sheltered.ui.spec.ts` | `live-ui` | a tela de acolhidos navegando contra a API real |
| `attendance.ui.spec.ts` | `live-ui` | as telas de frequência: hierarquia, busca, pendências, datas e o lançamento gravando no banco |
| `ideas-sections.api.spec.ts` | `live-api` | contratos de `/ideas-sections`: autenticação das leituras, multipart, mídia, vinculação e remoção |
| `ideas-sections.ui.spec.ts` | `live-ui` | as telas de ideias compartilhadas, inclusive um membro enviando a ideia pela tela |
| `users/user-profile-{reads,profiles-writes,self-service,users-writes}.api.spec.ts` | `live-api` | matriz `user-profile` (199 IDs): `/users`, `/profiles`, `/profile` por perfil anônimo/membro/líder/admin, escopo próprio × outro, validação, flag ligada/desligada; contas descartáveis, prova por `SELECT`, negativos com banco e bucket inalterados |
| `users/user-profile-s3.api.spec.ts` | `live-api` | foto de perfil sem órfão (`user-profile.s3.01-12`): enviar, trocar, link, falha de banco, cascata ao apagar o usuário, mesmo nome simultâneo, trocas simultâneas |
| `users/user-profile.ui.spec.ts` | `live-ui`, `live-ui-mobile` | `/perfil`, `/adm/usuarios`, `/adm/perfis` (edição, foto, busca, vazio, flag desligada) e mobile 375 px |

## Rodando

```bash
npm run test:e2e             # API + UI, sem mocks
npm run test:e2e:live        # alias para a mesma suíte live
npm run test:e2e:live:api    # só os contratos da API
npm run test:e2e:live:ui     # só a navegação real
```

### Vendo o navegador

```bash
npm run test:e2e:headed                  # abre o Chromium, 400ms por ação
npm run test:e2e:headed -- --grep editar # só os cenários que casam
```

`E2E_SLOWMO` controla a pausa entre ações (padrão `0`, ou seja, sem freio):

```bash
E2E_SLOWMO=800 npx playwright test --config=playwright.live.config.ts \
  --project=live-ui --headed
```

Para inspecionar passo a passo, com a timeline e o seletor de cada ação:

```bash
npx playwright test --config=playwright.live.config.ts --ui
npx playwright test --config=playwright.live.config.ts --project=live-ui --debug
```

**Desktop e mobile.** `live-ui` (1440×900) roda tudo menos `@mobile`; `live-ui-mobile` (375×812) roda `@mobile` e
`@responsive`. Fluxo que precisa valer nos dois leva `@responsive` no título.

A suíte roda com `workers: 1` e `describe.serial`: os cenários escrevem no mesmo
banco e dependem uns dos outros na ordem declarada.

## Regra de massa do E2E (obrigatória)

1. **Cenário = CRUD completo.** Todo cenário cria, lê, edita e apaga o que a feature permite e prova o resultado
   no banco **e no S3**: nenhum objeto órfão (sem linha) nem linha sem objeto (`expectNoOrphans`/`expectNoBrokenRefs`,
   `mediaScenarios`). Apagar dentro do CRUD é teste, não limpeza.
2. **Toda execução deixa massa.** Além do CRUD, cada feature recebe de **5 a 10** registros novos por rodada
   (`massCount()` em `support/keep-data.ts`; `E2E_MASS_COUNT=7` fixa o valor, sempre limitado a 5..10), pela UI quando há
   tela e pela API quando não há. A massa fica no banco e **acumula a cada execução**, seja ela qual for. Massa com
   mídia mantém linha + objeto no S3 consistentes.
3. **Nada de limpeza por padrão.** O que o cenário cria e não apaga no próprio CRUD também fica. `E2E_CLEANUP=1` liga a
   limpeza (CI efêmero) por `cleanupData`/`Cleaner` (`support/keep-data.ts`, `support/factory.ts`). Restaurar flags e
   fechar o banco continuam sempre (é estado, não massa).
4. Todo dado leva o `RUN_TAG` da execução (nunca colide). Specs filtram pelo `RUN_TAG`/prefixo e conferem contra `SELECT`
   com o mesmo critério: **não assumem banco vazio nem total global fixo**; asserção de "0 sobras" só vale sob
   `E2E_CLEANUP=1`, e a verificação de S3 passa a ser a invariante global (sem órfão, sem referência quebrada), nunca
   "o bucket voltou ao tamanho de antes".

## Massa de dados (`@seed`)

Specs `*.seed.ui.spec.ts` (tag `@seed`) criam dados **pela UI do admin** e **deixam no banco** para olhar,
filtrar, ordenar e paginar à mão. Não são cenários: não apagam nada e **não rodam na suíte normal**
(`live-ui`/`live-ui-mobile` têm `testIgnore` para eles e o projeto `live-seed` só existe com `E2E_SEED=1`).

```bash
npm run seed:acolhidos    # roda o projeto live-seed (todos os specs *.seed.ui.spec.ts, um worker)
```

| Spec | Cria |
|---|---|
| `sheltered/sheltered-admin.seed.ui.spec.ts` | 3 abrigos `MASSA E2E Abrigo ...` (API) + 24 acolhidos `MASSA E2E Acolhido NN ...` pelo formulário de `/adm/acolhidos`: gênero, idades de 2 a 16 anos, 6 cidades, com e sem responsável/telefone, datas de entrada variadas, distribuídos entre os 3 abrigos. Status inativo (1 a cada 5) e "aceitou Jesus" (1 a cada 3) são aplicados pela API real, porque a tela não os edita |
| `sheltered-area/sheltered-area.seed.ui.spec.ts` | +12 acolhidos `MASSA E2E <RUN_TAG> acolhido NN` pelo formulário de `/area-dos-acolhidos` (líder cadastra a 1ª metade e registra decisões/desativa alguns; membro cadastra o resto), cada um com 4 semanas de pagela lançadas pelo membro (presença, meditação, versículo e observação vão no campo Observações, o único que a tela tem) e decisões por Cristo. Abrigo `MASSA E2E Abrigo Acolhidos` e as contas `massa.e2e.lider.acolhidos@orfanatonib.test` / `massa.e2e.membro.acolhidos@orfanatonib.test` (senha `Aa1!senhaforte`) são fixos e reaproveitados; o login, o abrigo e a URL são impressos no fim. Cada rodada ACRESCENTA acolhidos novos |

Idempotente: confere pelo nome e só completa o que falta. Limite: `createdAt` é do servidor (a UI não tem campo
para isso), então a data de cadastro é a do dia da rodada. Para limpar, apague pela própria tela ou pela API
os registros com prefixo `MASSA E2E` (`npm run seed:acolhidos:clean` apaga, pela API, só a massa da Área dos Acolhidos: acolhidos, abrigo e as 2 contas fixas).

A mesma massa (5 a 10 acolhidos, `massCount()`) é criada por `sheltered-area/sheltered-area.mass.ui.spec.ts`, que roda na suíte normal.

### Como rodar a massa e limpar

```bash
npm run seed:acolhidos        # cria massa pela UI (admin + Área dos Acolhidos); uma rodada por vez, 1 worker
npm run seed:acolhidos:clean  # apaga só o que tem o prefixo `MASSA E2E` (acolhidos, pagelas, abrigos/contas da massa)
```

- API (:3000) e app (:5173) precisam estar no ar; nada é mockado.
- Cada rodada **acrescenta**: duas rodadas seguidas deram +12 acolhidos e +48 pagelas na Área dos Acolhidos e +20/+N no admin (mínimo de 20 acolhidos `MASSA E2E Acolhido` no total).
- Ver: `/adm/acolhidos` (busca `MASSA`) com `e2e.admin@orfanatonib.test`; `/area-dos-acolhidos` com `massa.e2e.lider.acolhidos@orfanatonib.test` ou `massa.e2e.membro.acolhidos@orfanatonib.test` (senha `Aa1!senhaforte`).
- Datas do formulário (`BRDatePicker`, grupo de spinbuttons) usam `fillDatePickerGroup`; datas das toolbars (`AdminDateField`) usam `fillDate` (`support/date-field.ts`).
- O `sheltered-area.mass.ui.spec.ts` também deixa +5..10 acolhidos com pagelas a cada rodada da suíte normal.

## Dados

Cada execução usa um sufixo único (`e2e-<timestamp>`) nos nomes e remove no
`afterAll` tudo que criou. Se uma execução for interrompida no meio, sobram
registros com esse prefixo — seguros de apagar.

Um cenário que depende de dados do banco **monta os seus próprios**, pela API,
no `beforeAll`. `attendance.ui.spec.ts` cria abrigo, equipe, vínculo do membro e
uma visita no passado; o `DELETE /shelters/:id` do final cascateia a equipe e o
agendamento e devolve o membro ao estado sem equipe. Antes disso a suíte pulava
quatro cenários em banco vazio — e um teste que pula não prova nada.

## Helpers de suporte (plano 02)
- `support/db.ts` (SELECT apenas; recusa host não local), `support/s3.ts` (snapshot/diff do bucket, invariantes), `support/factory.ts` (`RUN_TAG`, `Cleaner` — desfaz em ordem inversa, reporta falhas no fim), `support/assertions.ts` (`expectOutbox`, `expectNoOutbox`, `expectForbiddenWithoutSideEffects`, `expectAuditEvent`).
- `expectAuditEvent(request, adminToken, API_URL, { actionName, requestId?, outcome? })` prova na API `/log-records/audit` que a ação foi auditada (devolve `storage-unavailable` se o ambiente grava em arquivo). Dentro da janela de 60 s o mesmo evento vira contador: use `actionName`.
- Variáveis: `E2E_API_URL`, `E2E_APP_URL`, `E2E_API_AUDIT_DIR` (só para storage em arquivo).
- Gates: `npm run check:scenarios` (ID de matriz com teste), `npm run check:routes` (toda rota visitada por `page.goto("/literal")` — o script lê o texto, não constantes), `npm run check:test-ids`.

## Regras da plataforma E2E (plano 02)

**Mídia (S3 sem órfão)**
- Toda coluna nova que guarde URL de arquivo entra em `MEDIA_URL_COLUMNS`; coluna que guarde só a **chave** do objeto entra em `MEDIA_KEY_COLUMNS` (ambas em `support/s3.ts`). Hoje: `media_items.url`, `routes.image`, `content_packages.coverImageUrl`, `lessons.cover_image_url` (URL) e `content_assets.storageKey`, `lesson_versions.docxS3Key/pdfS3Key` (chave). Tabela ainda sem migration no banco do ambiente é ignorada pelo `referencedKeys`.
- O teste de arquitetura da API `orfanatonib-api/src/shared/media/media-columns.architecture.spec.ts` varre as entidades e **falha** se uma coluna com cara de mídia (`url`, `image`, `cover`, `photo`, `logo`, `avatar`, `thumb`, `storageKey`, `s3Key`) não estiver nas duas listas nem na exceção justificada (`NOT_A_REFERENCE`), ou se a lista citar coluna que não existe mais. Sem o repositório do app ao lado, a comparação se declara ignorada.
- Feature com upload reaproveita `mediaScenarios(slug)` (`support/media-scenarios.ts`, 12 cenários `<slug>.s3.NN`); exemplos: `image-pages/image-pages.s3.api.spec.ts`, `image-sections/image-sections.s3.api.spec.ts`. Cenário que a feature não tem **lança erro** (nunca pula). Specs com asserções próprias mais finas (ideias, vídeos) seguem com as invariantes `expectNoOrphans`/`expectNoBrokenRefs`.

**Layout mobile**
- `support/card-layout.ts` (`expectCardActionsAligned`) confere o alinhamento das ações de cartões em 375×812; use nos fluxos `@mobile` que tenham cartões.

**`request` em specs seriais**
- O Playwright proíbe reusar a fixture `request` fora do teste em que nasceu. Quem guarda o `request` do `beforeAll` numa variável de módulo/`describe` deve **renová-lo em cada `beforeEach`** (`request = api`) e também no `afterEach`/`afterAll` antes de limpar. Veja `image-pages.s3.api.spec.ts`.

**E-mail**
- Não há Mailpit nem SES: o envio é SMTP do Gmail e o sink de teste é a tabela `email_outbox` (`expectOutbox`/`expectNoOutbox`). O projeto `setup` desliga **todas** as flags `email_*`/`email-*`; religar uma flag é opt-in do cenário que prova o envio e deve ser desfeito no `afterAll`.

**Asserções**
- Negativos de autorização usam `expectForbiddenWithoutSideEffects` (status + contagem das tabelas + bucket inalterados); exemplo: `video-pages/video-pages-authorization.api.spec.ts`. Auditoria: `expectAuditEvent`.

**LLM**
- Sempre simulado: `AI_PROVIDER_MODE=fake` (a API recusa `fake` em produção). Marcadores `[[fake:429]]`, `[[fake:quota]]`, `[[fake:moderation]]` etc. nos prompts; ver `security/llm-generation.api.spec.ts`.

**Gates e CI**
- `npm run check:scenarios` (ID de matriz ↔ título `[id]`; só julga IDs de unidades que têm matriz), `check:routes`, `check:test-ids`; o gate de cenários tem teste próprio (`support/check-scenario-coverage.test.ts`, roda com `npx vitest run e2e/live/support`).
- `.github/workflows/e2e-live.yml`: sobe MySQL, LocalStack e DynamoDB Local, a API (com `AI_PROVIDER_MODE=fake`) e o app e roda os gates + o Playwright escolhido. **É opcional e manual** (`workflow_dispatch`); não é gate de merge, e o secret `E2E_API_CHECKOUT_TOKEN` (leitura da API) precisa ser criado pela infra. Ativar como gate/noturno é decisão do solicitante.
- API: `coverageThreshold` global em `orfanatonib-api/package.json` (piso 80/64/68/80 em statements/branches/functions/lines, medido em 2026-11-20) além dos pisos de 100% por diretório; o piso só sobe.
