# 📖 Módulo Accepted Christs

## 🎯 Objetivo
Gerenciar decisões espirituais dos acolhidos, registrando quando aceitam Cristo ou se reconciliam.

## 📊 Estrutura de Dados

### Tipos de Decisão
- **ACCEPTED**: Decisão de aceitar Cristo pela primeira vez
- **RECONCILED**: Reconciliação com Cristo (após já ter aceitado)
- **null**: Registro sem decisão específica (opcional)

### DTOs

#### `CreateAcceptedChristDto`
```typescript
{
  shelteredId: string;          // UUID do acolhido (obrigatório)
  decision?: DecisionType | null; // Tipo de decisão (opcional)
  notes?: string | null;         // Observações até 500 caracteres (opcional)
}
```

#### `AcceptedChristResponseDto`
```typescript
{
  id: string;
  decision: DecisionType | null;
  notes?: string | null;
  sheltered: {
    id: string;
    name: string;
    gender: "M" | "F";
    birthDate: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### `AcceptedChristShortDto`
```typescript
{
  id: string;
  decision: DecisionType | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 🔌 API

### Endpoints Disponíveis

#### POST `/accepted-christs`
Cria uma nova decisão espiritual.

**Request:**
```json
{
  "shelteredId": "550e8400-e29b-41d4-a716-446655440001",
  "decision": "ACCEPTED",
  "notes": "Decisão durante o culto de domingo"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440101",
  "decision": "ACCEPTED",
  "notes": "Decisão durante o culto de domingo",
  "sheltered": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Carlos Oliveira",
    "gender": "M",
    "birthDate": "2010-05-15"
  },
  "createdAt": "2025-10-23T16:30:00.000Z",
  "updatedAt": "2025-10-23T16:30:00.000Z"
}
```

### Visualização de Decisões

⚠️ **Importante:** O módulo não possui endpoint GET próprio. Para visualizar decisões, use:

#### GET `/sheltered/:id`
Retorna o acolhido com array de `acceptedChrists`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Carlos Oliveira",
  "acceptedChrists": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440101",
      "decision": "ACCEPTED",
      "notes": "Decisão durante culto",
      "createdAt": "2025-10-23T16:30:00.000Z",
      "updatedAt": "2025-10-23T16:30:00.000Z"
    }
  ]
}
```

## ✅ Validações

- `shelteredId`: UUID válido e obrigatório
- `decision`: Deve ser "ACCEPTED" ou "RECONCILED" (se fornecido)
- `notes`: Máximo 500 caracteres

## 🎨 UI Components

### DecisionModal
Modal para registrar decisões espirituais com:
- ✅ Visualização do histórico de decisões
- ✅ Chips coloridos para status (Aceitou/Reconciliou)
- ✅ Campo de observações com contador de caracteres
- ✅ Validação de limite de 500 caracteres
- ✅ Feedback de erro
- ✅ Loading state
- ✅ Mobile first design

### ShelteredCard
Card de acolhido com indicador de decisões:
- ❤️ Ícone de coração colorido por status:
  - Cinza: Nenhuma decisão
  - Verde (success): Aceitou Cristo
  - Azul (info): Reconciliou-se
- 🔢 Badge com número de decisões registradas
- ⚡ Animação de heartbeat quando há decisões
- 📱 Responsivo (mobile first)

## 📱 Mobile First Features

### DecisionModal
- Tamanhos de fonte responsivos
- Padding adaptável
- Botões com tamanhos adequados para toque
- Dialog com margens adequadas no mobile
- TextField com rows ajustáveis

### ShelteredCard
- Ícones e botões responsivos
- Tooltips informativos
- Badge de contagem visível
- Animação sutil de heartbeat

## 💡 Casos de Uso

1. **Primeira Decisão**
   - Acolhido aceita Cristo pela primeira vez
   - `decision: "ACCEPTED"`

2. **Reconciliação**
   - Acolhido já aceitou Cristo e deseja renovar compromisso
   - `decision: "RECONCILED"`

3. **Múltiplas Decisões**
   - Permitido registrar várias decisões para mesmo acolhido
   - Útil para acompanhar jornada espiritual

4. **Registro Sem Decisão Formal**
   - Para marcar interesse sem decisão formal
   - `decision: null`

## 🔐 Autenticação

Todos os endpoints requerem token JWT válido no header:
```
Authorization: Bearer <token>
```

## 🚀 Como Usar

### Registrar Decisão
```typescript
import { apiCreateAcceptedChrist } from "@/features/accepted-christs";

await apiCreateAcceptedChrist({
  shelteredId: "uuid-do-acolhido",
  decision: "ACCEPTED",
  notes: "Observações opcionais"
});
```

### Abrir Modal
```typescript
import DecisionModal from "@/features/pagela-member/components/DecisionModal";

<DecisionModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  sheltered={shelteredData}
  onSuccess={async () => {
    await refetch();
    setModalOpen(false);
  }}
/>
```

## 📝 Notas Técnicas

- Múltiplas decisões permitidas para mesmo acolhido
- Decisões são imutáveis (sem endpoint PUT/DELETE)
- Relacionamento ManyToOne com Sheltered
- Timestamps automáticos (createdAt, updatedAt)

## 🎯 Melhorias Futuras Possíveis

- [ ] Endpoint GET para listar todas as decisões
- [ ] Endpoint PUT para editar decisão
- [ ] Endpoint DELETE para remover decisão
- [ ] Filtros por tipo de decisão
- [ ] Relatórios de decisões por período
- [ ] Exportação de dados

