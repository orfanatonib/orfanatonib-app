import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Container
                    maxWidth="sm"
                    sx={{
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
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
                                mb: 1,
                            }}
                        >
                            <AlertTriangle size={32} />
                        </Box>

                        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
                            Algo deu errado
                        </Typography>

                        <Typography variant="body1" color="text.secondary" paragraph>
                            Desculpe, encontramos um erro inesperado. Tente recarregar a página.
                        </Typography>

                        {import.meta.env.DEV && this.state.error && (
                            <Box
                                component="pre"
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    maxWidth: '100%',
                                    textAlign: 'left',
                                }}
                            >
                                {this.state.error.toString()}
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            startIcon={<RefreshCcw size={18} />}
                            onClick={this.handleReload}
                            sx={{ mt: 2 }}
                        >
                            Recarregar Página
                        </Button>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
