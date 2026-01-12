# Módulo de Controle de Presença

Este módulo gerencia o registro de presença/falta dos membros em eventos dos times (visitas e reuniões).

## 🎯 Novo Layout Drill-Down

### Fluxo de Navegação

1. **Abrigos** → Mostra todos os abrigos que o líder/admin gerencia
2. **Equipes** → Ao expandir um abrigo, mostra suas equipes com estatísticas
3. **Membros** → Ao clicar em uma equipe, mostra membros e permite registrar presença

### Novos Endpoints

- `GET /attendance/leader/shelters-teams-members` - Hierarquia completa em uma chamada
- `GET /attendance/leader/teams/members` - Alternativo para hierarquia

### Novos Componentes

- `DrillDownAttendance` - Componente principal do novo layout
- `TeamSelection` - Lista abrigos e equipes
- `TeamMemberAttendance` - Gerencia presença da equipe selecionada

## Funcionalidades

### ✅ Registro Individual

- Membros podem registrar sua própria presença/falta
- Validação automática de regras de negócio
- Feedback visual em tempo real

### ✅ Registro em Lote (Frequência)

- Líderes e admins podem registrar presença para todos os membros
- Operações em lote com validações
- Interface intuitiva com ações rápidas

### ✅ Pendências

- Visualização de eventos passados sem registro
- Separação entre pendências do membro e do líder
- Notificações visuais com badges

### ✅ Gestão de Times

- Listagem de membros por time
- Agenda de eventos organizada
- Filtros por abrigo e time

## Melhorias Implementadas

### 🔧 Tipos TypeScript

- Tipos alinhados com documentação da API
- Enums para valores constantes
- Validações type-safe
- Funções utilitárias bem tipadas

### ✅ Validações Client-Side

- Validação de datas obrigatórias (visitDate/meetingDate)
- Limite de caracteres para comentários (500)
- Feedback visual de erros
- Regras de negócio aplicadas

### 🚀 Performance

- Componentes memoizados
- useCallback para funções
- Redução de re-renders desnecessários
- Lazy loading onde apropriado

### 🎨 UX/UI Aprimorada

- Loading states com skeletons
- Feedback visual consistente
- Animações suaves
- Design responsivo

### ♿ Acessibilidade

- Labels ARIA adequados
- Navegação por teclado
- Roles semânticos
- Contraste adequado
- Screen reader support

### 🧩 Arquitetura

- Componentes modulares e reutilizáveis
- Separação de responsabilidades
- Props bem definidas
- Composição ao invés de herança

### 🧪 Testes

- Testes unitários para utilitários
- Testes de componente básicos
- Setup de testes configurado
- Estrutura preparada para expansão

## Estrutura Atual do Módulo

```
src/features/attendance/
├── api.ts                    # Chamadas para a API
├── types.ts                  # Tipos TypeScript
├── utils.ts                  # Funções utilitárias
├── pages/
│   └── AttendanceDashboard.tsx # Redireciona para DrillDownAttendance
├── components/
│   ├── DrillDownAttendance.tsx  # 🆕 NOVO: Layout principal drill-down
│   ├── TeamSelection.tsx        # 🆕 NOVO: Seleção de abrigos/equipes
│   ├── TeamMemberAttendance.tsx # 🆕 NOVO: Gestão de presença da equipe
│   ├── AttendanceHeader.tsx     # Cabeçalho (antigo layout)
│   ├── AttendanceStats.tsx      # Estatísticas (antigo layout)
│   ├── AttendanceTabs.tsx       # Abas (antigo layout)
│   ├── RegisterAttendance.tsx   # Registro individual
│   ├── RegisterTeamAttendance.tsx # Registro em lote
│   ├── PendingLeader.tsx        # Pendências do líder
│   ├── PendingMember.tsx        # Pendências do membro
│   ├── TeamMembers.tsx          # Lista de membros
│   ├── TeamSchedules.tsx        # Agenda do time
│   └── AttendanceBell.tsx       # Notificações rápidas
├── __tests__/                 # Testes
└── README.md                  # Esta documentação
```

## Regras de Negócio

### Vínculo com ShelterSchedule

- Registro só é permitido com ShelterSchedule válido
- Schedule deve ter pelo menos uma data (meetingDate ou visitDate)

### Controle de Acesso

- Membros: apenas sua própria presença
- Líderes: todos os membros do seu time
- Admins: todos os membros de qualquer time

### Pendências

- Eventos passados sem registro são considerados pendências
- Data de referência é a data atual

### Atualização Idempotente

- Registros duplicados atualizam o existente
- Não cria múltiplos registros para o mesmo evento/membro

## API Endpoints

### Principais

- `POST /attendance/register` - Registro individual
- `POST /attendance/register/team` - Registro em lote
- `GET /attendance/pending/leader?teamId={id}` - Pendências do líder
- `GET /attendance/pending/member` - Pendências do membro
- `GET /attendance/team/{teamId}/members` - Membros do time
- `GET /attendance/team/{teamId}/schedules` - Eventos do time
- `GET /attendance/leader/teams` - Times do líder

### Novos (Drill-Down)

- `GET /attendance/leader/shelters-teams-members` - Hierarquia completa
- `GET /attendance/leader/teams/members` - Alternativo

## Próximos Passos

- [ ] Implementar cache local para reduzir chamadas à API
- [ ] Adicionar filtros avançados na agenda
- [ ] Implementar notificações push para pendências
- [ ] Adicionar relatórios de presença
- [ ] Expandir cobertura de testes
- [ ] Implementar PWA features (offline)

## Migração

O layout antigo ainda está disponível nos componentes individuais, mas o dashboard principal agora usa o novo layout drill-down. Os componentes antigos podem ser reutilizados em outras partes da aplicação se necessário.
