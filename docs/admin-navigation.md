# Admin Navigation

The `/adm` sidebar and dashboard use the same task-oriented navigation catalog
from `src/components/Adm/navigation/` (um arquivo por seção em `sections/`, papéis em `roles.ts`, ids de teste e medidas em `constants.ts`). Do not duplicate menu labels,
paths, icons, ordering, role access, or feature-flag requirements inside rendered
components.

## Information architecture

Navigation appears in this order (cada grupo ≤ 6 itens; um arquivo por grupo em `sections/`):

1. `Visão geral` (direct link to `/adm`)
2. `Pessoas` — Acolhidos, Membros, Líderes, Usuários, Antecedentes Criminais, Perfis
3. `Abrigos e visitas` — Abrigos, Agendamentos, Presenças, Pagelas, Relatórios das Visitas
4. `Estúdio Orfanato` — Início, Produção, Revisão, Orientações
5. `Conteúdo do site` — Meditações, Documentos, Informativos
6. `Páginas e mídias` — Nova página, Materiais de visita, Páginas de ideias, Galerias de fotos, Vídeos
7. `Interação` — Fotos dos abrigos, Ideias compartilhadas, Comentários do feed, Comentários das meditações
8. `Mensagens` — Contatos, Feedbacks

Os itens de `Interação` e `Mensagens` mostram o selo vermelho com o total aguardando o admin (atualiza a cada 60 s).

Critério: o trabalho do dia a dia (pessoas e abrigos, que o líder também usa) vem primeiro; o que só o admin usa vem depois; o que os usuários enviam e o admin aprova fica junto em `Interação`; páginas e a ação de criá-las ficam juntas em `Páginas e mídias`. O `Estúdio Orfanato` usa o mesmo estilo dos demais grupos. Ferramentas de administração (feature flags, auditoria, provedores de IA) continuam no rodapé, fora do menu.

**Feature flags:** todo item do catálogo declara `requiredFeatureFlag(s)`, e o teste `routeFlags.test.ts` garante que o menu exige pelo menos as flags da rota do item. Menu e painel leem as seções por `useVisibleAdminNavigation()` (papel × todas as flags); nenhum dos dois repete lista de flags.

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

`Comentários do feed` (`/adm/comentarios-feed`, só admin) fica em `Interação` e exige as flags `shelter_feed` e `shelter_feed_comments`. O ícone mostra no menu lateral e no cartão do painel o total de comentários aguardando aprovação (`GET /feed-section-comments/moderation/pending-count`, atualizado a cada 60 s). O código fica em `src/features/feed-comments`.

## Fotos dos Abrigos

`Fotos dos abrigos` (`/adm/fotos-abrigos`, só admin, flag `photo_moderation`) é a fila de revisão das publicações enviadas por membros e líderes. O ícone mostra no menu lateral e no cartão do painel o total de publicações aguardando revisão (`GET /image-sections/pending-count`, atualizado a cada 60 s e refeito ao aprovar, reprovar ou excluir). A tela usa a casca `admin-shell`; o código fica em `src/features/image-sections` (`ImageSectionsPendingBadge`).

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
| Fotos dos abrigos | `GET /image-sections/pending-count` | revisão `pending` | `photo_moderation` |
| Comentários do feed | `GET /feed-section-comments/moderation/pending-count` | status pendente | `shelter_feed_comments` |
| Ideias compartilhadas | `GET /ideas-sections/pending-count` | ideia ainda sem página | `idea_moderation` |
| Comentários das meditações | `GET /comments/pending-count` | `published = false` | `comment_moderation` |
| Contatos (grupo Mensagens) | `GET /contact/pending-count` | `read = false` | `contact_management` |
| Feedbacks (grupo Mensagens) | `GET /site-feedbacks/pending-count` | `read = false` | `feedback_management` |

`AdminNavigationItemIcon` (menu e painel) escolhe o selo do item; os quatro últimos usam `PendingCountBadge`
de `src/features/admin-pending-counts`, que também exporta `useRefreshPendingCounts()` para refazer a
contagem depois de publicar, apagar ou aprovar.
