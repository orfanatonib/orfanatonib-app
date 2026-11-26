# 👶 Módulo Sheltered (Acolhidos)

## 🎯 Objetivo

Tela de gestão dos acolhidos: listagem com filtros, detalhe, criação, edição,
ativação/inativação e exclusão. Consome `/sheltered` na API
(`../orfanatonib-api`, ver `docs/modules/sheltered/README.md` daquele repo).

## 📁 Estrutura

```text
src/features/sheltered/
├── ShelteredManager.tsx      # composição da tela e orquestração dos diálogos
├── api.ts                    # único ponto de contato HTTP (via @/config/axiosConfig)
├── hooks.ts                  # estado de lista, detalhe, mutações e opções de abrigo
├── types.ts                  # DTOs de entrada e saída espelhando a API
├── enums.ts                  # gênero, ordenação, filtros, modo do formulário
├── constants.ts              # defaults, rótulos, mensagens e prefixos de data-testid
├── utils.ts                  # funções puras (datas, payloads, filtros, endereço)
└── components/
    ├── ShelteredToolbar.tsx  # filtros e ações
    ├── DateRangeFilter.tsx   # data única ou período
    ├── ShelteredTable.tsx    # tabela (desktop); delega para os cards no mobile
    ├── ShelteredCards.tsx    # lista em cards (mobile)
    ├── ShelteredViewDialog.tsx
    └── ShelteredFormDialog.tsx
```

## 🔌 Contrato com a API

`api.ts` é o único arquivo que fala HTTP e usa exclusivamente
`@/config/axiosConfig`. Os filtros enviados são exatamente os aceitos pelo
`QueryShelteredDto`: `searchString`, `shelterSearchingString`, `addressFilter`,
`shelterId`, `gender`, `birthDateFrom`, `birthDateTo`, `joinedFrom`, `joinedTo`,
além de `page`, `limit`, `orderBy` e `order`.

> ⚠️ A API roda com `forbidNonWhitelisted: true`. Qualquer chave enviada fora
> dessa lista derruba a listagem inteira com **400 Validation failed** — por isso
> `compactFilters` também remove valores em branco antes de montar a query.

Ordenação aceita apenas os campos do enum `ShelteredOrderBy`.

## 🧠 Estado

Um dono por valor, sem espelhamento:

| Valor | Dono |
|-------|------|
| Página, tamanho de página, ordenação e filtros | estado local de `ShelteredManager` |
| Linhas e total da listagem | `useSheltered` (servidor é a fonte da verdade) |
| Registro do diálogo de detalhe | `useShelteredDetails` |
| Carregando/erro dos diálogos de escrita | `useShelteredMutations` |
| Abrigos disponíveis no formulário | `useShelterOptions` |
| Usuário autenticado | Redux (`state.auth.user`), somente leitura |

`useSheltered` identifica a requisição pelo **conteúdo** de filtros e ordenação,
não pela identidade dos objetos — passar um literal inline não gera loop de
render.

## 🔐 Permissões

A API é a autoridade. A UI apenas reflete o papel:

- **member**: o abrigo vem fixo do próprio perfil e o campo é somente leitura;
- **leader**: recebe o abrigo do seu time como padrão, podendo escolher outro da lista;
- **admin**: autocomplete com todos os abrigos.

## ♿ Acessibilidade e mobile

- Alvos interativos respeitam `MIN_TOUCH_TARGET_PX` (44 px).
- Tabela vira cards abaixo do breakpoint `sm`; no mobile as ações ficam em FABs.
- A tabela rola horizontalmente dentro do próprio container.
- Campos e botões de ícone têm `aria-label`; os diálogos usam `aria-labelledby`.

## 🧪 Testes

### Unitários e de componente (Vitest + Testing Library)

```bash
npx vitest run src/features/sheltered
```

43 testes cobrindo as funções puras (`utils.test.ts`), o contrato HTTP
(`api.test.ts`), o estado dos hooks (`hooks.test.ts`) e a toolbar
(`components/ShelteredToolbar.test.tsx`).

### Ponta a ponta (Playwright)

```bash
npm run test:e2e                      # desktop + celular
npm run test:e2e -- --project=desktop-chromium
npm run test:e2e:ui                   # modo interativo
```

35 testes em `e2e/specs/` (29 desktop, 6 celular) sobre a tela real — roteador,
Redux, MUI — com a API interceptada por `e2e/support/api-mock.ts`. Não precisa de
banco nem da API no ar: a sessão é semeada em `localStorage` (é de lá que
`initAuth` lê o token) e todas as chamadas são respondidas pelas fixtures.

Cobre listagem e filtros, ordenação, estados vazio e de erro, detalhe,
criação com validação, edição, exclusão, escopo por papel e o layout em cards do
celular (incluindo o alvo mínimo de toque de 44 px).

## 🏷️ data-testid

Todos os componentes expõem `data-testid` em kebab-case. Os prefixos estáveis
ficam em `SHELTERED_TESTID` (`constants.ts`); os identificadores por linha usam
`toTestIdSuffix(row.id)`, por exemplo `sheltered-row-view-<id>`. Nunca derive
seletor de texto traduzido, classe CSS ou índice de array.

## 🐞 Defeitos corrigidos por estes testes

| Defeito | Sintoma | Correção |
|---|---|---|
| Filtros fora do `QueryShelteredDto` | Qualquer filtro derrubava a listagem com 400 | Filtros implementados na API e alinhados aqui |
| `buildWhatsappLink` chamado com a assinatura errada | Link do WhatsApp sempre nulo no detalhe | Chamada corrigida |
| `FeatureFlagRoute` redirecionava com as flags em voo | Deep link para `/adm/acolhidos` caía na home de forma intermitente | Estado de carregamento antes de decidir |
| Data em DD/MM/AAAA entregue ao `dayjs` | Na edição, 02/04 virava 04/02 e podia ser salva trocada | O formulário passou a carregar a data em ISO |
| `useEffect` ressincronizava o date picker a cada tecla | Digitar a data apagava dia e mês | Ressincroniza só ao abrir o diálogo ou trocar de registro |
