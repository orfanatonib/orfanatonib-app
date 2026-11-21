# Casca do app (plano 09)

Navbar pública, gaveta móvel, menu do usuário e painel `/adm`. Regra única: **papel e flag decidem, em um só lugar**,
e a flag nunca amplia o acesso além do guard de papel (a rota e a API continuam soberanas).

## Onde está a lógica

| Peça | Arquivo | Papel |
|---|---|---|
| Menu público | `components/NavBar/publicNav.ts` | Início/Feed/Sobre/Eventos/Contato, cada um atrás da sua flag (Início nunca) |
| Menu do usuário e papéis | `components/NavBar/shellNav.ts` | Entradas (Área do Membro, Área dos Acolhidos, Administração, Meu Perfil) por papel × flag; rótulo do papel; item ativo |
| Hook | `components/NavBar/useShellNavigation.ts` | Lê Redux + flags e devolve `publicItems` e `userMenuEntries` |
| Ícones | `components/NavBar/shellNavIcons.ts` | Ícone de cada entrada |
| Painel `/adm` | `components/Adm/navigation/` e `components/Adm/AdminLayout/` | Ver `admin-navigation.md` |
| Rotas por tipo de página | `features/feature-flags/routeTypeFlags.ts` | `ROUTE_TYPE_FLAG` + `useVisibleRoutes` |
| Tema | `theme/` | `colors`, `palette`, `typography`, `components/*` (por família de componente) |

`Navbar`, `MobileNavigation` e `NavLinks` não repetem regra de papel/flag: só renderizam o que o hook devolve.

## Mudança de comportamento (intencional)

"Área do Membro" no menu do usuário agora some com `member_area` desligada (antes aparecia sempre e levava a uma rota
que a própria flag fechava). Conforme a §4 do plano: flag desligada ⇒ rota, menu e atalho somem.

## Rota inexistente

`path="*"` renderiza `NotFoundPage` (`data-testid="not-found-page"`), nunca a Home.

## Testes

- Vitest (lógica pura): `shellNav.test.ts`, `publicNav.test.ts`, `navigation/*.test.ts`, `routeTypeFlags.test.ts`.
- E2E full-stack (front → API → MySQL, sem mock): `e2e/live/app-shell/app-shell.ui.spec.ts`, matriz `e2e/scenarios/app-shell.json`
  (`node scripts/check-scenario-coverage.mjs --unit=app-shell`). Perfis anônimo/membro/líder/admin; flags alteradas
  pela API do admin, lidas por `SELECT` em `feature_flags` e restauradas ao final (inclusive `targetRoles`);
  `@mobile` em 375x812 (menu, gaveta e painel: alvos >= 44 px, sem rolagem horizontal).
  `npx playwright test -c playwright.live.config.ts e2e/live/app-shell --project=setup --project=live-ui` e `--project=live-ui-mobile`.
