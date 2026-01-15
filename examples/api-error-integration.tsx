import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, Typography, Box, Stack, TextField, Alert } from '@mui/material';
import { useElegantErrorManager, useApiCall, useFormSubmit } from '@/hooks/error-handling';
import ErrorDisplay from '@/components/common/ErrorDisplay/ErrorDisplay';
import { handleError } from '@/utils/errorHandler';

// =============================================================================
// EXEMPLO 1: Tratamento Direto de Erros da API
// =============================================================================

function ApiErrorHandlingExample() {
  const { showError, showSuccess } = useElegantErrorManager({
    context: 'api-integration-example',
    enableSound: true,
  });

  // Simula diferentes tipos de erro da API
  const simulateApiError = async (errorType: string) => {
    try {
      let mockApiResponse;

      switch (errorType) {
        case 'rule-validation':
          mockApiResponse = {
            statusCode: 400,
            message: ['Email deve ser um endereço válido', 'Senha deve ter pelo menos 6 caracteres'],
            error: 'Bad Request',
            category: 'RULE',
            timestamp: new Date().toISOString(),
            path: '/api/auth/register',
            requestId: 'req-123456',
            correlationId: 'corr-123456789',
            details: {
              fields: {
                email: ['isEmail'],
                password: ['minLength']
              }
            }
          };
          break;

        case 'business-not-found':
          mockApiResponse = {
            statusCode: 404,
            message: 'O abrigo solicitado não foi encontrado',
            error: 'Not Found',
            category: 'BUSINESS',
            timestamp: new Date().toISOString(),
            path: '/api/shelters/999',
            requestId: 'req-123457',
            correlationId: 'corr-123456790',
          };
          break;

        case 'business-conflict':
          mockApiResponse = {
            statusCode: 409,
            message: 'Já existe um usuário com este email',
            error: 'Conflict',
            category: 'BUSINESS',
            timestamp: new Date().toISOString(),
            path: '/api/users',
            requestId: 'req-123458',
            correlationId: 'corr-123456791',
          };
          break;

        case 'server-error':
          mockApiResponse = {
            statusCode: 500,
            message: 'Erro interno do servidor',
            error: 'Internal Server Error',
            category: 'SERVER',
            timestamp: new Date().toISOString(),
            path: '/api/reports/generate',
            requestId: 'req-123459',
            correlationId: 'corr-123456792',
          };
          break;

        case 'auth-unauthorized':
          mockApiResponse = {
            statusCode: 401,
            message: 'Token de autenticação inválido ou expirado',
            error: 'Unauthorized',
            category: 'BUSINESS',
            timestamp: new Date().toISOString(),
            path: '/api/protected-route',
            requestId: 'req-123460',
            correlationId: 'corr-123456793',
          };
          break;

        case 'rate-limit':
          mockApiResponse = {
            statusCode: 429,
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
            error: 'Too Many Requests',
            category: 'RULE',
            timestamp: new Date().toISOString(),
            path: '/api/auth/login',
            requestId: 'req-123461',
            correlationId: 'corr-123456794',
            details: {
              retryAfter: 900
            }
          };
          break;

        default:
          throw new Error('Tipo de erro desconhecido');
      }

      // Simula erro da API sendo tratado pelo axios interceptor
      const mockError = {
        response: {
          data: mockApiResponse,
          status: mockApiResponse.statusCode,
        },
        config: { url: mockApiResponse.path },
      };

      // Trata o erro usando o sistema completo
      const appError = handleError(mockError, 'api-simulation');

      // O erro já foi mostrado automaticamente pelo handleError
      // Aqui podemos fazer ações adicionais se necessário

    } catch (error) {
      // Fallback para erros não previstos
      showError('Erro inesperado na simulação', {
        mode: 'snackbar',
      });
    }
  };

  return (
    <Card>
      <CardHeader title="Tratamento de Erros da API Orfanato NIB" />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Clique nos botões para simular diferentes tipos de erro retornados pela API:
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              🔵 Erros de Regra (RULE)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => simulateApiError('rule-validation')}
              >
                Validação de Campos
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => simulateApiError('rate-limit')}
              >
                Rate Limiting
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              🟡 Erros de Negócio (BUSINESS)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => simulateApiError('business-not-found')}
              >
                Recurso Não Encontrado
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => simulateApiError('business-conflict')}
              >
                Conflito de Dados
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => simulateApiError('auth-unauthorized')}
              >
                Não Autorizado
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              🔴 Erros do Servidor (SERVER)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => simulateApiError('server-error')}
              >
                Erro Interno 500
              </Button>
            </Stack>
          </Box>
        </Stack>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Como funciona:</strong> Cada botão simula uma resposta de erro real da API.
            O sistema identifica automaticamente a categoria e exibe a mensagem apropriada
            com ações contextuais (tentar novamente, fazer login, corrigir campos, etc.).
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXEMPLO 2: Integração com Hooks de API
// =============================================================================

function ApiHooksIntegrationExample() {
  const [currentEndpoint, setCurrentEndpoint] = useState<string>('/api/shelters');

  const { execute, isLoading, error } = useApiCall(
    async () => {
      // Simula chamada para diferentes endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simula erro baseado no endpoint
      if (currentEndpoint.includes('invalid')) {
        const mockError = {
          response: {
            data: {
              statusCode: 400,
              message: 'Parâmetros inválidos fornecidos',
              error: 'Bad Request',
              category: 'RULE',
              timestamp: new Date().toISOString(),
              path: currentEndpoint,
              requestId: 'req-simulated',
              correlationId: 'corr-simulated',
              details: {
                fields: {
                  shelterId: ['isUUID']
                }
              }
            },
            status: 400,
          }
        };
        throw mockError;
      }

      return { success: true, data: `Dados de ${currentEndpoint}` };
    },
    'api-hooks-example'
  );

  const [result, setResult] = useState<string>('');

  const callEndpoint = async (endpoint: string) => {
    setCurrentEndpoint(endpoint);
    const response = await execute();
    if (response) {
      setResult(response.data);
    }
  };

  return (
    <Card>
      <CardHeader title="Integração com Hooks de API" />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Teste chamadas de API com tratamento automático de erros:
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={() => callEndpoint('/api/shelters')}
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : 'Buscar Abrigos'}
            </Button>
            <Button
              variant="contained"
              onClick={() => callEndpoint('/api/invalid-endpoint')}
              disabled={isLoading}
            >
              Endpoint Inválido
            </Button>
          </Stack>

          {result && (
            <Alert severity="success">
              Resultado: {result}
            </Alert>
          )}

          {/* Erro será mostrado automaticamente pelo hook */}
          <ErrorDisplay error={error} context="api-hooks-example" />
        </Stack>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXEMPLO 3: Formulário com Validação da API
// =============================================================================

function FormWithApiValidationExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shelterId: '',
  });

  const { submit, isSubmitting, error } = useFormSubmit(
    async (data: typeof formData): Promise<void> => {
      // Simula validação da API
      const errors: string[] = [];

      if (!data.name.trim()) {
        errors.push('Nome é obrigatório');
      }
      if (!data.email.includes('@')) {
        errors.push('Email deve ser válido');
      }
      if (!data.shelterId.trim()) {
        errors.push('ID do abrigo é obrigatório');
      }

      if (errors.length > 0) {
        // Simula erro de validação da API
        const mockError = {
          response: {
            data: {
              statusCode: 400,
              message: errors,
              error: 'Bad Request',
              category: 'RULE',
              timestamp: new Date().toISOString(),
              path: '/api/users',
              requestId: 'req-form-validation',
              correlationId: 'corr-form-validation',
              details: {
                fields: {
                  name: !data.name.trim() ? ['isNotEmpty'] : [],
                  email: !data.email.includes('@') ? ['isEmail'] : [],
                  shelterId: !data.shelterId.trim() ? ['isNotEmpty'] : [],
                }
              }
            },
            status: 400,
          }
        };
        throw mockError;
      }

      // Simula sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    'user-registration-form',
    {
      showSuccessNotification: true,
      successMessage: 'Usuário cadastrado com sucesso!',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submit(formData);
    if (success) {
      setFormData({ name: '', email: '', shelterId: '' });
    }
  };

  return (
    <Card>
      <CardHeader title="Formulário com Validação da API" />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              error={error?.metadata?.details?.fields?.name?.length > 0}
              helperText={error?.metadata?.details?.fields?.name?.join(', ')}
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              error={error?.metadata?.details?.fields?.email?.length > 0}
              helperText={error?.metadata?.details?.fields?.email?.join(', ')}
            />

            <TextField
              label="ID do Abrigo"
              value={formData.shelterId}
              onChange={(e) => setFormData(prev => ({ ...prev, shelterId: e.target.value }))}
              required
              error={error?.metadata?.details?.fields?.shelterId?.length > 0}
              helperText={error?.metadata?.details?.fields?.shelterId?.join(', ')}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </Button>
          </Stack>
        </Box>

        {/* Erro será mostrado automaticamente com foco nos campos */}
        <ErrorDisplay error={error} context="user-registration-form" mode="inline" />
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function ApiIntegrationShowcase() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Integração com API Orfanato NIB
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Demonstração completa de como o sistema de erros se integra com a API documentada.
      </Typography>

      <Stack spacing={4}>
        <ApiErrorHandlingExample />
        <ApiHooksIntegrationExample />
        <FormWithApiValidationExample />
      </Stack>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          ✅ Funcionalidades Implementadas
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>Mapeamento correto das categorias RULE, BUSINESS, SERVER, PROCESS</li>
            <li>Tratamento específico por código HTTP (400, 401, 403, 404, 409, 422, 429, 5xx)</li>
            <li>Extração de requestId e correlationId para debugging</li>
            <li>Foco automático em campos com erro de validação</li>
            <li>Ações contextuais baseadas no tipo de erro</li>
            <li>Integração completa com hooks de API e formulários</li>
            <li>Mensagens de erro alinhadas com a documentação da API</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
}
