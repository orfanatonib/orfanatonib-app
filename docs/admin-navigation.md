# Admin Navigation

The `/adm` sidebar and dashboard use the same task-oriented navigation catalog
from `src/components/Adm/navigation/constants.ts`. Do not duplicate menu labels,
paths, icons, ordering, role access, or feature-flag requirements inside rendered
components.

## Information architecture

Navigation appears in this order:

1. `Visão geral` (direct link to `/adm`)
2. `Pessoas`
3. `Abrigos e visitas`
4. `Conteúdo`
5. `Materiais e ideias`
6. `Mídias`
7. `Comunicação`

The catalog order controls both the sidebar entries and the dashboard cards.
Editing and pending routes use `activePathPrefixes` so the correct group remains
expanded and its parent item remains selected.

## Access rules

- Administrators see every catalog item allowed by feature flags.
- Leaders see their existing operational entries under `Pessoas` and `Abrigos e
visitas`; administrator-only groups and entries stay hidden.
- `Acolhidos` requires `shelter-management`.
- `Pagelas` requires `shelter-pagelas`.

Any new navigation entry must declare its allowed roles and any required feature
flag in the shared catalog.

## Automated coverage

- `src/components/Adm/navigation/utils.test.ts` covers ordering, roles, feature
  flags, route matching, and search filtering.
- `e2e/specs/admin-navigation.spec.ts` covers the desktop sidebar and dashboard.
- `e2e/specs/mobile/admin-navigation-mobile.spec.ts` covers the mobile drawer.

## Attendance subpages

`/adm/presenca` is now a layout route with shared mobile navigation. Its index redirects to `/adm/presenca/lancar`; `/equipes/:teamId`, `/consultar`, and `/pendencias` are real child routes. All children inherit the same role and feature-flag guard. The sidebar continues selecting the existing attendance entry by its path prefix. Legacy query links are translated into the team route with `evento` and `tipo` parameters.

## Comentários do feed

`Comentários do Feed` (`/adm/comentarios-feed`, só admin) fica em `Abrigos e visitas` e exige as flags `shelter_feed` e `shelter_feed_comments`. O ícone mostra no menu lateral e no cartão do painel o total de comentários aguardando aprovação (`GET /feed-section-comments/moderation/pending-count`, atualizado a cada 60 s). O código fica em `src/features/feed-comments`.
