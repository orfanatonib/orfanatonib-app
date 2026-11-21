# Changelog do app (orfanatonib-app)

## 2026-11-21 — Catálogo do menu do /adm dividido e Integração Feira de Ministério

### Alterado
- Catálogo do menu do `/adm` dividido em um arquivo por grupo (`navigation/sections/`, `roles.ts`); organização, textos e ordem do menu original preservados. Detalhes em `docs/admin-navigation.md`.
- Itens Fotos dos Abrigos, Ideias Compartilhadas, Comentários do Feed, Comentários, Contatos e Feedbacks mostram o selo de pendentes (`features/admin-pending-counts`; API `GET /ideas-sections/pending-count`, `/comments/pending-count`, `/contact/pending-count` e `/site-feedbacks/pending-count`).
- Menu e painel leem as seções por `useVisibleAdminNavigation()` (corrige o painel que ignorava as flags de Revisão e de Provedores do Estúdio).
- Flag `integration` agora se chama **Integração Feira de Ministério** (a chave não muda); o seed do `run.sh local` a registra ligada.

### Feature flags em todas as superfícies
- Menu do `/adm`: os 29 itens exigem a flag da rota (antes só 7). Teste `routeFlags.test.ts` impede divergência.
- Área do Membro: itens do menu lateral e atalhos da Home exigem a flag (atalhos de página dinâmica só aparecem se a rota existir). `IntegrationButton` (cartão do acolhido) só para admin/líder com a flag `integration`.
- Home: depoimentos (`home_comments`, sem consultar a API quando desligada), banner de materiais (`visit_materials`), botões de Área do Membro e Contato; banner de compartilhar ideia (`idea_submission`); `Gerenciar Equipe` (`shelter_management`); sino de pendências só com `attendance`/`visit_reports`.
- Componente `FeatureGate` (`components/common`) para esconder botões e seções por flag.

### Corrigido
- O botão **Integrações FM** voltou à Home da Área do Membro (admin/líder), que a refatoração do plano 41 havia removido; ele e o item do menu lateral agora respeitam a flag `integration`.

## 2026-11-21 — Plano 07: usuários e perfis

### Alterado
- `components/NavBar/CompleteProfileAlert.tsx` (767 linhas) dividido em `completeProfileAlert/` (`types`, `constants`, `utils`, `useAttendancePendingForm`, `NotificationsMenu`, `AttendancePendingContent`, `PendingAttendanceDialog`); o arquivo original tem 85 linhas e a mesma API.
- `features/profile/components/ProfileDetailModal.tsx` (556) dividido em `profileDetail/` (banner, avatar, contatos, GA, preferências, zoom, `useProfileContactActions`, utils/constants/types); 100 linhas.
- `features/users/components/UsersCards.tsx` (481) dividido em `users/cards/` (`UserCard`, `UserCardDetails`, `UsersCardsSortBar`, `CopyButton`, `WhatsAppButton`, utils/constants); 100 linhas.
- `features/profile/ProfilesManager.tsx` (456) dividido em `profile/manager/` (`useProfilesManager`, toolbar, filtros avançados, paginação, utils/constants); 109 linhas.
- `data-testid` kebab-case nos estados de carregamento/vazio/erro e nas ações dessas telas; alvos de toque de 44 px nas ações dos cartões e do detalhe.

### Corrigido
- `ProfileEditForm`: o `data-testid="profile-edit-form"` estava só no estado de carregamento; agora o formulário real o tem e o carregamento é `profile-edit-loading`.
- Confete do aniversário sorteado uma vez por abertura (antes mudava a cada render).

### Testes
- Vitest de lógica pura: `profile/api`, `profile/utils`, `users/api`, `users/hooks` e dos utils novos (cartões, gerenciador, detalhe, alerta de notificações).
- E2E full-stack: `e2e/live/users/user-profile-{reads,profiles-writes,self-service,users-writes,s3}.api.spec.ts` e `user-profile.ui.spec.ts` (desktop + `@mobile` 375 px); matriz `user-profile` em 199/199.

### Pendente
- Mensagem de sucesso da foto de perfil some porque o `App.tsx` remonta a aba durante o `fetchCurrentUser` (`loadingUser`); fica com o plano 06 (auth/App.tsx).
- `PATCH /users/:id/image` e `DELETE /profiles/:id` sem chamador no front: decisão do solicitante.

## 2026-11-21 — Plano 09: casca do app, navegação e painel

### Alterado
- `components/Adm/AdminLayout/AdminLayout.tsx` (570 linhas) dividido em `AdminLayout` (casca), `useAdminNavigation`, `AdminSidebar`, `AdminSidebarSection`, `AdminSidebarItem`, `types`, `constants`, `utils` — mesmos `data-testid`; `ImageSectionsPendingBadge` e `FeedCommentsPendingBadge` preservados no menu.
- `components/Adm/navigation/constants.ts` (394) dividido: `sections/*.ts` (uma por seção), `roles.ts`, `constants.ts` (44). A API pública (`index.ts`) não mudou.
- `theme/index.ts` (549) dividido em `colors`, `palette`, `typography` e `components/{buttons,forms,feedback,surfaces,navigation,tables}.ts`.
- `NavBar`: `Navbar`, `MobileNavigation` e `NavLinks` usam `shellNav.ts` + `useShellNavigation` (papel × flag em um lugar só).

### Corrigido
- "Área do Membro" no menu do usuário some com a flag `member_area` desligada (antes aparecia e levava a rota fechada).

### Testes
- Vitest: `shellNav.test.ts`. E2E real `e2e/live/app-shell/app-shell.ui.spec.ts` com matriz `app-shell` 15/15 (4 perfis, flag on/off/só líder com `SELECT` em `feature_flags` e restauração, 3 cenários `@mobile` 375x812). Docs: `docs/app-shell.md`.

## 2026-11-21 — Plano 06: autenticação (cadastro, recuperação e E2E)

### Corrigido
- **Rota `/esqueci-minha-senha` não existia**: o botão "Esqueci minha senha" do login e o "pedir novo link" da redefinição levavam a uma rota sem página. `ForgotPassword` agora é rota pública, guardada pela flag `password_recovery`.
- Login esconde "Cadastre-se", "Esqueci minha senha" e o botão do Google quando `public_registration`, `password_recovery` e `google_login` estão desligadas (antes só a rota era barrada). Antes de as flags chegarem nada some (`features/auth/entryOptions.ts`).
- Mensagem de erro do cadastro junta a lista de mensagens da validação da API (antes mostrava a genérica).

### Alterado
- `pages/Register/Register.tsx` (524 linhas) dividido: `Register.tsx` (69), `RegisterForm.tsx`, `RegisterSuccess.tsx` e, em `features/auth/`, `useRegisterForm`, `useRegisterTeams`, `register.types.ts`, `register.constants.ts`, `registerUtils.ts` (+ teste). `data-testid` nos campos de senha, equipe e papel.
- `/auth/refresh` e `/auth/complete-register` **têm chamador** (interceptor de 401 em `config/axiosConfig.ts`; rota `/cadastrar-google`) — documentado no módulo `auth` da API.

### Testes
- E2E real (front → API → MySQL): `e2e/live/auth/auth-session.api.spec.ts`, `auth-account.api.spec.ts`, `auth-flows.ui.spec.ts` (inclui 375×812 de login, cadastro, esqueci a senha e redefinição com alvos de 44 px). Matriz `auth`: 147/148 (falta `auth.post.auth-google#feliz`). Baseline de cobertura de rotas encolheu em 4 rotas.

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
