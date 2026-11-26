# Presença das equipes — mobile-first

## Rotas

Todas ficam sob `AttendanceLayout` e os guards de admin/líder e da flag de presença:

- `/adm/presenca`: redireciona para lançar; preserva links antigos com `teamId`, `scheduleId` e `category`.
- `/adm/presenca/lancar`: busca e seleção de abrigo/equipe.
- `/adm/presenca/equipes/:teamId?evento=<id>&tipo=visit|meeting`: preenchimento da ocorrência. Links diretos e recarregamento consultam o escopo real da API.
- `/adm/presenca/consultar`: histórico, período aplicado no servidor, busca e tipo de evento.
- `/adm/presenca/pendencias`: encontros em aberto, ordenados do mais antigo, com link direto ao preenchimento. Presença pessoal mantém seu formulário.
- `/presenca`: compatibilidade via redirecionamento para as rotas protegidas.

## UX e proteção dos dados

- Uma coluna no celular, controles de pelo menos 44px, nomes sem truncamento e barra de salvar com safe area. Desktop usa a mesma árvore de controles, sem duplicar formulário oculto.
- Membros sem registro começam **por marcar**, nunca automaticamente presentes. O atalho marca só os pendentes, preservando faltas e comentários existentes.
- Carregamento e falha de consulta bloqueiam edição/salvamento. Retry refaz a consulta correta; respostas antigas são ignoradas.
- Leitura dos registros percorre todas as páginas da API, incluindo equipes acima de 100 registros.
- Trocar evento, categoria, equipe ou aba exige confirmação se houver alterações. O guard compartilhado cobre menu administrativo e fechamento/recarregamento da aba; a navegação nativa voltar/avançar ainda depende da limitação do BrowserRouter existente.
- Enquanto salva, controles e abas ficam indisponíveis. Falha mantém marcações; sucesso usa diretamente a resposta persistida do POST, sem um segundo GET falível.
- Histórico abre no mês atual; filtros de data são aplicados explicitamente. Listagens principais têm paginação local de 12 itens para reduzir o tamanho da tela.
- Tokens visuais em `src/theme/attendance.ts`; regras puras em `workspace.utils.ts`, contratos de UI em `workspace.types.ts`.

## Backend e validação

`api.ts` usa o cliente HTTP compartilhado. A API segue autorizando cada equipe e grava o lote numa única transação. Visita e reunião de um mesmo agendamento são ocorrências distintas e respeitam suas datas ao filtrar o período.

Regressões: `hooks/useTeamAttendance.test.tsx`, `workspace.utils.test.ts`, `api.test.ts`. E2E real: `e2e/live/attendance/attendance.ui.spec.ts`, incluindo fluxo `@mobile` em 375px, persistência, recarregamento, abas e links de pendências.
