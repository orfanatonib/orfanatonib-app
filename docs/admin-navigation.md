# Admin Navigation

The `/adm` sidebar and dashboard use the same task-oriented navigation catalog
from `src/components/Adm/navigation/` (um arquivo por seção em `sections/`, papéis em `roles.ts`, ids de teste e medidas em `constants.ts`). Do not duplicate menu labels,
paths, icons, ordering, role access, or feature-flag requirements inside rendered
components.

## Information architecture

Navigation appears in this order (um arquivo por grupo em `sections/`):

1. `Visão geral` (direct link to `/adm`)
2. `Estúdio Orfanato` — Visão geral, Produção, Revisão, Orientações
3. `Pessoas` — Acolhidos, Membros, Líderes, Perfis, Usuários, Antecedentes Criminais
4. `Abrigos e visitas` — Abrigos, Agendamentos, Presenças, Relatórios das Visitas, Pagelas, Comentários do Feed
5. `Conteúdo` — Criar Página, Meditações, Documentos, Informativos
6. `Materiais e ideias` — Materiais de Visita, Páginas de Ideias, Ideias Compartilhadas
7. `Mídias` — Galerias de Fotos, Fotos dos Abrigos, Vídeos
8. `Comunicação` — Comentários, Contatos, Feedbacks

Ferramentas de administração (feature flags, auditoria, provedores de IA) continuam no rodapé, fora do menu.

Menu e painel leem as seções por `useVisibleAdminNavigation()` (papel × todas as flags do catálogo); nenhum
dos dois repete lista de flags.

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

## Fotos dos Abrigos

`Fotos dos Abrigos` (`/adm/fotos-abrigos`, só admin, flag `photo_moderation`) é a fila de revisão das publicações enviadas por membros e líderes. O ícone mostra no menu lateral e no cartão do painel o total de publicações aguardando revisão (`GET /image-sections/pending-count`, atualizado a cada 60 s e refeito ao aprovar, reprovar ou excluir). A tela usa a casca `admin-shell`; o código fica em `src/features/image-sections` (`ImageSectionsPendingBadge`).

## Estrutura do layout (plano 09)

`components/Adm/AdminLayout/` foi dividido sem mudar comportamento nem `data-testid`:

- `AdminLayout.tsx` — casca (barra móvel, gaveta, `<main>`/`Outlet`).
- `useAdminNavigation.ts` — papel × flag, seções visíveis, acordeão e filtro do celular.
- `AdminSidebar.tsx`, `AdminSidebarSection.tsx`, `AdminSidebarItem.tsx` — menu lateral. O item `shelter-photos`
  mantém o `ImageSectionsPendingBadge` e `feed-comments` o `FeedCommentsPendingBadge`.
- `types.ts`, `constants.ts` (cores do Estúdio, alvo de 44 px), `utils.ts` (mini-drawer, filtros do celular; puro).

## Selos de pendentes

| Item | Endpoint (só admin) | Pendente = | Flag |
| --- | --- | --- | --- |
| Fotos dos Abrigos | `GET /image-sections/pending-count` | revisão `pending` | `photo_moderation` |
| Comentários do Feed | `GET /feed-section-comments/moderation/pending-count` | status pendente | `shelter_feed_comments` |
| Ideias Compartilhadas | `GET /ideas-sections/pending-count` | ideia ainda sem página | `idea_moderation` |
| Comentários | `GET /comments/pending-count` | `published = false` | `comment_moderation` |
| Contatos (grupo Comunicação) | `GET /contact/pending-count` | `read = false` | `contact_management` |
| Feedbacks (grupo Comunicação) | `GET /site-feedbacks/pending-count` | `read = false` | `feedback_management` |

`AdminNavigationItemIcon` (menu e painel) escolhe o selo do item; os quatro últimos usam `PendingCountBadge`
de `src/features/admin-pending-counts`, que também exporta `useRefreshPendingCounts()` para refazer a
contagem depois de publicar, apagar ou aprovar.
