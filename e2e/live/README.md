# E2E ao vivo

Suíte que exercita a **pilha real** — API NestJS, MySQL e S3 (LocalStack) — sem
nenhuma interceptação. Complementa `e2e/specs/`, que usa dublês de API para
testar a UI de forma determinística.

| | `e2e/specs/` | `e2e/live/` |
|---|---|---|
| API | interceptada (`page.route`) | real, em `:3000` |
| Banco | nenhum | MySQL local |
| S3 | nenhum | LocalStack em `:4566` |
| Sessão | token falso no `localStorage` | login real em `/auth/login` |
| Serve para | comportamento da UI, estados, acessibilidade | contrato real ponta a ponta |

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
| `sheltered.ui.spec.ts` | `live-ui` | a tela de acolhidos navegando contra a API real |

## Rodando

```bash
npm run test:e2e:live        # API + UI
npm run test:e2e:live:api    # só os contratos da API
npm run test:e2e:live:ui     # só a navegação real
```

### Vendo o navegador

```bash
npm run test:e2e:live:headed                  # abre o Chromium, 400ms por ação
npm run test:e2e:live:headed -- --grep editar # só os cenários que casam
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
