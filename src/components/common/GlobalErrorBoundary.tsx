import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper, Accordion, AccordionSummary, AccordionDetails, Chip, Divider, Alert } from '@mui/material';
import { RefreshCcw, AlertTriangle, Bug, Download, Info } from 'lucide-react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { logger } from '@/utils/logger';
import { createErrorBoundary } from '@/utils/errorHandler';
import type { ErrorBoundaryState } from '@/types/error';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showErrorReport?: boolean;
}

interface State extends ErrorBoundaryState {
    errorId: string;
    userAgent: string;
    url: string;
    timestamp: string;
    retryCount: number;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        userAgent: '',
        url: '',
        timestamp: '',
        retryCount: 0,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        const errorId = crypto.randomUUID();
        return {
            hasError: true,
            error,
            errorId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            retryCount: 0,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const errorId = this.state.errorId || crypto.randomUUID();

        this.setState({
            errorInfo,
            errorId,
        });

        logger.critical('Uncaught React error caught by boundary', {
            feature: 'error-boundary',
            action: 'uncaught-error',
            component: 'GlobalErrorBoundary',
            correlationId: errorId,
            metadata: {
                componentStack: errorInfo.componentStack,
                errorBoundary: 'GlobalErrorBoundary',
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                retryCount: this.state.retryCount,
            },
        }, error);

        this.props.onError?.(error, errorInfo);
    }

    private handleReload = () => {
        logger.info('User triggered page reload from error boundary', {
            feature: 'error-boundary',
            action: 'user-reload',
            correlationId: this.state.errorId,
            metadata: {
                retryCount: this.state.retryCount,
            },
        });
        window.location.reload();
    };

    private handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1,
        }));

        logger.info('User attempted to retry from error boundary', {
            feature: 'error-boundary',
            action: 'user-retry',
            correlationId: this.state.errorId,
            metadata: {
                retryCount: this.state.retryCount + 1,
            },
        });
    };

    private handleDownloadReport = () => {
        const report = {
            errorId: this.state.errorId,
            timestamp: this.state.timestamp,
            userAgent: this.state.userAgent,
            url: this.state.url,
            error: {
                name: this.state.error?.name,
                message: this.state.error?.message,
                stack: this.state.error?.stack,
            },
            componentStack: this.state.errorInfo?.componentStack,
            retryCount: this.state.retryCount,
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-report-${this.state.errorId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        logger.info('User downloaded error report', {
            feature: 'error-boundary',
            action: 'download-report',
            correlationId: this.state.errorId,
        });
    };

    public render() {
        if (this.props.fallback && this.state.hasError) {
            return this.props.fallback;
        }

        if (this.state.hasError) {
            const { error, errorInfo, errorId, timestamp, retryCount } = this.state;
            const isDev = import.meta.env.DEV;
            const showErrorReport = this.props.showErrorReport ?? isDev;

            return (
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: 'error.light',
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mb: 3,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'error.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'error.main',
                                }}
                            >
                                <AlertTriangle size={32} />
                            </Box>
                            <Box>
                                <Typography variant="h4" component="h1" fontWeight="bold" color="error.main">
                                    Ops! Algo deu errado
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Encontramos um erro inesperado na aplicação
                                </Typography>
                            </Box>
                        </Box>

                        <Alert severity="error" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>Erro ID:</strong> {errorId}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Data/Hora:</strong> {new Date(timestamp).toLocaleString('pt-BR')}
                            </Typography>
                            {retryCount > 0 && (
                                <Typography variant="body2">
                                    <strong>Tentativas de recuperação:</strong> {retryCount}
                                </Typography>
                            )}
                        </Alert>

                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<RefreshCcw size={18} />}
                                onClick={this.handleRetry}
                                disabled={retryCount >= 3}
                            >
                                {retryCount >= 3 ? 'Limite de tentativas atingido' : 'Tentar novamente'}
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<RefreshCcw size={18} />}
                                onClick={this.handleReload}
                            >
                                Recarregar página
                            </Button>

                            {showErrorReport && (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<Download size={18} />}
                                    onClick={this.handleDownloadReport}
                                >
                                    Baixar relatório
                                </Button>
                            )}
                        </Box>

                        {showErrorReport && (
                            <Accordion sx={{ mt: 3 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Bug size={18} />
                                        <Typography variant="h6">Detalhes técnicos</Typography>
                                        <Chip
                                            label="Debug"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {error && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Erro:
                                                </Typography>
                                                <Box
                                                    component="pre"
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontSize: '0.875rem',
                                                        overflow: 'auto',
                                                        maxHeight: '200px',
                                                    }}
                                                >
                                                    {error.toString()}
                                                </Box>
                                            </Box>
                                        )}

                                        {errorInfo?.componentStack && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Component Stack:
                                                </Typography>
                                                <Box
                                                    component="pre"
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        overflow: 'auto',
                                                        maxHeight: '300px',
                                                    }}
                                                >
                                                    {errorInfo.componentStack}
                                                </Box>
                                            </Box>
                                        )}

                                        <Divider />

                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Informações do ambiente:
                                            </Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, fontSize: '0.875rem' }}>
                                                <strong>URL:</strong>
                                                <span>{this.state.url}</span>
                                                <strong>User Agent:</strong>
                                                <span>{this.state.userAgent}</span>
                                                <strong>Timestamp:</strong>
                                                <span>{this.state.timestamp}</span>
                                            </Box>
                                        </Box>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Info size={16} />
                                Se o problema persistir, entre em contato com o suporte técnico mencionando o ID do erro acima.
                            </Typography>
                        </Box>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
