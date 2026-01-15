import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  TextField,
  Alert,
} from '@mui/material';
import {
  useElegantErrorManager,
  useApiCall,
  useFormSubmit,
  useDataFetcher
} from '@/hooks/error-handling';
import ErrorDisplay from '@/components/common/ErrorDisplay/ErrorDisplay';
import ErrorScreen from '@/components/common/ErrorScreen/ErrorScreen';

function BasicErrorExample() {
  const {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearError,
    currentError,
  } = useElegantErrorManager({
    context: 'basic-example',
    enableSound: true,
    enableVibration: true,
  });

  const simulateError = (type: string) => {
    switch (type) {
      case 'network':
        showError('Erro de conexão com a internet', {
          mode: 'snackbar',
          position: 'top-center',
        });
        break;
      case 'validation':
        showError('Os dados informados são inválidos', {
          mode: 'inline',
          position: 'top-right',
        });
        break;
      case 'server':
        showError('Erro interno do servidor', {
          mode: 'modal',
        });
        break;
      case 'auth':
        showError('Sua sessão expirou', {
          mode: 'fullscreen',
        });
        break;
    }
  };

  return (
    <Card>
      <CardHeader title="Sistema Elegante de Erros - Básico" />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Clique nos botões para ver diferentes tipos de erro:
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              color="error"
              onClick={() => simulateError('network')}
            >
              Erro de Rede
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => simulateError('validation')}
            >
              Erro de Validação
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => simulateError('server')}
            >
              Erro do Servidor
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => simulateError('auth')}
            >
              Erro de Autenticação
            </Button>
          </Stack>

          <Button variant="contained" onClick={() => showSuccess('Operação realizada com sucesso!')}>
            Mostrar Sucesso
          </Button>

          <Button variant="contained" onClick={clearError}>
            Limpar Erros
          </Button>

          <ErrorDisplay
            error={currentError}
            context="basic-example"
            mode="auto"
            onRetry={() => showInfo('Tentando novamente...')}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApiCallExample() {
  const { execute, isLoading, error } = useApiCall(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { data: 'Success!' };
    },
    'api-example'
  );

  const [data, setData] = useState<{ data: string } | null>(null);

  const handleApiCall = async () => {
    const result = await execute();
    if (result) {
      setData(result);
    }
  };

  return (
    <Card>
      <CardHeader title="Chamadas de API Elegantes" />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Clique para fazer uma chamada de API com tratamento automático de erros:
          </Typography>

          <Button
            variant="contained"
            onClick={handleApiCall}
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Fazer Chamada API'}
          </Button>

          {data && (
            <Alert severity="success">
              Dados recebidos: {JSON.stringify(data)}
            </Alert>
          )}

        </Stack>
      </CardContent>
    </Card>
  );
}

function FormSubmitExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const { submit, isSubmitting, error } = useFormSubmit(
    async (data: typeof formData) => {
      if (!data.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!data.email.includes('@')) {
        throw new Error('Email inválido');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', data);
    },
    'contact-form',
    {
      showSuccessNotification: true,
      successMessage: 'Mensagem enviada com sucesso!',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submit(formData);
    if (success) {
      setFormData({ name: '', email: '', message: '' });
    }
  };

  return (
    <Card>
      <CardHeader title="Formulário com Submissão Elegante" />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />

            <TextField
              label="Mensagem"
              multiline
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

function DataFetcherExample() {
  const { data, isLoading, error, refetch } = useDataFetcher(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        users: [
          { id: 1, name: 'João Silva' },
          { id: 2, name: 'Maria Santos' },
          { id: 3, name: 'Pedro Costa' },
        ],
      };
    },
    {
      staleTime: 30 * 1000,
      retry: true,
      context: 'users-list',
    }
  );

  return (
    <Card>
      <CardHeader
        title="Busca de Dados com Cache"
        action={
          <Button onClick={() => refetch()} disabled={isLoading}>
            Atualizar
          </Button>
        }
      />
      <CardContent>
        {isLoading ? (
          <Typography>Carregando usuários...</Typography>
        ) : data ? (
          <Stack spacing={1}>
            {data.users.map((user: any) => (
              <Typography key={user.id}>
                • {user.name}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography color="error">Erro ao carregar dados</Typography>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorScreensExample() {
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  const screens = {
    network: {
      type: 'network' as const,
      title: 'Sem conexão com a internet',
      message: 'Verifique sua conexão e tente novamente',
    },
    server: {
      type: 'server' as const,
      title: 'Erro no servidor',
      message: 'Estamos com problemas técnicos',
    },
    'not-found': {
      type: 'not-found' as const,
      title: 'Página não encontrada',
      message: 'A página que você procura não existe',
    },
    validation: {
      type: 'validation' as const,
      title: 'Dados inválidos',
      message: 'Por favor, corrija os erros abaixo',
    },
  };

  return (
    <Card>
      <CardHeader title="Telas de Erro Específicas" />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Clique para ver diferentes telas de erro:
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {Object.entries(screens).map(([key, config]) => (
              <Button
                key={key}
                variant="outlined"
                onClick={() => setCurrentScreen(key)}
              >
                {config.title}
              </Button>
            ))}
          </Stack>

          {currentScreen && (
            <Box sx={{ mt: 2 }}>
              <ErrorScreen
                {...screens[currentScreen as keyof typeof screens]}
                showDetails={true}
                onRetry={() => setCurrentScreen(null)}
                onHome={() => setCurrentScreen(null)}
                onBack={() => setCurrentScreen(null)}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ErrorHandlingShowcase() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Sistema Elegante de Tratamento de Erros
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Demonstração completa de todas as funcionalidades do sistema de erros.
      </Typography>

      <Stack spacing={4}>
        <BasicErrorExample />
        <ApiCallExample />
        <FormSubmitExample />
        <DataFetcherExample />
        <ErrorScreensExample />
      </Stack>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          💡 Dicas para Implementação
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>Use <code>useElegantErrorManager</code> para controle completo</li>
            <li>Use <code>useApiCall</code> para chamadas simples de API</li>
            <li>Use <code>useFormSubmit</code> para formulários com validação</li>
            <li>Use <code>useDataFetcher</code> para dados com cache</li>
            <li>Use <code>ErrorDisplay</code> para exibição inteligente de erros</li>
            <li>Use <code>ErrorScreen</code> para telas dedicadas de erro</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
}
