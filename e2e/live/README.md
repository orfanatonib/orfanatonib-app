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

A suíte roda com `workers: 1` e `describe.serial`: os cenários escrevem no mesmo
banco e dependem uns dos outros na ordem declarada.

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
