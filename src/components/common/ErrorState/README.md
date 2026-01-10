# ErrorState Component

Componente reutilizável para exibir mensagens de erro de forma amigável e bonita em toda a aplicação.

## Uso Básico

```tsx
import ErrorState from '@/components/common/ErrorState';

// Erro 404
<ErrorState type="404" />

// Erro de servidor (500)
<ErrorState type="500" />

// Erro de conexão
<ErrorState type="network" />

// Erro genérico
<ErrorState type="generic" />
```

## Com botão de retry

```tsx
<ErrorState
  type="404"
  onRetry={() => {
    // Lógica para tentar novamente
    fetchData();
  }}
/>
```

## Personalizando mensagens

```tsx
<ErrorState
  type="404"
  title="Oops! Nada aqui"
  message="A página que você procura foi movida ou não existe mais."
  onRetry={handleRetry}
/>
```

## Sem botão de retry

```tsx
<ErrorState
  type="network"
  showRetryButton={false}
/>
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `type` | `'404' \| '500' \| 'network' \| 'generic'` | `'generic'` | Tipo do erro |
| `title` | `string` | `undefined` | Título personalizado (usa padrão se não informado) |
| `message` | `string` | `undefined` | Mensagem personalizada (usa padrão se não informado) |
| `onRetry` | `() => void` | `undefined` | Função executada ao clicar em "Tentar novamente" |
| `showRetryButton` | `boolean` | `true` | Mostra/esconde o botão de retry |

## Mensagens Padrão

### 404
- **Título:** "Nada por aqui!"
- **Mensagem:** "Não encontramos o que você está procurando. Volte mais tarde para conferir as novidades!"

### 500
- **Título:** "Ops! Algo deu errado"
- **Mensagem:** "Estamos com problemas no servidor. Nossa equipe já foi notificada. Tente novamente em alguns minutos."

### Network
- **Título:** "Sem conexão"
- **Mensagem:** "Parece que você está sem conexão com a internet. Verifique sua conexão e tente novamente."

### Generic
- **Título:** "Algo deu errado"
- **Mensagem:** "Ops! Algo inesperado aconteceu. Tente novamente mais tarde."
