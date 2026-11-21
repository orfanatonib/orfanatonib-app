# Changelog do app (orfanatonib-app)

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
