# Changelog do app (orfanatonib-app)

## 2026-11-21 — Plano 04: erros HTTP e observabilidade (front)

### Adicionado
- O aviso de erro de API passa a mostrar **"Código do erro: <requestId>"** (o `requestId` gerado no servidor, igual ao cabeçalho `X-Request-Id`); o cartão "Detalhes técnicos" do `ErrorScreen` mostra o mesmo código (antes mostrava o `correlationId`).
- `data-testid` no aviso global (`global-notification`, `-title`, `-message`, `-description`, `-close`); o botão de fechar tem alvo mínimo de 44 px.
- Testes: `globalErrorHandler`, `useElegantErrorManager` (renderHook), `notification.plan`; E2E real `e2e/live/http-errors/http-errors.ui.spec.ts` (desktop e `@mobile` 375x812) provando que o código da tela é o do cabeçalho e do corpo da 404 real.

### Alterado
- `utils/errors/handle.ts` (403 linhas) dividido por responsabilidade: `handle.ts` (montar o `AppError`, log, métricas), `notification.plan.ts` (decisão pura de nível/posição/título/ação), `notification.dispatch.ts` (Redux e ações do toast), `notification.types.ts`, `notification.constants.ts`, `wrappers.ts` (`withErrorHandling` etc.). `@/utils/errorHandler` segue como fachada.
- `ApiErrorResponse.details` e `AppError.metadata` tipados (`ApiErrorDetails`, `AppErrorMetadata`); 0 `any` na unidade. `data-testid` das ações do `ErrorScreen` deixou de depender do índice.

## 2026-11-20 — Plano 03: utilitários compartilhados (`src/utils`)

### Corrigido
- `parseDate` (`utils/dateUtils.ts`) monta datas "dia puro" (`"2026-09-01"`) no fuso local. Antes, `formatDate`/`fmtDateOnly` mostravam o dia anterior (`31/08/2026`) em fusos negativos como UTC-4 (Manaus).
- `ageFrom` e `timeDifference` erravam o dia do aniversário/ingresso pelo mesmo motivo.
- `maskDateBR` passou a aceitar `undefined` sem quebrar.

### Alterado
- `utils/dates.ts` fundido em `utils/dateUtils.ts` (`fmtDate` agora vive lá); 30 imports reescritos.
- `maskDateBR` tem uma única implementação (`utils/masks.ts`); `dateUtils.ts` apenas reexporta.
- `justDigits` renomeado para `phoneDigits` (`utils/whatsapp.ts`): vazio/zero vira `""`, diferente de `digitsOnly(0)`, que devolve `"0"`.
- Contrato dos normalizadores documentado: `normalizeName` (exibição), `normalize` (busca sem caixa/acento), `normalizeEmail` (trim + minúsculas).
- `CopyButton` movido de `utils/components.tsx` para `components/common/CopyButton.tsx`; `initials` foi para `utils/textUtils.ts`. `utils/` só tem funções puras.
- `CopyButton`: sem `catch` vazio (falha é logada e exibe "Não foi possível copiar"), com `data-testid="copy-button"`.

### Testes
- Vitest de caracterização para todos os exports dos 5 utils (`TZ=America/Manaus`, 29/02, ida e volta `brToISO`/`isoToBR`).
- `coverageThreshold` de 100% (statements/branches/functions/lines) em `dateUtils`, `masks`, `textUtils`, `validators`, `whatsapp`: `npm run test:coverage`.
